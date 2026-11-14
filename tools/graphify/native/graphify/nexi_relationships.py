"""Unified NEXI source-relationship adapter for Graphify 0.9.108.

The only public entry point is extract_nexi_relationships(), called by
graphify.extract.extract() before Graphify's built-in AST provenance pass.
Uses the project-local TypeScript compiler in a separate static parser;
never imports an application module, opens a database, or starts a service.
"""
from __future__ import annotations

import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path
from typing import Any

from graphify.ids import make_id
from graphify.extractors.prisma import parse_prisma_models as _prisma_models

NODE24 = Path("/opt/nexi/runtime/node-v24.21.0/bin/node")
SCANNER = Path(__file__).with_name("nexi_semantic_scan.cjs")
VERSION = "nexi-framework-v1"
LANGUAGES = {".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"}
READ_OPS = {"findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow",
            "findMany", "count", "aggregate", "groupBy"}
WRITE_OPS = {"create", "createMany", "createManyAndReturn", "update", "updateMany",
             "updateManyAndReturn", "upsert", "delete", "deleteMany"}
SQL_WRITE = re.compile(r"^\s*(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP)\b", re.I)
SQL_TABLE = re.compile(r"\b(?:INTO|UPDATE|FROM|JOIN)\s+['\"\x60]?([A-Za-z_][\w]*)", re.I)


