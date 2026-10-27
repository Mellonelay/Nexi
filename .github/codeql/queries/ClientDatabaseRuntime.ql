/**
 * @name Client application directly imports database runtime
 * @description Admin and Public must access durable financial or application data through the NestJS API, not Prisma or SQLite driver packages loaded through static imports, requires, or re-exports. Dynamic or computed import paths are not covered.
 * @kind problem
 * @problem.severity error
 * @precision high
 * @id nexi/client-database-runtime-import
 * @tags maintainability correctness
 */
import javascript

predicate isDatabaseRuntimePath(string path) {
  path.regexpMatch("(^|/)(@prisma/client|@prisma/adapter-better-sqlite3|better-sqlite3|node:sqlite|sqlite3|@libsql/client)(/|$)")
}

predicate isClientFile(File file) {
  file.getRelativePath().regexpMatch("(frontend|Admin)/.*")
}

from Expr modulePath
where
  (
    exists(Import moduleImport, StringLiteral importPath |
      modulePath = importPath and
      importPath = moduleImport.getImportedPathExpr()
    )
    or
    exists(ExportNamedDeclaration reExport, ConstantString exportPath |
      modulePath = exportPath and
      exportPath = reExport.getImportedPath()
    )
    or
    exists(BulkReExportDeclaration reExport, ConstantString exportPath |
      modulePath = exportPath and
      exportPath = reExport.getImportedPath()
    )
  ) and
  isDatabaseRuntimePath(modulePath.getStringValue()) and
  isClientFile(modulePath.getFile())
select modulePath, "NEXI Admin/Public code directly references a database runtime. Durable application and financial data belong behind the NestJS API."
