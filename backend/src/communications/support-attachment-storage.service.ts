import { constants } from 'node:fs';
import { lstat, mkdir, open, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { basename, isAbsolute, join, sep } from 'node:path';
import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SUPPORT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const SUPPORT_ATTACHMENT_MAX_COUNT = 4;
export const SUPPORT_ATTACHMENT_MAX_STAGED_BYTES = SUPPORT_ATTACHMENT_MAX_BYTES * SUPPORT_ATTACHMENT_MAX_COUNT;
const EXPIRED_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;
const ATTACHMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SupportAttachment = { id: string; name: string; mimeType: string; size: number };
export type SupportUpload = { buffer: Buffer; originalname: string; mimetype: string; size: number };

type StoredAttachment = SupportAttachment & { ownerId: string; createdAt: number };

function contentType(body: Buffer, declared: string): string {
  const type = declared.split(';', 1)[0].trim().toLowerCase();
  const png = body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  const webp = body.length >= 12 && body.toString('ascii', 0, 4) === 'RIFF' && body.toString('ascii', 8, 12) === 'WEBP';
  const pdf = body.length >= 5 && body.toString('ascii', 0, 5) === '%PDF-';
  if ((type === 'image/png' && png) || (type === 'image/jpeg' && jpeg) ||
      (type === 'image/webp' && webp) || (type === 'application/pdf' && pdf)) return type;
  throw new BadRequestException('Attachments must be a valid PNG, JPEG, WebP, or PDF file');
}

@Injectable()
export class SupportAttachmentStorageService {
  constructor(private readonly config: ConfigService = new ConfigService()) {}

  private async ownerDirectory(ownerId: string, create = false): Promise<string> {
    const root = this.config.get<string>('NEXI_LOCAL_OBJECTS_ROOT');
    if (this.config.get<string>('NEXI_LOCAL_OBJECTS_ENABLED') !== 'true' || !root || !isAbsolute(root)) {
      throw new ServiceUnavailableException('Private message attachment storage is unavailable');
    }
    try {
      if ((await lstat(root)).isSymbolicLink()) throw new Error('Object root symlink');
      const rootPath = await realpath(root);
      const directory = join(rootPath, 'message-attachments', createHash('sha256').update(ownerId).digest('hex'));
      if (create) await mkdir(directory, { recursive: true, mode: 0o700 });
      const actualDirectory = await realpath(directory);
      if (!actualDirectory.startsWith(`${rootPath}${sep}`)) throw new Error('Unsafe attachment directory');
      return actualDirectory;
    } catch {
      throw new ServiceUnavailableException('Private message attachment storage is unavailable');
    }
  }

  private async readRegularFile(path: string): Promise<Buffer> {
    const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      if (!(await handle.stat()).isFile()) throw new Error('Expected a regular private file');
      return await handle.readFile();
    } finally {
      await handle.close();
    }
  }

  private async metadata(ownerId: string, id: string): Promise<StoredAttachment> {
    if (!ATTACHMENT_ID.test(id)) throw new NotFoundException('Attachment not found');
    const directory = await this.ownerDirectory(ownerId);
    try {
      const path = join(directory, `${id}.json`);
      if ((await lstat(path)).isSymbolicLink()) throw new Error('Unsafe attachment metadata');
      const data = JSON.parse((await this.readRegularFile(path)).toString('utf8')) as StoredAttachment;
      if (data.id !== id || data.ownerId !== ownerId || !Number.isSafeInteger(data.createdAt)) throw new Error('Invalid attachment metadata');
      const objectPath = join(directory, `${id}.bin`);
      const objectStat = await lstat(objectPath);
      if (!objectStat.isFile() || objectStat.isSymbolicLink() || objectStat.size !== data.size) throw new Error('Invalid attachment object');
      return data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new NotFoundException('Attachment not found');
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException('Private message attachment is unavailable');
    }
  }

  async upload(ownerId: string, file?: SupportUpload, referencedIds: ReadonlySet<string> = new Set()): Promise<SupportAttachment> {
    if (!file?.buffer?.length) throw new BadRequestException('An attachment file is required');
    if (file.buffer.length > SUPPORT_ATTACHMENT_MAX_BYTES) throw new BadRequestException('Attachment exceeds the 5 MiB limit');
    const mimeType = contentType(file.buffer, file.mimetype);
    const name = basename(file.originalname.replace(/\\/g, '/')).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
    if (!name) throw new BadRequestException('Attachment filename is invalid');
    const directory = await this.ownerDirectory(ownerId, true);
    const entries = await readdir(directory);
    let stagedCount = 0;
    let stagedBytes = 0;
    for (const entry of entries.filter((item) => item.endsWith('.json'))) {
      const id = entry.slice(0, -5);
      if (referencedIds.has(id) || !ATTACHMENT_ID.test(id)) continue;
      try {
        const item = JSON.parse((await this.readRegularFile(join(directory, entry))).toString('utf8')) as StoredAttachment;
        if (item.ownerId === ownerId && Date.now() - item.createdAt <= EXPIRED_UPLOAD_AGE_MS) {
          stagedCount += 1;
          stagedBytes += item.size;
        }
      } catch { /* Ignore an incomplete sidecar; a later sweep can clean it. */ }
    }
    if (stagedCount >= SUPPORT_ATTACHMENT_MAX_COUNT || stagedBytes + file.buffer.length > SUPPORT_ATTACHMENT_MAX_STAGED_BYTES) {
      throw new BadRequestException('Send or remove pending attachments before uploading more');
    }
    const id = randomUUID();
    const path = join(directory, `${id}.bin`);
    const metadataPath = join(directory, `${id}.json`);
    const record: StoredAttachment = { id, ownerId, name, mimeType, size: file.buffer.length, createdAt: Date.now() };
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    try {
      handle = await open(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
      await handle.writeFile(file.buffer);
      await writeFile(metadataPath, JSON.stringify(record), { flag: 'wx', mode: 0o600 });
      return { id, name, mimeType, size: record.size };
    } catch {
      await rm(path, { force: true }).catch(() => undefined);
      await rm(metadataPath, { force: true }).catch(() => undefined);
      throw new ServiceUnavailableException('Private message attachment could not be stored');
    } finally {
      await handle?.close();
    }
  }

  async resolve(ownerId: string, ids: string[] = []): Promise<SupportAttachment[]> {
    if (ids.length > SUPPORT_ATTACHMENT_MAX_COUNT || new Set(ids).size !== ids.length) {
      throw new BadRequestException(`A message may include up to ${SUPPORT_ATTACHMENT_MAX_COUNT} unique attachments`);
    }
    return Promise.all(ids.map(async (id) => {
      const item = await this.metadata(ownerId, id);
      if (Date.now() - item.createdAt > EXPIRED_UPLOAD_AGE_MS) throw new NotFoundException('Attachment upload expired');
      return { id: item.id, name: item.name, mimeType: item.mimeType, size: item.size };
    }));
  }

  async read(ownerId: string, id: string): Promise<{ attachment: SupportAttachment; body: Buffer }> {
    const attachment = await this.metadata(ownerId, id);
    let body: Buffer;
    try { body = await this.readRegularFile(join(await this.ownerDirectory(ownerId), `${id}.bin`)); }
    catch { throw new ServiceUnavailableException('Private message attachment could not be read'); }
    let actualMimeType: string;
    try { actualMimeType = contentType(body, attachment.mimeType); }
    catch { throw new ServiceUnavailableException('Private message attachment failed integrity validation'); }
    if (body.length !== attachment.size || actualMimeType !== attachment.mimeType) {
      throw new ServiceUnavailableException('Private message attachment failed integrity validation');
    }
    return { attachment: { id, name: attachment.name, mimeType: attachment.mimeType, size: attachment.size }, body };
  }

  async cleanupExpired(ownerId: string, referencedIds: ReadonlySet<string>): Promise<void> {
    const directory = await this.ownerDirectory(ownerId, true);
    let entries: string[];
    try { entries = await readdir(directory); }
    catch { return; }
    const now = Date.now();
    for (const entry of entries.filter((name) => name.endsWith('.json')).slice(0, 100)) {
      const id = entry.slice(0, -5);
      if (referencedIds.has(id) || !ATTACHMENT_ID.test(id)) continue;
      const metaPath = join(directory, entry);
      try {
        if ((await lstat(metaPath)).isSymbolicLink()) continue;
        const record = JSON.parse((await this.readRegularFile(metaPath)).toString('utf8')) as StoredAttachment;
        if (record.ownerId !== ownerId || now - record.createdAt <= EXPIRED_UPLOAD_AGE_MS) continue;
        const bodyPath = join(directory, `${id}.bin`);
        const bodyStat = await lstat(bodyPath);
        if (!bodyStat.isFile() || bodyStat.isSymbolicLink()) continue;
        await rm(bodyPath);
        await rm(metaPath);
      } catch { /* A later bounded sweep can retry an incomplete cleanup. */ }
    }
    for (const entry of entries.filter((name) => name.endsWith('.bin')).slice(0, 100)) {
      const id = entry.slice(0, -4);
      if (!ATTACHMENT_ID.test(id) || entries.includes(`${id}.json`)) continue;
      try {
        const path = join(directory, entry);
        const object = await lstat(path);
        if (object.isFile() && !object.isSymbolicLink() && now - object.mtimeMs > EXPIRED_UPLOAD_AGE_MS) await rm(path);
      } catch { /* A later bounded sweep can retry an incomplete cleanup. */ }
    }
  }
}
