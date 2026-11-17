import { BadRequestException, ConflictException } from "@nestjs/common";
import { createHash } from "node:crypto";

export type AdminMutationReplayCommand = {
  action: string;
  actionAliases?: string[];
  identityScope?: string;
  adminId: string;
  reason: string;
  idempotencyKey: string;
  target?: string;
  payload: unknown;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function parseDetails(value: unknown): Record<string, unknown> {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // A matching but unreadable replay record must fail closed below.
  }
  throw new ConflictException("Original Admin mutation receipt is unreadable");
}

function mutationAuditId(command: AdminMutationReplayCommand): string {
  const digest = createHash("sha256")
    .update(
      JSON.stringify([
        command.identityScope ?? command.action,
        command.adminId,
        command.idempotencyKey,
      ]),
    )
    .digest("hex");
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    "5" + digest.slice(13, 16),
    "8" + digest.slice(17, 20),
    digest.slice(20, 32),
  ].join("-");
}

async function findReplay(tx: any, command: AdminMutationReplayCommand) {
  const actions = [...new Set([command.action, ...(command.actionAliases ?? [])])];
  const candidates = await tx.adminAuditLog.findMany({
    where: {
      adminId: command.adminId,
      action: { in: actions },
      details: { contains: JSON.stringify(command.idempotencyKey) },
    },
    orderBy: { createdAt: "desc" },
  });

  const matches = candidates.flatMap((candidate: any) => {
    const details = parseDetails(candidate.details);
    return details.idempotencyKey === command.idempotencyKey
      ? [{ candidate, details }]
      : [];
  });
  if (matches.length > 1) {
    throw new ConflictException(
      "Multiple Admin mutation receipts exist for this idempotency key",
    );
  }
  const match = matches[0];
  if (!match) return null;
  const { candidate, details } = match;

  if (
    candidate.adminId !== command.adminId ||
    candidate.action !== command.action ||
    (command.target !== undefined && candidate.target !== command.target) ||
    details.reason !== command.reason
  ) {
    throw new ConflictException(
      "Admin mutation key belongs to a different original request",
    );
  }

  // Legacy receipts without the effective payload cannot prove that a retry
  // carries the same intent. Stop for reconciliation instead of claiming a
  // replay result from incomplete historical identity.
  if (details.payload === undefined) {
    throw new ConflictException(
      "Legacy Admin mutation receipt lacks intent data; reconcile before retrying",
    );
  }
  if (canonicalJson(details.payload) !== canonicalJson(command.payload)) {
    throw new ConflictException(
      "Admin mutation key was reused with a different request payload",
    );
  }

  return { ...candidate, parsedDetails: details };
}

function isUniqueConstraintFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: unknown;
    sqlState?: unknown;
    message?: unknown;
  };
  return (
    candidate.code === "P2002" ||
    candidate.sqlState === "23505" ||
    (typeof candidate.message === "string" &&
      /unique constraint failed/i.test(candidate.message))
  );
}

export async function executeAdminMutation<T extends Record<string, any>>(
  prisma: any,
  command: AdminMutationReplayCommand,
  apply: (tx: any) => Promise<T>,
  targetOf: (result: T) => string,
  readback: (tx: any, target: string) => Promise<T | null>,
): Promise<T & { auditId: string; replayed?: true }> {
  if (!command.reason?.trim() || !command.idempotencyKey?.trim()) {
    throw new BadRequestException(
      "Admin mutations require a reason and idempotency key",
    );
  }

  const auditId = mutationAuditId(command);
  const replayResult = async (tx: any, previous: any) => {
    const target = String(previous.target ?? command.target ?? "");
    if (!target) {
      throw new ConflictException(
        "Original Admin mutation receipt has no target",
      );
    }
    const current = await readback(tx, target);
    if (!current) {
      throw new ConflictException(
        "Original Admin mutation target cannot be read back",
      );
    }
    return { ...current, auditId: previous.id, replayed: true as const };
  };

  const execute = async (tx: any) => {
    const previous = await findReplay(tx, command);
    if (previous) return replayResult(tx, previous);

    const result = await apply(tx);
    const target = command.target ?? targetOf(result);
    const audit = await tx.adminAuditLog.create({
      data: {
        id: auditId,
        adminId: command.adminId,
        action: command.action,
        target,
        details: JSON.stringify({
          reason: command.reason,
          idempotencyKey: command.idempotencyKey,
          payload: canonicalize(command.payload),
        }),
      },
    });
    return { ...result, auditId: audit.id };
  };

  try {
    return await prisma.$transaction(execute);
  } catch (error) {
    if (!isUniqueConstraintFailure(error)) throw error;
    const previous = await findReplay(prisma, command);
    if (!previous) throw error;
    return replayResult(prisma, previous);
  }
}
