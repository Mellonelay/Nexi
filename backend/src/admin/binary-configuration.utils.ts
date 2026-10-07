import { BadRequestException } from "@nestjs/common";

export function assertBinaryDurationUnchanged(durationSeconds: number, sourceDurationSeconds: number): void {
  if (durationSeconds !== sourceDurationSeconds)
    throw new BadRequestException("Binary duration records cannot be moved");
}

export function resolveBinaryEnabled(enabled: boolean | undefined, current: unknown): boolean {
  return enabled ?? (current === true || current === 1);
}

export function latestBinaryConfigurationRows<T extends { pair: string; durationSeconds: number }>(rows: T[]): T[] {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.pair}:${row.durationSeconds}`;
    if (!latest.has(key)) latest.set(key, row);
  }
  return [...latest.values()];
}
