import type { D1WorkerBridgeService } from './d1-worker-bridge.service';

type IdempotentCommandTable = 'AdminGovernanceCommand' | 'DepositClaim';

export async function findCommandByIdempotencyKey(
  bridge: D1WorkerBridgeService,
  table: IdempotentCommandTable,
  idempotencyKey: string,
): Promise<Record<string, unknown> | null> {
  const result = await bridge.select<Record<string, unknown>>(
    `SELECT * FROM "${table}" WHERE "idempotencyKey"=? LIMIT 1`,
    [idempotencyKey],
  );
  return result.results[0] ?? null;
}
