import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");

it("prepares the financial posting and Margin SQL against SQLite column definitions", () => {
  const source = readFileSync("src/d1/d1-financial-command.gateway.ts", "utf8");
  const db = new DatabaseSync(":memory:");
  try {
    const postingColumns = [
      "id", "accountId", "asset", "kind", "amount", "availableDelta", "lockedDelta",
      "referenceType", "referenceId", "idempotencyKey", "correlationId",
      "economicGroup", "createdAt", "metadata",
    ];
    const marginColumns = [
      "id", "accountId", "direction", "leverage", "collateral", "quantity",
      "entryPrice", "markPrice", "debtAsset", "debtPrincipal", "interestAccrued",
      "realizedPnl", "unrealizedPnl", "status", "openIdempotencyKey",
      "entryOrderId", "openedAt", "updatedAt",
    ];
    for (const [name, columns] of [
      ["LedgerPosting", postingColumns],
      ["SpotMarginPosition", marginColumns],
    ] as const) {
      db.exec(`CREATE TABLE "${name}" (${columns.map((column) => `"${column}" TEXT`).join(",")})`);
    }
    db.exec('CREATE TABLE "LedgerIdempotency" ("id" TEXT, "idempotencyKey" TEXT, "debitPostingId" TEXT)');

    const postingStatements = Array.from(
      source.matchAll(/sql:\s*`(INSERT INTO "LedgerPosting"[^\`]+)`/g),
      (match) => match[1],
    );
    for (const referenceType of [
      "LOAN_DISBURSEMENT", "LOAN_REPAYMENT", "GATE2_WITHDRAWAL_RESERVE",
      "GATE2_WITHDRAWAL_RELEASE", "GATE2_WITHDRAWAL_SETTLEMENT",
      "GATE2_BINARY_STAKE_SETTLEMENT", "GATE2_BINARY_PAYOUT",
    ]) {
      const matches = postingStatements.filter((sql) => sql.includes(`'${referenceType}'`));
      expect(matches).toHaveLength(1);
      const sql = matches[0];
      expect(() => db.prepare(sql).run(...Array((sql.match(/\?/g) ?? []).length).fill("probe"))).not.toThrow();
    }

    const marginCloseSqlTail = source
      .split('sql: `INSERT INTO "LedgerPosting"')
      .find((segment) => segment.includes("SPOT_MARGIN_"))
      ?.split("`", 1)[0];
    expect(marginCloseSqlTail).toBeDefined();
    const marginCloseSql =
      'INSERT INTO "LedgerPosting"' +
      marginCloseSqlTail!.replace(
        String.fromCharCode(36) + "{eventType}",
        "REPAYMENT",
      );
    expect(() =>
      db.prepare(marginCloseSql).run(
        ...Array((marginCloseSql.match(/\?/g) ?? []).length).fill("probe"),
      ),
    ).not.toThrow();

    const marginStatements = Array.from(
      source.matchAll(/sql:\s*`(INSERT OR IGNORE INTO "SpotMarginPosition"[^\`]+)`/g),
      (match) => match[1],
    );
    expect(marginStatements).toHaveLength(1);
    const marginSql = marginStatements[0];
    expect(() => db.prepare(marginSql).run(...Array((marginSql.match(/\?/g) ?? []).length).fill("probe"))).not.toThrow();
  } finally {
    db.close();
  }
});
