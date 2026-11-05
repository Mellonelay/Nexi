import { AdminService } from "../../src/admin/admin.service";

describe("Admin Binary pair availability", () => {
  it("pauses and resumes by appending versions, preserving snapshots and unrelated market restrictions", async () => {
    const rows: any[] = [30, 60].map((durationSeconds) => ({
      id: "old-" + durationSeconds,
      pair: "BTCUSDT",
      durationSeconds,
      payoutRate: "0.85",
      lossRate: "0",
      minStake: "1",
      maxStake: "1000",
      settlementDelaySeconds: 0,
      version: 1,
      enabled: true,
    }));
    const outbox = new Map<string, any>();
    const marketPair = {
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: "pair-1", symbol: "BTCUSDT" }),
      update: jest.fn(),
    };
    const tx = {
      gate2BinaryConfiguration: {
        findMany: jest.fn(async () =>
          [...rows].sort((a, b) => b.version - a.version),
        ),
        create: jest.fn(async ({ data }: any) => {
          const row = { ...data, id: "new-" + rows.length };
          rows.push(row);
          return row;
        }),
      },
      adminAuditLog: {
        create: jest.fn(async () => ({ id: "audit-" + outbox.size })),
      },
      eventOutbox: {
        findUnique: jest.fn(
          async ({ where }: any) => outbox.get(where.idempotencyKey) ?? null,
        ),
        create: jest.fn(async ({ data }: any) => {
          outbox.set(data.idempotencyKey, data);
          return data;
        }),
      },
      marketPair,
    };
    const service: any = Object.create(AdminService.prototype);
    service.prisma = {
      marketPair,
      $transaction: async (run: (value: any) => unknown) => run(tx),
    };

    const paused = await service.setBinaryPairMaintenance(
      "BTCUSDT",
      false,
      "admin-1",
      "Pause Binary",
      "pause-key-123",
    );
    expect(paused).toEqual(
      expect.objectContaining({ status: "MAINTENANCE", replayed: false }),
    );
    expect(
      rows.filter((row) => row.version === 1).every((row) => row.enabled),
    ).toBe(true);
    expect(
      rows.filter((row) => row.version === 2).every((row) => !row.enabled),
    ).toBe(true);

    const resumed = await service.setBinaryPairMaintenance(
      "BTCUSDT",
      true,
      "admin-1",
      "Resume Binary",
      "resume-key-123",
    );
    expect(resumed).toEqual(
      expect.objectContaining({ status: "ACTIVE", replayed: false }),
    );
    expect(
      rows.filter((row) => row.version === 3).every((row) => row.enabled),
    ).toBe(true);
    expect(
      rows.filter((row) => row.version === 1).map((row) => row.payoutRate),
    ).toEqual(["0.85", "0.85"]);
    expect(marketPair.update).not.toHaveBeenCalled();

    await expect(
      service.setBinaryPairMaintenance(
        "BTCUSDT",
        false,
        "admin-1",
        "Pause Binary",
        "pause-key-123",
      ),
    ).resolves.toEqual(expect.objectContaining({ replayed: true }));
    await expect(
      service.setBinaryPairMaintenance(
        "BTCUSDT",
        true,
        "admin-1",
        "Pause Binary",
        "pause-key-123",
      ),
    ).rejects.toThrow("idempotency key was already used");
    expect(rows).toHaveLength(6);
    expect(outbox.size).toBe(2);
  });
});
