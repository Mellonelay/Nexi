import { D1CommunicationsCommandGateway } from "../../src/d1/d1-communications-command.gateway";

describe("announcement original-intent transaction source contract", () => {
  const makeGateway = () => {
    const batch = jest.fn(async (_statements: any[]) => ({ results: [] }));
    const gateway = new D1CommunicationsCommandGateway({
      isEnabled: () => true, batch,
    } as any);
    return { gateway, batch };
  };

  it("puts create, outbox, and the conflict guard in the same SQLite batch", async () => {
    const { gateway, batch } = makeGateway();
    await gateway.mutateAnnouncementAtomic({
      mode: "create", id: "announcement-a", key: "create-a",
      intentHash: "hash-a", published: false,
      values: { title: "Title", body: "Body", published: 0 },
    });
    const statements = batch.mock.calls[0][0] as Array<{ sql: string; params: unknown[] }>;
    expect(statements).toHaveLength(3);
    expect(statements[0].sql).toContain('INSERT OR IGNORE INTO "Announcement"');
    expect(statements[1].sql).toContain('INSERT OR IGNORE INTO "EventOutbox"');
    expect(statements[1].sql).toContain('WHERE changes()=1');
    expect(statements[2].sql).toContain('INSERT INTO "Announcement"');
    expect(statements[2].sql).toContain('NOT EXISTS');
    expect(statements[2].params).toEqual(expect.arrayContaining([
      "announcement:announcement-a", "announcement-a",
      "hash-a",
    ]));
  });

  it("guards update replay before transaction commit and retains publish payload", async () => {
    const { gateway, batch } = makeGateway();
    await gateway.mutateAnnouncementAtomic({
      mode: "update", id: "announcement-a", key: "publish-a",
      intentHash: "hash-b", values: { published: 1 },
    });
    const statements = batch.mock.calls[0][0] as Array<{ sql: string; params: unknown[] }>;
    expect(statements).toHaveLength(3);
    expect(statements[0].sql).toContain('FROM "Announcement" WHERE "id"=?');
    expect(statements[0].sql).toContain('CASE WHEN ? IS NOT NULL AND "published"=0');
    expect(statements[0].sql).toContain('ANNOUNCEMENT_PUBLISHED');
    expect(statements[0].sql).toContain("json_object(");
    expect(statements[1].sql).toContain('"id"=? AND EXISTS');
    expect(statements[2].sql).toContain('NOT EXISTS');
    expect(statements[0].params).toContain("hash-b");
    expect(statements[0].params).toContain(1);
  });

  it("maps in-transaction intent constraint violations to a conflict", async () => {
    const { gateway, batch } = makeGateway();
    batch.mockRejectedValueOnce(new Error("NOT NULL constraint failed: Announcement.title"));
    await expect(gateway.mutateAnnouncementAtomic({
      mode: "create", id: "announcement-a", key: "create-a",
      intentHash: "different", published: false,
      values: { title: "Changed", body: "Body" },
    })).rejects.toMatchObject({ status: 409 });
  });
  it("never interpolates unknown column names into an atomic command", async () => {
    const { gateway, batch } = makeGateway();
    await expect(gateway.mutateAnnouncementAtomic({
      mode: "update", id: "announcement-a", key: "unsafe-column",
      intentHash: "hash-c", published: true,
      values: { 'published"=1 WHERE "id"!="': 1 },
    })).rejects.toThrow("ANNOUNCEMENT_COLUMN_NOT_ALLOWED");
    expect(batch).not.toHaveBeenCalled();
  });

});
