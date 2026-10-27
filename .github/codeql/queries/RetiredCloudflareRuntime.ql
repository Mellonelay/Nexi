/**
 * @name Retired Cloudflare runtime dependency in active NEXI source
 * @description Active Backend, Public, or Admin modules must not statically import retired Cloudflare Worker runtime packages. Dynamic or computed import paths are not covered.
 * @kind problem
 * @problem.severity warning
 * @precision high
 * @id nexi/retired-cloudflare-runtime-import
 * @tags maintainability
 */
import javascript

predicate isRetiredCloudflareRuntimePath(string path) {
  path.regexpMatch("(^|/)(@cloudflare/workers-types|cloudflare:workers)(/|$)")
}

predicate isActiveNexiFile(File file) {
  file.getRelativePath().regexpMatch("(backend|frontend|Admin)/.*")
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
  isRetiredCloudflareRuntimePath(modulePath.getStringValue()) and
  isActiveNexiFile(modulePath.getFile())
select modulePath, "Active NEXI source references a retired Cloudflare Worker runtime module. Use the current VPS/NestJS ownership contract."
