import {
  classifyD1Sql,
  D1RemoteDatabase,
} from "../../src/d1/d1-remote-database";

describe("D1RemoteDatabase bridge routing", () => {
  afterEach(() => jest.restoreAllMocks());

  it("sends SELECT through /query with the object body", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1 }] }),
    } as Response);

    await expect(
      new D1RemoteDatabase().query("  SELECT 1  ", [1]),
    ).resolves.toEqual({
      results: [{ id: 1 }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://nexi-core-d1/query",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ sql: "SELECT 1", params: [1] }),
      }),
    );
  });

  it("sends a CTE SELECT through /query", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1 }] }),
    } as Response);

    await new D1RemoteDatabase().query(
      "WITH ids AS (SELECT 1 AS id) SELECT id FROM ids",
      [],
    );

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://nexi-core-d1/query");
  });

  it("sends INSERT RETURNING through /batch and returns the first result", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { success: true, results: [{ id: "created" }], meta: { changes: 1 } },
        ],
      }),
    } as Response);

    await expect(
      new D1RemoteDatabase().query(
        "  INSERT INTO User (id) VALUES (?) RETURNING id  ",
        ["created"],
      ),
    ).resolves.toEqual({ results: [{ id: "created" }], meta: { changes: 1 } });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://nexi-core-d1/batch",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          statements: [
            {
              sql: "INSERT INTO User (id) VALUES (?) RETURNING id",
              params: ["created"],
            },
          ],
        }),
      }),
    );
  });

  it("wraps direct batch statements in the Worker payload object", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ success: true, meta: { changes: 1 } }],
      }),
    } as Response);
    const database = new D1RemoteDatabase();

    await database.batch([
      database.prepare("UPDATE User SET name = ?").bind("Nexi"),
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://nexi-core-d1/batch",
      expect.objectContaining({
        body: JSON.stringify({
          statements: [{ sql: "UPDATE User SET name = ?", params: ["Nexi"] }],
        }),
      }),
    );
  });

  it("rejects unsupported statement classes locally", async () => {
    const fetchMock = jest.spyOn(global, "fetch");

    await expect(
      new D1RemoteDatabase().query("  PRAGMA foreign_keys  ", []),
    ).rejects.toThrow("D1 bridge accepts only bounded data statements");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["SELECT 1", "SELECT"],
    ["INSERT INTO User (id) VALUES (?) RETURNING id", "INSERT"],
    ["UPDATE User SET name = ? WHERE id = ? RETURNING id", "UPDATE"],
    ["DELETE FROM User WHERE id = ? RETURNING id", "DELETE"],
    ["REPLACE INTO User (id) VALUES (?) RETURNING id", "REPLACE"],
    ["WITH ids AS (SELECT 1 AS id) SELECT id FROM ids", "SELECT"],
    [
      'WITH "ids"("id") AS (SELECT 1 AS "id") SELECT "id" FROM "ids"',
      "SELECT",
    ],
    [
      "WITH RECURSIVE ids(id) AS (SELECT 1 UNION ALL SELECT id + 1 FROM ids WHERE id < 2) SELECT id FROM ids",
      "SELECT",
    ],
    [
      "WITH ids AS (SELECT ')' AS value, (1 + (2 * 3)) AS id) INSERT INTO User (id) SELECT id FROM ids RETURNING id",
      "INSERT",
    ],
    [
      "WITH ids AS (SELECT 1 AS id), names AS (SELECT 'UPDATE )' AS name) UPDATE User SET name = (SELECT name FROM names) WHERE id IN (SELECT id FROM ids) RETURNING id",
      "UPDATE",
    ],
  ])("classifies %s as %s", (sql, expected) => {
    expect(classifyD1Sql(sql)).toBe(expected);
  });

  it.each([
    ["WITH ids AS (SELECT 1) PRAGMA foreign_keys", "unsupported main statement"],
    ["WITH ids AS (SELECT 1) DELETE FROM User; SELECT 1", "multiple statements"],
    ["WITH ids AS (SELECT 1) DROP TABLE User", "unsupported main statement"],
  ])("rejects %s locally as %s", async (sql, reason) => {
    const fetchMock = jest.spyOn(global, "fetch");

    await expect(new D1RemoteDatabase().query(sql, [])).rejects.toThrow(
      reason === "multiple statements"
        ? "D1 bridge accepts one bounded SQL statement"
        : "D1 bridge accepts only bounded data statements",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes a write CTE through /batch and never /query", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ success: true, results: [{ id: "updated" }] }],
      }),
    } as Response);

    await new D1RemoteDatabase().query(
      "WITH ids AS (SELECT 1 AS id) UPDATE User SET name = ? WHERE id IN (SELECT id FROM ids) RETURNING id",
      ["Nexi"],
    );

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://nexi-core-d1/batch");
    expect(fetchMock.mock.calls[0]?.[0]).not.toBe("http://nexi-core-d1/query");
  });
});
