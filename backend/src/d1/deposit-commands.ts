import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../prisma/d1-client';
import type { D1WorkerBridgeService, D1BridgeBatchStatement } from './d1-worker-bridge.service';

export type DepositClaimSubmission = { id:string; userId:string; asset:string; network:string; depositAddressId:string; claimedAmount:string; proofObjectKey:string; txHash?:string; idempotencyKey:string };
export function assertDepositClaimReview(state: string): void {
  if (state !== 'PENDING_REVIEW') throw new BadRequestException('Deposit claim is not pending review');
}

export function depositClaimSubmissionStatements(command: DepositClaimSubmission, address: {symbol:string; network:string; address:string}, outbox: D1BridgeBatchStatement): D1BridgeBatchStatement[] {
  return [
      {
        sql: `INSERT INTO "DepositClaim" ("id","userId","asset","network","depositAddressId","destinationAddressSnapshot","claimedAmount","proofObjectKey","txHash","state","idempotencyKey","submittedAt") VALUES (?,?,?,?,?,?,?,?,?,'PENDING_REVIEW',?,CURRENT_TIMESTAMP)`,
        params: [
          command.id,
          command.userId,
          address.symbol,
          String(address.network),
          command.depositAddressId,
          address.address,
          command.claimedAmount,
          command.proofObjectKey,
          command.txHash ?? null,
          command.idempotencyKey,
        ],
      },
      {
        sql: `INSERT INTO "Gate2OperationAudit" ("id","userId","operationType","operationId","eventType","idempotencyKey","details","createdAt") VALUES (?,?, 'DEPOSIT_CLAIM',?,'DEPOSIT_CLAIM_SUBMITTED',?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.userId,
          command.id,
          command.idempotencyKey,
          JSON.stringify({
            asset: address.symbol,
            network: String(address.network),
          }),
        ],
      },
      outbox,
    ];
}

type ClaimMutation = {update: D1BridgeBatchStatement; adminId:string; id:string; action:string; details:Record<string,unknown>; outbox:D1BridgeBatchStatement};
function depositClaimMutationStatements(input: ClaimMutation): D1BridgeBatchStatement[] {
  return [input.update, {
    sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,?,?,?,CURRENT_TIMESTAMP WHERE changes()=1`,
    params: [randomUUID(),input.adminId,input.action,input.id,JSON.stringify(input.details)],
  }, input.outbox];
}
export function depositClaimReviewStatements({id,state,adminId,reason,idempotencyKey}: {id:string; state:string; adminId:string; reason:string; idempotencyKey:string}, outbox:D1BridgeBatchStatement): D1BridgeBatchStatement[] {
  return depositClaimMutationStatements({id,adminId,action:`DEPOSIT_CLAIM_${state}`,details:{reason,idempotencyKey},outbox,
    update:{sql:`UPDATE "DepositClaim" SET "state"=?,"reviewedAt"=CURRENT_TIMESTAMP,"reviewedBy"=?,"reviewReason"=? WHERE "id"=? AND "state"='PENDING_REVIEW'`,params:[state,adminId,reason,id]},
  });
}
export function depositClaimCreditStatements({id,postingId,adminId,reason,idempotencyKey}: {id:string; postingId:string; adminId:string; reason:string; idempotencyKey:string}, outbox:D1BridgeBatchStatement): D1BridgeBatchStatement[] {
  return depositClaimMutationStatements({id,adminId,action:'DEPOSIT_CLAIM_CREDITED',details:{reason,idempotencyKey,postingId},outbox,
    update:{sql:`UPDATE "DepositClaim" SET "state"='CREDITED',"creditedLedgerPostingId"=?,"reviewedAt"=COALESCE("reviewedAt",CURRENT_TIMESTAMP),"reviewedBy"=COALESCE("reviewedBy",?),"reviewReason"=COALESCE("reviewReason",?) WHERE "id"=? AND "state"='APPROVED'`,params:[postingId,adminId,reason,id]},
  });
}

function parseDepositClaimAmount(amountValue:string): Prisma.Decimal {
  if (!/^[0-9]+(?:[.][0-9]{1,18})?$/.test(amountValue)) throw new BadRequestException('Deposit amount is invalid');
  const amount = new Prisma.Decimal(amountValue);
  if (!amount.isFinite() || !amount.isPositive()) throw new BadRequestException('Deposit amount is outside configured limits');
  return amount;
}
export function validateDepositClaimAmount({amountValue, minimumValue, maximumValue}: {amountValue:string; minimumValue:string; maximumValue:string}): void {
  const amount = parseDepositClaimAmount(amountValue);
  if (amount.lt(minimumValue) || amount.gt(maximumValue)) throw new BadRequestException('Deposit amount is outside configured limits');
}
export function assertDepositClaimDestination(address: {minDeposit:string; maxDeposit:string} | undefined, amountValue:string): void {
  if (!address) throw new BadRequestException('Deposit destination is unavailable');
  validateDepositClaimAmount({amountValue, minimumValue:String(address.minDeposit), maximumValue:String(address.maxDeposit)});
}
export async function readDepositClaim({bridge,id}: {bridge:D1WorkerBridgeService; id:string}): Promise<Record<string,unknown>> {
  const row = await bridge.select<Record<string,unknown>>('SELECT * FROM "DepositClaim" WHERE "id"=? LIMIT 1',[id]);
  if (!row.results[0]) throw new BadRequestException('D1 deposit claim was not materialized');
  return row.results[0];
}

export interface D1DepositObservationCommand {
  userId: string;
  asset: string;
  network: string;
  address: string;
  txHash: string;
  amount: string;
  confirmations: number;
  requiredConfirmations: number;
  observationKey: string;
}
