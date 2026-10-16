import { createHash } from 'node:crypto';
import { LocalSqliteBridgeService } from '../d1/local-sqlite-bridge.service';
import type { D1BridgeParameter } from '../d1/d1-worker-bridge.service';

export type LocalDurableJob = {
  id: string; queue: string; logicalKey: string; envelope: string; contentHash: string;
  state: 'PENDING' | 'COMPLETED' | 'FAILED'; attempts: number; generation: number; generationAttempts: number;
  availableAt: number; leaseToken: string | null; leaseUntil: number | null;
  lastError: string | null; createdAt: number; updatedAt: number; completedAt: number | null;
};
type FailedDurableJob = Pick<LocalDurableJob, 'id'|'queue'|'logicalKey'|'state'|'generation'|'attempts'|'generationAttempts'|'availableAt'|'leaseUntil'|'lastError'|'updatedAt'>;
type ReplayedDurableJob = Pick<LocalDurableJob, 'id'|'queue'|'logicalKey'|'generation'|'attempts'|'generationAttempts'|'availableAt'>;
type DurableJobReplayHistory = {generation:number;attempts:number;generationAttempts:number;lastError:string|null;replayedAt:number};
const QUEUES = new Set(['domain-events', 'notifications', 'integration-jobs']);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const integer = (value: number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error('Invalid bounded journal integer');
};

/** VPS-only durable dispatch journal, sharing the financial bridge connection.
 * Apply the additive local schema before activation. Valkey is only transport.
 * Each claim MUST use a fresh random token. Effects remain domain-idempotent:
 * a lease fences journal acknowledgments, not an external provider operation.
 */
export class LocalDurableJobStore {
  constructor(private readonly bridge: LocalSqliteBridgeService) {}

  async record(queue: string, key: string, envelope: unknown, now: number): Promise<{id: string; replayed: boolean}> {
    integer(now);
    if (!QUEUES.has(queue) || typeof key !== 'string' || !key.length || key.length > 512) throw new Error('Invalid queue identity');
    const body = JSON.stringify(envelope, (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]])) : value);
    if (!body || Buffer.byteLength(body) > 1_048_576) throw new Error('Invalid bounded journal content');
    const id = hash(JSON.stringify([queue, key])); const contentHash = hash(body);
    const result = await this.bridge.batch([
      {sql: 'INSERT INTO LocalDurableJob (id,queue,logicalKey,envelope,contentHash,availableAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(queue,logicalKey) DO NOTHING', params:[id,queue,key,body,contentHash,now,now,now]},
      {sql:'SELECT * FROM LocalDurableJob WHERE queue = ? AND logicalKey = ?', params:[queue,key]},
    ]);
    const row = result.results[1].results?.[0] as LocalDurableJob;
    if (!row || row.contentHash !== contentHash) throw new Error('Conflicting durable job content');
    return {id:row.id, replayed:result.results[0].meta?.changes === 0};
  }

  async pending(now: number, limit = 10): Promise<LocalDurableJob[]> {
    integer(now); integer(limit, 1, 1000);
    return (await this.bridge.select<LocalDurableJob>(
      "SELECT * FROM LocalDurableJob WHERE state = 'PENDING' AND availableAt <= ? AND (leaseUntil IS NULL OR leaseUntil <= ?) ORDER BY availableAt,id LIMIT ?", [now,now,limit])).results;
  }

  private async update(sql: string, params: D1BridgeParameter[]): Promise<LocalDurableJob | null> {
    const result = await this.bridge.batch([{sql,params}]);
    return (result.results[0].results?.[0] as LocalDurableJob) ?? null;
  }

  async claim(id: string, token: string, now: number, leaseMs: number): Promise<LocalDurableJob | null> {
    integer(now); integer(leaseMs, 1, 3_600_000); integer(now + leaseMs);
    if (typeof token !== 'string' || !token.length || token.length > 128) throw new Error('Fresh lease token required');
    return this.update("UPDATE LocalDurableJob SET leaseToken = ?, leaseUntil = ?, attempts = attempts + 1, generationAttempts = generationAttempts + 1, updatedAt = ? WHERE id = ? AND state = 'PENDING' AND availableAt <= ? AND (leaseUntil IS NULL OR leaseUntil <= ?) RETURNING *", [token,now+leaseMs,now,id,now,now]);
  }

  async complete(id: string, token: string, now: number): Promise<boolean> {
    integer(now);
    return !!await this.update("UPDATE LocalDurableJob SET state = 'COMPLETED', completedAt = ?, updatedAt = ?, leaseToken = NULL, leaseUntil = NULL WHERE id = ? AND state = 'PENDING' AND leaseToken = ? AND leaseUntil > ? RETURNING *", [now,now,id,token,now]);
  }

  async retry(id: string, token: string, now: number, nextAt: number, errorCode: string, maxAttempts = 6): Promise<boolean> {
    integer(now); integer(nextAt,now); integer(maxAttempts,1,100);
    if (!/^[A-Z0-9_]{1,160}$/.test(errorCode)) throw new Error('Bounded non-sensitive error code required');
    return !!await this.update("UPDATE LocalDurableJob SET state = CASE WHEN generationAttempts >= ? THEN 'FAILED' ELSE 'PENDING' END, availableAt = ?, updatedAt = ?, lastError = ?, leaseToken = NULL, leaseUntil = NULL WHERE id = ? AND state = 'PENDING' AND leaseToken = ? AND leaseUntil > ? RETURNING *", [maxAttempts,nextAt,now,errorCode,id,token,now]);
  }

  async failed(limit = 100): Promise<FailedDurableJob[]> {
    integer(limit,1,500);
    return (await this.bridge.select<FailedDurableJob>(
      "SELECT id,queue,logicalKey,state,generation,attempts,generationAttempts,availableAt,leaseUntil,lastError,updatedAt FROM LocalDurableJob WHERE state = 'FAILED' ORDER BY updatedAt,id LIMIT ?", [limit])).results;
  }

  async replayFailed(id: string, expectedGeneration: number, now: number): Promise<ReplayedDurableJob | null> {
    integer(now); integer(expectedGeneration);
    const result = await this.bridge.batch([
      {sql:"INSERT INTO LocalDurableJobReplayHistory (journalId,generation,attempts,generationAttempts,lastError,replayedAt) SELECT id,generation,attempts,generationAttempts,lastError,? FROM LocalDurableJob WHERE id = ? AND state = 'FAILED' AND generation = ? ON CONFLICT(journalId,generation) DO NOTHING",params:[now,id,expectedGeneration]},
      {sql:"UPDATE LocalDurableJob SET state = 'PENDING',generation = generation + 1,generationAttempts = 0,availableAt = ?,leaseToken = NULL,leaseUntil = NULL,completedAt = NULL,updatedAt = ? WHERE id = ? AND state = 'FAILED' AND generation = ? RETURNING id,queue,logicalKey,generation,attempts,generationAttempts,availableAt",params:[now,now,id,expectedGeneration]},
    ]);
    return (result.results[1].results?.[0] as ReplayedDurableJob) ?? null;
  }

  async replayHistory(id: string): Promise<DurableJobReplayHistory[]> {
    return (await this.bridge.select<DurableJobReplayHistory>(
      "SELECT generation,attempts,generationAttempts,lastError,replayedAt FROM LocalDurableJobReplayHistory WHERE journalId = ? ORDER BY generation",[id])).results;
  }
}