def _source(path: Path, root: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(root).as_posix()
    except ValueError as exc:
        raise ValueError(f"NEXI source outside extraction root: {resolved}") from exc




def _physical_sqlite_tables(root: Path) -> list[dict[str, Any]]:
    """Read declared physical tables in NEXI SQL migrations and local schema.

    A CREATE TABLE declaration proves source ownership, not the state of a
    deployed database. No connection or migration execution is attempted.
    """
    physical = []
    sources = sorted(set((root / "prisma" / "migrations-d1").rglob("*.sql"))
                     | set((root / "src" / "jobs").glob("*.schema.sql")))
    for path in sources:
        if not path.is_file() or path.stat().st_size > 200_000:
            continue
        sf = _source(path, root)
        for line, text in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            match = re.match(
                r'^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["\x60]?([A-Za-z_]\w*)',
                text, re.I,
            )
            if match:
                physical.append({"table": match.group(1), "source_file": sf,
                                 "line": line, "declaration_scope":
                                 "local-additive" if "/jobs/" in sf else "migration"})
    return physical


def _scan_typescript(paths: list[Path], root: Path) -> list[dict[str, Any]]:
    if not paths:
        return []
    if not NODE24.is_file() or not SCANNER.is_file():
        raise RuntimeError("NEXI source parser requires existing Node24 and maintained TS scanner")
    records: list[dict[str, Any]] = []
    for offset in range(0, len(paths), 140):
        chunk = paths[offset:offset + 140]
        payload = {"root": str(root), "surface": root.name,
                   "paths": [str(x) for x in chunk]}
        r = subprocess.run([str(NODE24), str(SCANNER)], input=json.dumps(payload),
                           capture_output=True, text=True, timeout=110, check=False)
        if r.returncode:
            raise RuntimeError(f"NEXI TypeScript parsing failed (exit {r.returncode}): {r.stderr[-1300:]}")
        parsed = json.loads(r.stdout)
        if parsed.get("failures"):
            raise ValueError(f"NEXI TypeScript source failures: {parsed['failures'][:12]}")
        records.extend(parsed.get("records", []))
    return records



def _normalized_token(value: object) -> str:
    """Preserve explicit tokens; reject computed expressions as provider IDs."""
    if not isinstance(value, str):
        return ""
    token = value.strip()
    if (token.startswith(("'", '"')) and token.endswith(token[:1])):
        token = token[1:-1]
    if not re.fullmatch(r"[A-Za-z_$][\w$.-]*", token):
        return ""
    return token


def _link_nest_modules(pairs: list[tuple[dict, str]], node, edge, existing: dict,
                       surface: str) -> None:
    """Link only unique, source-proven NestJS module registrations.

    A provider can be injected when it is local to its owner's module,
    or exposed by an imported module's explicit exports. Dynamic module
    factories, global modules, forwardRef cycles, and ambiguous providers
    remain unresolved.
    """
    modules: dict[tuple[str, str], dict] = {}
    for r, oid in pairs:
        if r.get("kind") != "nest_module":
            continue
        key = (str(r["file"]), str(r.get("module") or ""))
        if not key[1]:
            continue
        mid = make_id("nexi", surface, "nest_module", *key)
        node(mid, key[1], "nest_module_resource", key[0], int(r.get("line") or 1),
             module=key[1], global_declared=bool(r.get("global")))
        modules[key] = {"id": mid, "providers": [], "exports": set(),
                        "imports": set(), "reexports": set(), "classes": set(),
                        "global": bool(r.get("global")), "file": key[0]}
        edge(mid, oid, "declares_module", key[0], int(r.get("line") or 1))

    def target_module(rec: dict):
        key = (str(rec.get("target_file") or ""), str(rec.get("target_name") or ""))
        return key if key in modules else None

    for rec, oid in pairs:
        kind = rec.get("kind")
        if kind not in {"module_import", "module_export", "module_provider", "module_controller"}:
            continue
        owner_key = (str(rec.get("file") or ""), str(rec.get("module") or ""))
        owner = modules.get(owner_key)
        if owner is None:
            continue
        sf, line = owner_key[0], int(rec.get("line") or 1)
        edge(owner["id"], oid, "module_declares", sf, line)
        token = _normalized_token(rec.get("symbol"))
        target = (rec.get("target_file"), rec.get("target_name"))
        if kind == "module_import":
            module_key = target_module(rec)
            if module_key:
                owner["imports"].add(module_key)
                edge(owner["id"], modules[module_key]["id"], "nest_imports_module", sf, line,
                     "INFERRED")
            else:
                existing[oid]["metadata"]["unresolved_reason"] = "dynamic-or-external-module"
        elif kind == "module_export":
            module_key = target_module(rec)
            if module_key:
                # NestJS exposes imported modules explicitly re-exported here.
                # Check import membership when resolving; records can be unordered.
                owner["reexports"].add(module_key)
            elif token:
                owner["exports"].add(token)
            else:
                existing[oid]["metadata"]["unresolved_reason"] = "dynamic-module-export"
        elif kind in {"module_provider", "module_controller"}:
            if kind == "module_provider":
                if token:
                    owner["providers"].append((token, oid))
                else:
                    existing[oid]["metadata"]["unresolved_reason"] = "dynamic-provider-token"
            if all(isinstance(x, str) and x for x in target):
                owner["classes"].add(tuple(target))

    # Emit re-export edges only when the exported module is an actual
    # imported dependency. Source-declared names alone are not visibility.
    for rec, oid in pairs:
        if rec.get("kind") != "module_export":
            continue
        owner_key = (str(rec.get("file") or ""), str(rec.get("module") or ""))
        owner = modules.get(owner_key)
        dependency = target_module(rec)
        if owner is None or dependency is None:
            continue
        if dependency in owner["imports"]:
            edge(owner["id"], modules[dependency]["id"], "nest_reexports_module",
                 owner_key[0], int(rec.get("line") or 1), "INFERRED")
        else:
            existing[oid]["metadata"]["unresolved_reason"] = "reexported-module-not-imported"

    # A class may appear in multiple module scopes. Do not guess between them.
    class_modules: dict[tuple[str, str], set[tuple[str, str]]] = defaultdict(set)
    for key, info in modules.items():
        for cls in info["classes"]:
            class_modules[cls].add(key)

    def exported_provider_ids(module_key, token, visited):
        # Only exported tokens and explicitly imported-and-re-exported modules
        # are visible. A cycle cannot expand visibility indefinitely.
        if module_key in visited:
            return set()
        visited = visited | {module_key}
        info = modules[module_key]
        matches = {provider_id for t, provider_id in info["providers"]
                   if t == token} if token in info["exports"] else set()
        for dependency in info["reexports"] & info["imports"]:
            matches.update(exported_provider_ids(dependency, token, visited))
        return matches

    # Only source-declared @Global modules registered by the root AppModule
    # may expose exported providers across otherwise unrelated modules.
    app_root = modules.get(("src/app.module.ts", "AppModule"))
    registered_globals = {
        key for key, info in modules.items()
        if info["global"] and app_root is not None and key in app_root["imports"]
    }
    def globally_exported_ids(token):
        matches = set()
        for module_key in registered_globals:
            matches.update(exported_provider_ids(module_key, token, set()))
        return matches

    # `useExisting` aliases share an existing provider rather than creating
    # a new implementation. Resolve only a uniquely visible provider token.
    for rec, oid in pairs:
        if rec.get("kind") != "module_provider" or not rec.get("useExisting"):
            continue
        scope = (str(rec.get("file") or ""), str(rec.get("module") or ""))
        info = modules.get(scope)
        token = _normalized_token(rec.get("useExisting"))
        if info is None or not token:
            existing[oid]["metadata"]["existing_alias_unresolved"] = "dynamic-alias-or-module"
            continue
        matches = {pid for t, pid in info["providers"] if t == token and pid != oid}
        for dependency in info["imports"]:
            matches.update(exported_provider_ids(dependency, token, set()))
        matches.update(globally_exported_ids(token))
        if len(matches) == 1:
            edge(oid, next(iter(matches)), "resolves_existing_provider_alias",
                 scope[0], int(rec.get("line") or 1), "INFERRED")
        else:
            existing[oid]["metadata"]["existing_alias_unresolved"] = (
                "ambiguous-provider" if len(matches) > 1 else "provider-not-visible")

    # Factory provider dependencies are explicit in NestJS `inject` arrays.
    # Record source tokens even when their target cannot be proven unique.
    for rec, oid in pairs:
        if rec.get("kind") != "module_provider" or not rec.get("factory"):
            continue
        scope = (str(rec.get("file") or ""), str(rec.get("module") or ""))
        info = modules.get(scope)
        if info is None:
            continue
        unresolved = int(rec.get("factory_inject_unresolved") or 0)
        for raw_token in rec.get("factory_inject_tokens") or []:
            token = _normalized_token(raw_token)
            if not token:
                unresolved += 1
                continue
            sf, line = scope[0], int(rec.get("line") or 1)
            tid = make_id("nexi", surface, "di_reference", token)
            node(tid, token, "nest_provider_token_resource", sf, line,
                 token=token, visibility="factory-injection-source")
            edge(oid, tid, "factory_injects_token", sf, line)
            matches = {pid for t, pid in info["providers"] if t == token}
            for dependency in info["imports"]:
                matches.update(exported_provider_ids(dependency, token, set()))
            matches.update(globally_exported_ids(token))
            if len(matches) == 1:
                edge(oid, next(iter(matches)), "resolves_factory_provider",
                     sf, line, "INFERRED")
            else:
                unresolved += 1
        if unresolved:
            existing[oid]["metadata"]["factory_inject_unresolved"] = unresolved

    for rec, oid in pairs:
        if rec.get("kind") != "nest_inject":
            continue
        owner_class = (str(rec.get("file") or ""), str(rec.get("class") or ""))
        scopes = class_modules.get(owner_class, set())
        token = _normalized_token(rec.get("token"))
        if not scopes or not token:
            existing[oid]["metadata"].setdefault("unresolved_reason", "owner-module-or-token-unknown")
            continue
        matches: set[str] = set()
        for scope in scopes:
            info = modules[scope]
            matches.update(provider_id for t, provider_id in info["providers"] if t == token)
            for dependency in info["imports"]:
                matches.update(exported_provider_ids(dependency, token, set()))
            matches.update(globally_exported_ids(token))
        if len(matches) == 1:
            provider_id = next(iter(matches))
            edge(oid, provider_id, "resolves_injected_provider", rec["file"],
                 int(rec.get("line") or 1), "INFERRED")
        else:
            existing[oid]["metadata"]["unresolved_reason"] = (
                "ambiguous-visible-provider" if len(matches) > 1 else
                "external-provider-not-indexed" if rec.get("external_module") else
                "provider-not-explicitly-visible")

def extract_nexi_relationships(paths, root, all_nodes, all_edges) -> None:
    """Augment upstream AST results in-place, preserving Graphify's return schema.

    Designed for the three independently extracted NEXI surfaces. All emitted
    operations keep owning source_file and L<line>; unknown targets are not
    fabricated. Graphify performs final AST provenance stamping downstream.
    """
    from graphify.http_relationships import extract_http_relationships
    # Preserve the existing HTTP and React Context extraction, once.
    extract_http_relationships(paths, root, all_nodes, all_edges)

    root = Path(root).resolve() if root else Path.cwd().resolve()
    if root.name.lower() not in {"backend", "frontend", "admin"}:
        return
    surface = root.name.lower()
    source_paths = sorted({Path(p).resolve() for p in paths if Path(p).suffix.lower() in LANGUAGES})
    source_paths = [p for p in source_paths if p.is_file() and p.is_relative_to(root)]
    records = _scan_typescript(source_paths, root)
    imports: dict[str, dict[str, dict]] = defaultdict(dict)
    for rec in records:
        if rec.get("kind") == "import_binding" and rec.get("local") and rec.get("resolved_file"):
            imports[str(rec["file"])][str(rec["local"])] = rec
    models = _prisma_models(root) if surface == "backend" else {}
    existing: dict[str, dict] = {str(n["id"]): n for n in all_nodes if n.get("id")}
    symbols_by_file: dict[str, list[dict]] = defaultdict(list)
    by_site: dict[tuple[str, int], list[dict]] = defaultdict(list)
    for n in all_nodes:
        sf = str(n.get("source_file") or "")
        if sf and n.get("file_type") == "code":
            symbols_by_file[sf].append(n)
            marker = re.fullmatch(r"L(\d+)", str(n.get("source_location") or ""))
            if marker and not (n.get("metadata") or {}).get("nexi_version"):
                by_site[(sf, int(marker.group(1)))].append(n)
    local_ids: set[str] = set()
    already_edges = {(e.get("source"), e.get("target"), e.get("relation"))
                     for e in all_edges}
    file_nodes: dict[str, str] = {}
    for n in all_nodes:
        sf = str(n.get("source_file") or "")
        if sf and n.get("source_location") == "L1" and sf not in file_nodes:
            file_nodes[sf] = str(n["id"])

    def node(nid: str, label: str, kind: str, sf: str, line: int, **meta) -> str:
        if nid not in existing:
            n = {"id": nid, "label": label, "file_type": "code",
                 "source_file": sf, "source_location": f"L{line}",
                 "metadata": {"entity_type": kind, "nexi_version": VERSION, "surface": surface, **meta}}
            all_nodes.append(n)
            existing[nid] = n
            local_ids.add(nid)
        elif nid in local_ids:
            old = existing[nid]
            if old["source_file"] != sf and not kind.endswith("_resource"):
                raise ValueError(f"NEXI conflicting node IDs: {nid}")
        return nid

    def edge(a: str, b: str, relation: str, sf: str, line: int, confidence: str = "EXTRACTED") -> None:
        if not a or not b:
            return
        key = (a, b, relation)
        if key not in already_edges:
            already_edges.add(key)
            all_edges.append({"source": a, "target": b, "relation": relation,
                              "context": "nexi", "confidence": confidence,
                              "source_file": sf, "source_location": f"L{line}"})

    for m in models.values():
        sf = m["source_file"]
        if not (root / sf).is_file():
            continue
        table_id = make_id("nexi", surface, "table", m["table"])
        model_id = make_id("nexi", surface, "model", m["name"])
        node(model_id, m["name"], "prisma_model_resource", sf, m["line"], model=m["name"])
        node(table_id, m["table"], "sqlite_table_resource", sf, m["line"], table=m["table"])
        edge(model_id, table_id, "maps_to_table", sf, m["line"])
        for field, info in m["fields"].items():
            f_id = make_id("nexi", surface, "model", m["name"], "field", field)
            field_line = info["line"]
            node(f_id, f"{m['name']}.{field}", "prisma_field_resource", sf, field_line,
                 column=info["column"], field_type=info["type"])
            edge(model_id, f_id, "declares_field", sf, field_line)
            referenced_model = models.get(str(info["type"]).strip("[]?").casefold())
            if referenced_model is not None:
                target_id = make_id("nexi", surface, "model", referenced_model["name"])
                edge(f_id, target_id, "prisma_relation_target", sf, field_line)

    # Physical SQLite tables can exist outside the Prisma model schema:
    # LocalDurableJob and LocalWorkflow* are additive, source-owned SQL tables.
    for declaration in (_physical_sqlite_tables(root) if surface == "backend" else []):
        table, sf, line = declaration["table"], declaration["source_file"], declaration["line"]
        table_id = make_id("nexi", surface, "table", table)
        node(table_id, table, "sqlite_table_resource", sf, line, table=table,
             source_declaration=declaration["declaration_scope"])
        declaration_id = make_id("nexi", surface, "sql_declaration", sf, table, str(line))
        node(declaration_id, f"CREATE TABLE {table}", "sql_table_declaration", sf, line,
             table=table, declaration_scope=declaration["declaration_scope"])
        edge(declaration_id, table_id, "declares_sql_table", sf, line)

    nest_pairs: list[tuple[dict, str]] = []
    bull_instances: list[tuple[dict, str]] = []
    pending_source_targets: list[tuple[str, str, int, str, int, str]] = []
    indexed_files = {p.relative_to(root).as_posix() for p in source_paths}
    for rec in sorted(records, key=lambda x: (x.get("file", ""), x.get("start", 0), x.get("kind", ""))):
        if rec.get("kind") == "import_binding":
            # Graphify's normal import edges already own the file-level import.
            # Keep resolved TypeScript aliases as evidence for framework joins.
            continue
        sf = rec.get("file", "")
        if not sf or not (root / sf).is_file():
            continue
        kind = str(rec.get("kind", ""))
        line = int(rec.get("line") or 1)
        start = int(rec.get("start") or 0)
        owner = str(rec.get("owner") or "<module>")
        op_id = make_id("nexi", surface, sf, owner, kind, str(start),
                        str(rec.get("queue") or rec.get("event") or rec.get("target") or ""))
        op_label = f"{kind}: {rec.get('method') or rec.get('operation') or rec.get('event') or rec.get('queue') or rec.get('route') or owner}"
        meta = {k: v for k, v in rec.items() if k not in {"file", "line", "start", "column", "kind"}}
        node(op_id, op_label[:240], "nexi_operation", sf, line, operation_kind=kind,
             source_column=int(rec.get("column") or 1), **meta)
        file_id = file_nodes.get(sf)
        if file_id:
            edge(file_id, op_id, "has_nexi_operation", sf, line)

        # Exact source declaration ownership. An occurrence belongs to the
        # lexical class/method actually containing it, not merely its file.
        owner_line = rec.get("owner_decl_line")
        owner_name = str(rec.get("owner_decl_name") or "")
        if isinstance(owner_line, int) and owner_line > 0:
            owners = [n for n in by_site.get((sf, owner_line), [])
                      if str(n.get("label") or "").strip(".()") == owner_name]
            if len(owners) == 1:
                edge(str(owners[0]["id"]), op_id, "contains_nexi_operation", sf, line)
            elif len(owners) > 1:
                existing[op_id]["metadata"]["unresolved_owner"] = "ambiguous-source-declaration"

        # Compiler symbol identity, including aliased/re-exported imports.
        target_file, target_line = rec.get("target_file"), rec.get("target_line")
        target_name = str(rec.get("target_name") or "")
        if isinstance(target_file, str) and isinstance(target_line, int) and target_name:
            targets = [n for n in by_site.get((target_file, target_line), [])
                       if str(n.get("label") or "").strip(".()") == target_name]
            if len(targets) == 1:
                edge(op_id, str(targets[0]["id"]), "references_resolved_symbol",
                     sf, line, "INFERRED")
                existing[op_id]["metadata"]["resolved_target_node"] = str(targets[0]["id"])
            elif targets:
                existing[op_id]["metadata"]["unresolved_symbol"] = "ambiguous-source-symbol"
            else:
                # TS checker proved a unique in-corpus declaration. Defer until
                # other NEXI declaration nodes have also been emitted.
                pending_source_targets.append((op_id, sf, line, target_file, target_line, target_name))
        if kind.startswith(("nest_", "module_")):
            nest_pairs.append((rec, op_id))
        if kind == "bull_instance":
            bull_instances.append((rec, op_id))

        # Semantic binding: TypeScript has already resolved the import
        # through this application's tsconfig aliases. Never guess from a
        # matching class name in an unrelated module.
        imported_name = None
        if kind == "react_renders":
            imported_name = str(rec.get("component") or "").split(".")[0]
        elif kind in {"nest_inject", "nest_inject_queue"}:
            imported_name = str(rec.get("token") or "").strip()
        elif kind.startswith("module_"):
            imported_name = str(rec.get("symbol") or "").strip()
        binding = imports.get(sf, {}).get(imported_name or "")
        if binding:
            target_file = str(binding["resolved_file"])
            exported = str(binding.get("exported") or "")
            candidates = [n for n in symbols_by_file.get(target_file, [])
                          if str(n.get("label") or "").removesuffix("()") == exported]
            if len(candidates) == 1:
                edge(op_id, str(candidates[0]["id"]), "references_imported_symbol", sf, line, "INFERRED")
            else:
                # Imported module identity is known, but the exported runtime
                # component/provider is not independently resolved.
                target_file_id = file_nodes.get(target_file)
                if target_file_id:
                    edge(op_id, target_file_id, "references_import_source", sf, line, "INFERRED")
                else:
                    existing[op_id]["metadata"]["unresolved_import_target"] = target_file

        if kind == "prisma_operation":
            found = models.get(str(rec.get("model") or "").casefold())
            if found:
                model_id = make_id("nexi", surface, "model", found["name"])
                relation = "reads_model" if rec.get("operation") in READ_OPS else "writes_model" if rec.get("operation") in WRITE_OPS else "accesses_model"
                edge(op_id, model_id, relation, sf, line, "INFERRED")
            else:
                existing[op_id]["metadata"]["unresolved_reason"] = "model-not-in-canonical-schema"
        elif kind in {"sqlite_statement", "sqlite_execution", "sqlite_transaction"}:
            sql = rec.get("sql")
            if isinstance(sql, str):
                table = SQL_TABLE.search(sql)
                if table:
                    table_id = make_id("nexi", surface, "table", table.group(1))
                    if table_id in existing:
                        operation = "writes_table" if SQL_WRITE.search(sql) else "reads_table" if sql.lstrip().upper().startswith("SELECT") else "accesses_table"
                        edge(op_id, table_id, operation, sf, line)
                    else:
                        existing[op_id]["metadata"]["unresolved_reason"] = "table-not-in-schema"
            elif kind == "sqlite_statement":
                existing[op_id]["metadata"]["unresolved_reason"] = "dynamic-sql-or-statement"
        elif kind == "durable_journal_record":
            queue = rec.get("queue")
            if isinstance(queue, str) and queue:
                qid = make_id("nexi", surface, "queue_reference", queue)
                node(qid, f"Queue {queue}", "bull_queue_resource", sf, line,
                     queue=queue, matching_scope="queue-name-only")
                edge(op_id, qid, "journals_for_queue_name", sf, line)
            else:
                existing[op_id]["metadata"]["unresolved_reason"] = "dynamic-journal-queue"
        elif kind == "durable_transport_link":
            # The source explicitly passes a map of BullMQ queues to the
            # durable transport, but a member lookup remains conditional.
            candidates = rec.get("queueCandidates")
            if isinstance(candidates, list):
                for q in candidates:
                    if not isinstance(q, str) or not q:
                        continue
                    qid = make_id("nexi", surface, "queue_reference", q)
                    node(qid, f"Queue {q}", "bull_queue_resource", sf, line,
                         queue=q, matching_scope="queue-name-only")
                    edge(op_id, qid, "transport_declares_queue_candidate", sf, line,
                         "INFERRED")
            existing[op_id]["metadata"]["resolution_limit"] = (
                "Queue membership only; dynamic dispatch requires journal row data")
        elif kind == "durable_transport_process":
            existing[op_id]["metadata"]["resolution_limit"] = (
                "Process consumes a journal id, not a statically fixed queue name")
        elif kind == "outbox_operation":
            existing[op_id]["metadata"]["source_semantics"] = (
                "Outbox command call, not proof of a successful financial state transition")
        elif kind == "browser_worker":
            worker_path = rec.get("target")
            if isinstance(worker_path, str) and worker_path:
                wid = make_id("nexi", surface, "browser_worker", worker_path)
                node(wid, worker_path, "browser_worker_resource", sf, line, worker_script=worker_path)
                edge(op_id, wid, "loads_browser_worker", sf, line)
        elif kind == "valkey_operation":
            stream = rec.get("stream")
            if isinstance(stream, str) and stream:
                sid = make_id("nexi", surface, "valkey_stream_reference", stream)
                node(sid, stream, "valkey_stream_resource", sf, line, stream=stream,
                     matching_scope="unverified-connection")
                edge(op_id, sid, "references_stream", sf, line)
            else:
                existing[op_id]["metadata"]["unresolved_reason"] = "dynamic-stream-or-channel"
        elif kind in {"bull_registration", "bull_instance", "bull_enqueue"}:
            # A queue name is a discoverable resource, not proof that both
            # processes use the same Valkey connection or BullMQ prefix.
            queue = rec.get("queue")
            if isinstance(queue, str) and queue:
                qid = make_id("nexi", surface, "queue_reference", queue)
                node(qid, f"Queue {queue}", "bull_queue_resource", sf, line,
                     queue=queue, matching_scope="queue-name-only")
                role = ("declares_worker_queue" if rec.get("instance") == "Worker"
                        else "declares_producer_queue" if rec.get("instance") == "Queue"
                        else "enqueues_by_queue_name" if kind == "bull_enqueue"
                        else "refers_to_queue_name")
                edge(op_id, qid, role, sf, line)
            else:
                # Dynamic map indexing, e.g. this.queues[row.queue], is
                # deliberately represented without fabricating a queue target.
                existing[op_id]["metadata"]["unresolved_reason"] = (
                    rec.get("unresolved") or "dynamic-queue-name")
            job = rec.get("job")
            if kind == "bull_enqueue" and isinstance(job, str) and job:
                jid = make_id("nexi", surface, "bull_job_name", job)
                node(jid, f"Job {job}", "bull_job_name_resource", sf, line,
                     job=job, matching_scope="job-name-only")
                edge(op_id, jid, "enqueues_job_name", sf, line)
        elif kind.startswith("socket_"):
            event, namespace = rec.get("event"), rec.get("namespace")
            if isinstance(event, str) and event and isinstance(namespace, str) and namespace:
                scope = str(rec.get("origin") or "origin-unspecified")
                eid = make_id("nexi", surface, "socket_event", scope, namespace, rec.get("direction", ""), event)
                node(eid, f"{namespace}:{event}", "socket_event_resource", sf, line,
                     namespace=namespace, origin_scope=scope, event=event,
                     direction=rec.get("direction"))
                edge(op_id, eid, "emits_event" if kind == "socket_emitter" else "listens_for_event",
                     sf, line, rec.get("confidence") if rec.get("confidence") in {"EXTRACTED", "INFERRED", "AMBIGUOUS"} else "EXTRACTED")
            elif kind in {"socket_emitter", "socket_listener"}:
                existing[op_id]["metadata"]["unresolved_reason"] = "dynamic-event-or-namespace"
        elif kind.startswith("nest_") or kind.startswith("module_"):
            module_name = rec.get("module") or (rec.get("controller") if kind == "nest_controller" else None)
            if module_name:
                mid = make_id("nexi", surface, "nest_module_or_controller", str(module_name), sf)
                node(mid, str(module_name), "nest_declaration_resource", sf, line,
                     declaration=str(module_name), resolution="source-declared")
                edge(mid, op_id, "declares_nest_metadata", sf, line)
            token = rec.get("token") or rec.get("symbol")
            if kind == "nest_inject_queue" and isinstance(rec.get("queue"), str):
                qname = str(rec["queue"])
                qid = make_id("nexi", surface, "queue_reference", qname)
                node(qid, f"Queue {qname}", "bull_queue_resource", sf, line,
                     queue=qname, matching_scope="queue-name-only")
                edge(op_id, qid, "references_queue_name", sf, line)
            external = rec.get("external_module")
            if kind in {"nest_inject", "nest_inject_queue"} and isinstance(external, str) and external:
                ext_id = make_id("nexi", surface, "external_nest_provider_package", external)
                node(ext_id, external, "nest_external_provider_package_resource",
                     sf, line, package=external, resolution="external-source-not-indexed")
                edge(op_id, ext_id, "injects_external_nest_package", sf, line)
            if token:
                tid = make_id("nexi", surface, "di_reference", str(token))
                node(tid, str(token), "nest_provider_token_resource", sf, line,
                     token=str(token), visibility="unresolved-until-module-analysis")
                edge(op_id, tid, "references_provider_token", sf, line)
            target = rec.get("useClass") or rec.get("useExisting")
            if target:
                imp_id = make_id("nexi", surface, "di_reference", str(target))
                node(imp_id, str(target), "nest_provider_token_resource", sf, line,
                     token=str(target), visibility="source-configured")
                edge(op_id, imp_id, "declares_provider_target", sf, line)
        elif kind == "next_file_route":
            route = rec.get("route")
            if route:
                rid = make_id("nexi", surface, "next_route", str(rec.get("routeKind")), str(route))
                node(rid, f"{rec.get('routeKind')} {route}", "next_route_resource", sf, line,
                     route=route, route_kind=rec.get("routeKind"))
                edge(op_id, rid, "declares_next_route", sf, line)
        elif kind == "tanstack_route":
            route = rec.get("route")
            if isinstance(route, str):
                rid = make_id("nexi", surface, "tanstack_route", route)
                node(rid, route, "tanstack_route_resource", sf, line, route=route)
                edge(op_id, rid, "declares_tanstack_route", sf, line)
        elif kind == "react_renders":
            # External packages are dependencies, not missing in-repo
            # declarations. Retain source provenance without forging ownership.
            if not existing[op_id]["metadata"].get("resolved_target_node"):
                external = rec.get("external_module")
                if isinstance(external, str) and external:
                    package_id = make_id("nexi", surface, "external_component_package", external)
                    node(package_id, external, "external_component_package_resource",
                         sf, line, package=external, resolution="external-source-not-indexed")
                    edge(op_id, package_id, "renders_external_component_package", sf, line)
                    existing[op_id]["metadata"]["resolution_limit"] = "external-component-source-not-indexed"
                else:
                    existing[op_id]["metadata"]["unresolved_target"] = rec.get("component")

    # Complete unique compiler-resolved declarations after all source-owned
    # operations exist. Avoid lexical-name guesses and any external/ignored file.
    declaration_sites: dict[tuple[str, int, str], list[str]] = defaultdict(list)
    for declared in existing.values():
        meta = declared.get("metadata") or {}
        if meta.get("entity_type") != "nest_declaration_resource":
            continue
        line_match = re.fullmatch(r"L(\d+)", str(declared.get("source_location") or ""))
        if line_match:
            declaration_sites[(str(declared.get("source_file") or ""),
                               int(line_match.group(1)),
                               str(declared.get("label") or ""))].append(str(declared["id"]))
    for operation_id, sf, line, target_file, target_line, target_name in pending_source_targets:
        if target_file not in indexed_files:
            existing[operation_id]["metadata"]["unresolved_symbol"] = "target-outside-indexed-source"
            continue
        matches = set(declaration_sites.get((target_file, target_line, target_name), ()))
        if len(matches) > 1:
            existing[operation_id]["metadata"]["unresolved_symbol"] = "ambiguous-source-declaration"
            continue
        if matches:
            target_id = next(iter(matches))
        else:
            # One exact TypeChecker declaration, but upstream Graphify did not
            # expose a matching node. Reuse one stable occurrence by file/line.
            target_id = make_id("nexi", surface, "compiler_declaration",
                                target_file, target_name, str(target_line))
            node(target_id, target_name, "compiler_source_declaration",
                 target_file, target_line,
                 declaration=target_name, resolution="unique-typescript-symbol")
            if file_nodes.get(target_file):
                edge(file_nodes[target_file], target_id, "declares_source_symbol",
                     target_file, target_line)
        edge(operation_id, target_id, "references_resolved_symbol",
             sf, line, "INFERRED")
        existing[operation_id]["metadata"]["resolved_target_node"] = target_id

    # A shared source declaration of queue name + prefix proves config
    # compatibility, not connection equivalence or successful job execution.
    producers: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    workers: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    for rec, oid in bull_instances:
        queue, prefix = rec.get("queue"), rec.get("prefixExpression")
        if not (isinstance(queue, str) and queue and isinstance(prefix, str) and prefix):
            continue
        key = (str(rec["file"]), queue, prefix)
        if rec.get("instance") == "Queue":
            producers[key].append(oid)
        elif rec.get("instance") == "Worker":
            workers[key].append(oid)
    for (sf, queue, prefix), source_ids in producers.items():
        target_ids = workers.get((sf, queue, prefix), ())
        if len(source_ids) == 1 and len(target_ids) == 1:
            edge(source_ids[0], target_ids[0], "bull_source_declares_matching_queue_prefix",
                 sf, int(existing[source_ids[0]].get("source_location", "L1")[1:]),
                 "INFERRED")

    _link_nest_modules(nest_pairs, node, edge, existing, surface)


def extract_nexi_prisma_file(path: Path) -> dict[str, Any]:
    """Graphify per-file node for Prisma; unified adapter owns schema relations.

    Graphify's native classifier/dispatch must agree that .prisma is code;
    model, field, and physical-table edges are emitted once by the existing
    extract_nexi_relationships() pass, preserving their canonical identities.
    """
    from graphify.extractors.base import _make_id

    return {"nodes": [{
        "id": _make_id(str(path)),
        "label": path.name,
        "file_type": "code",
        "source_file": str(path),
        "source_location": "L1",
    }], "edges": []}
