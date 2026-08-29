export type NexiEventEnvelope = {
  type: string;
  version: number;
  idempotencyKey: string;
  correlationId: string;
  payload: Record<string, unknown>;
};

export function isNexiEventEnvelope(
  value: unknown,
): value is NexiEventEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.type === "string" &&
    event.type.length > 0 &&
    event.type.length <= 160 &&
    Number.isInteger(event.version) &&
    Number(event.version) > 0 &&
    typeof event.idempotencyKey === "string" &&
    event.idempotencyKey.length > 0 &&
    event.idempotencyKey.length <= 160 &&
    typeof event.correlationId === "string" &&
    event.correlationId.length > 0 &&
    event.correlationId.length <= 160 &&
    !!event.payload &&
    typeof event.payload === "object" &&
    !Array.isArray(event.payload)
  );
}
