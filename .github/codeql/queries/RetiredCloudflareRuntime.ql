/**
 * @name Retired Cloudflare runtime dependency in active NEXI source
 * @description Active Backend, Public, or Admin modules must not reference retired Cloudflare Worker runtime packages.
 * @kind problem
 * @problem.severity warning
 * @precision high
 * @id nexi/retired-cloudflare-runtime-import
 * @tags maintainability
 */
import javascript

from StringLiteral modulePath
where
  modulePath.getValue().regexpMatch("(@cloudflare/workers-types|cloudflare:workers)") and
  modulePath.getFile().getRelativePath().regexpMatch("(backend|frontend|Admin)/.*")
select modulePath, "Active NEXI source references a retired Cloudflare Worker runtime module. Use the current VPS/NestJS ownership contract."
