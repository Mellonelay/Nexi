import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const classifierStart = source.indexOf("function classifyD1Sql");
const classifierEnd = source.indexOf(
  "NexiApiContainer.outboundByHost = {",
);
assert.ok(classifierStart >= 0, "Worker must define the D1 SQL classifier");
assert.ok(classifierEnd > classifierStart, "Worker classifier boundary must be stable");
const classifyD1Sql = new Function(
  `${source.slice(classifierStart, classifierEnd)}; return classifyD1Sql;`,
)();

test("Worker classifies plain and CTE data statements by their top-level main statement", () => {
  assert.equal(classifyD1Sql("  SELECT 1  "), "SELECT");
  assert.equal(
    classifyD1Sql(
      "WITH ids AS (SELECT 1) SELECT id FROM ids",
    ),
    "SELECT",
  );
  assert.equal(
    classifyD1Sql(
      'WITH "ids"("id") AS (SELECT 1 AS "id") SELECT "id" FROM "ids"',
    ),
    "SELECT",
  );
  assert.equal(
    classifyD1Sql(
      "WITH RECURSIVE ids(id) AS (SELECT 1 UNION ALL SELECT id + 1 FROM ids WHERE id < 2) SELECT id FROM ids",
    ),
    "SELECT",
  );
  assert.equal(
    classifyD1Sql(
      "WITH ids AS (SELECT ')' AS value, (1 + (2 * 3)) AS id) INSERT INTO User (id) SELECT id FROM ids RETURNING id",
    ),
    "INSERT",
  );
  assert.equal(
    classifyD1Sql(
      "WITH ids AS (SELECT 1), names AS (SELECT 'UPDATE )' AS name) UPDATE User SET name = (SELECT name FROM names) WHERE id IN (SELECT id FROM ids) RETURNING id",
    ),
    "UPDATE",
  );
  assert.equal(
    classifyD1Sql("REPLACE INTO User (id) VALUES (1) RETURNING id"),
    "REPLACE",
  );
});

test("Worker query contract only admits SELECT as the CTE main statement", () => {
  assert.equal(
    classifyD1Sql("WITH ids AS (SELECT 1) UPDATE User SET name = 'blocked'"),
    "UPDATE",
  );
  assert.equal(
    classifyD1Sql("WITH ids AS (SELECT 1) DELETE FROM User RETURNING id"),
    "DELETE",
  );
  assert.match(source, /if \(classifyD1Sql\(sql\) !== "SELECT"\)/);
  assert.match(source, /if \(!statementClass\)/);
  assert.doesNotMatch(source, /!\/\^SELECT\\b\/i\.test\(sql\)/);
});

test("Worker rejects unsupported classes and top-level multiple statements", () => {
  assert.equal(classifyD1Sql("WITH ids AS (SELECT 1) PRAGMA foreign_keys"), null);
  assert.equal(classifyD1Sql("WITH ids AS (SELECT 1) DROP TABLE User"), null);
  assert.match(source, /hasTopLevelSqlSemicolon\(statement\)/);
  assert.match(source, /Batch accepts only data statements/);
});
