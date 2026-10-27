/**
 * @name Client application directly imports database runtime
 * @description Admin and Public must access durable financial or application data through the NestJS API, not Prisma or SQLite driver packages.
 * @kind problem
 * @problem.severity error
 * @precision high
 * @id nexi/client-database-runtime-import
 * @tags maintainability correctness
 */
import javascript

from StringLiteral modulePath
where
  modulePath.getValue().regexpMatch("(@prisma/client|@prisma/adapter-better-sqlite3|better-sqlite3|node:sqlite|sqlite3|@libsql/client)") and
  modulePath.getFile().getRelativePath().regexpMatch("(frontend|Admin)/.*")
select modulePath, "NEXI Admin/Public code directly references a database runtime. Durable application and financial data belong behind the NestJS API."
