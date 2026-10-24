import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import {
  SupportAttachmentStorageService,
  SUPPORT_ATTACHMENT_MAX_BYTES,
  SUPPORT_ATTACHMENT_MAX_COUNT,
  type SupportUpload,
} from '../../src/communications/support-attachment-storage.service';

describe('SupportAttachmentStorageService', () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
  let root: string;
  let service: SupportAttachmentStorageService;

  const file = (overrides: Partial<SupportUpload> = {}): SupportUpload => ({
    buffer: png,
    originalname: 'receipt.png',
    mimetype: 'image/png',
    size: png.length,
    ...overrides,
  });

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'nexi-support-attachments-'));
    const config = { get: (key: string) => ({
      NEXI_LOCAL_OBJECTS_ENABLED: 'true',
      NEXI_LOCAL_OBJECTS_ROOT: root,
    }[key]) };
    service = new SupportAttachmentStorageService(config as any);
  });

  afterEach(async () => rm(root, { recursive: true, force: true }));

  it('stores signed content under an owner-isolated directory with private file modes', async () => {
    const attachment = await service.upload('user/one', file({ originalname: '../../proof.png' }));

    expect(attachment).toMatchObject({ name: 'proof.png', mimeType: 'image/png', size: png.length });
    await expect(service.read('user/one', attachment.id)).resolves.toMatchObject({ attachment, body: png });
    await expect(service.read('user/two', attachment.id)).rejects.toBeInstanceOf(ServiceUnavailableException);

    const directories = await readdir(join(root, 'message-attachments'));
    expect(directories).toHaveLength(1);
    const directory = join(root, 'message-attachments', directories[0]);
    expect((await stat(join(directory, `${attachment.id}.bin`))).mode & 0o777).toBe(0o600);
    expect((await stat(join(directory, `${attachment.id}.json`))).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(join(directory, `${attachment.id}.json`), 'utf8')).ownerId).toBe('user/one');
  });

  it('requires enabled storage rooted at an absolute non-symlink path', async () => {
    service = new SupportAttachmentStorageService({ get: (key: string) => key === 'NEXI_LOCAL_OBJECTS_ENABLED' ? 'false' : root } as any);
    await expect(service.upload('user-1', file())).rejects.toBeInstanceOf(ServiceUnavailableException);

    const link = join(root, 'root-link');
    await symlink(root, link);
    service = new SupportAttachmentStorageService({ get: (key: string) => key === 'NEXI_LOCAL_OBJECTS_ENABLED' ? 'true' : link } as any);
    await expect(service.upload('user-1', file())).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects empty, oversized, unsupported, and signature-mismatched uploads', async () => {
    await expect(service.upload('user-1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.upload('user-1', file({ buffer: Buffer.alloc(SUPPORT_ATTACHMENT_MAX_BYTES + 1) })))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.upload('user-1', file({ mimetype: 'text/plain' }))).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.upload('user-1', file({ mimetype: 'image/jpeg' }))).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.upload('user-1', file({ originalname: '   ' }))).rejects.toBeInstanceOf(BadRequestException);
    await expect(readdir(join(root, 'message-attachments'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('limits pending uploads by count and excludes already referenced uploads', async () => {
    const pending = [];
    for (let i = 0; i < SUPPORT_ATTACHMENT_MAX_COUNT; i += 1) pending.push(await service.upload('user-1', file()));
    await expect(service.upload('user-1', file())).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.upload('user-1', file(), new Set([pending[0].id]))).resolves.toMatchObject({ mimeType: 'image/png' });
  });

  it('resolves unique existing IDs and rejects duplicates, excess IDs, and expired uploads', async () => {
    const attachment = await service.upload('user-1', file());
    await expect(service.resolve('user-1', [attachment.id])).resolves.toEqual([attachment]);
    await expect(service.resolve('user-1', [attachment.id, attachment.id])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.resolve('user-1', Array(SUPPORT_ATTACHMENT_MAX_COUNT + 1).fill(attachment.id)))
      .rejects.toBeInstanceOf(BadRequestException);

    const directory = join(root, 'message-attachments', (await readdir(join(root, 'message-attachments')))[0]);
    const metadataPath = join(directory, `${attachment.id}.json`);
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    metadata.createdAt = Date.now() - 24 * 60 * 60 * 1000 - 1;
    await writeFile(metadataPath, JSON.stringify(metadata));
    await expect(service.resolve('user-1', [attachment.id])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cleans expired unreferenced uploads but preserves referenced uploads', async () => {
    const referenced = await service.upload('user-1', file());
    const expired = await service.upload('user-1', file());
    const directory = join(root, 'message-attachments', (await readdir(join(root, 'message-attachments')))[0]);
    const metadataPath = join(directory, `${expired.id}.json`);
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    metadata.createdAt = Date.now() - 24 * 60 * 60 * 1000 - 1;
    await writeFile(metadataPath, JSON.stringify(metadata));

    await service.cleanupExpired('user-1', new Set([referenced.id]));
    await expect(service.read('user-1', referenced.id)).resolves.toMatchObject({ attachment: referenced });
    await expect(service.read('user-1', expired.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an object replaced with a symlink after metadata validation', async () => {
    const attachment = await service.upload('user-1', file());
    const ownerDirectory = jest.spyOn(service as any, 'ownerDirectory');
    const ownerPath = join(root, 'message-attachments', (await readdir(join(root, 'message-attachments')))[0]);
    const objectPath = join(ownerPath, `${attachment.id}.bin`);
    const outsideOwnerDirectory = join(root, 'outside-owner');
    const targetPath = join(outsideOwnerDirectory, 'target.png');
    await mkdir(outsideOwnerDirectory);
    await writeFile(targetPath, png);

    ownerDirectory.mockImplementation(async () => {
      if (ownerDirectory.mock.calls.length === 2) {
        await rm(objectPath);
        await symlink(targetPath, objectPath);
      }
      return ownerPath;
    });

    await expect(service.read('user-1', attachment.id)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps same-size corrupted stored content to a storage error', async () => {
    const attachment = await service.upload('user-1', file());
    const directory = join(root, 'message-attachments', (await readdir(join(root, 'message-attachments')))[0]);
    await writeFile(join(directory, `${attachment.id}.bin`), Buffer.alloc(png.length));

    await expect(service.read('user-1', attachment.id)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
