"""NEXI native Prisma schema extraction for Graphify 0.9.108.

Model, mapped-table, field, and model-relation facts are structural declarations,
not evidence of live SQLite state. Reuses the proven NEXI restricted-model
parser to preserve existing graph IDs, source lines, and backend ownership.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from graphify.ids import make_id
from graphify.extractors.base import _make_id, active_scan_root

def _source(path: Path, root: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(root).as_posix()
    except ValueError as exc:
        raise ValueError(f"NEXI source outside extraction root: {resolved}") from exc

def parse_prisma_models(root: Path) -> dict[str, dict[str, Any]]:
    """Parse only the scoped model/field declarations, not general Prisma syntax."""
    result: dict[str, dict[str, Any]] = {}
    canonical = root / "prisma" / "schema.d1.prisma"
    schemas = [canonical] if canonical.is_file() else sorted(root.glob("prisma/**/*.prisma"))
    for schema in schemas:
        rel = _source(schema, root)
        lines = schema.read_text(encoding="utf-8").splitlines()
        current = None
        start = 0
        block: list[tuple[int, str]] = []
        for i, line in enumerate(lines, 1):
            m = re.match(r"^\s*model\s+(\w+)\s*\{", line)
            if m and current is None:
                current, start, block = m.group(1), i, []
                continue
            if current is None:
                continue
            if re.match(r"^\s*}\s*(?://.*)?$", line):
                raw = "\n".join(text for _, text in block)
                table = re.search(r'@@map\(\s*"([^"]+)"\s*\)', raw)
                fields = {}
                for field_line, row in block:
                    # The trailing word boundary truncated nullable and
                    # list type suffixes; retain the complete Prisma type.
                    f = re.match(r"^\s*(\w+)\s+([A-Za-z_]\w*(?:\[\]|\?)?)(?=\s|$)", row)
                    if f and not f.group(1).startswith("_"):
                        mapped = re.search(r'@map\(\s*"([^"]+)"\s*\)', row)
                        fields[f.group(1)] = {"type": f.group(2),
                                            "column": mapped.group(1) if mapped else f.group(1),
                                            "line": field_line}
                result[current.casefold()] = {"name": current, "table": table.group(1) if table else current,
                                                "source_file": rel, "line": start, "fields": fields}
                current, block = None, []
            else:
                block.append((i, line))
    return result


def extract_prisma_file(path: Path) -> dict[str, Any]:
    """Native per-file Prisma contribution; no application code is imported.

    Only the existing backend surface emits NEXI model resources. Arbitrary
    projects still retain a file node without pretending framework semantics.
    """
    path = Path(path)
    file = {"id": _make_id(str(path)), "label": path.name,
            "file_type": "code", "source_file": str(path),
            "source_location": "L1"}
    result: dict[str, Any] = {"nodes": [file], "edges": []}
    root = active_scan_root()
    if root is None or Path(root).resolve().name.lower() != "backend":
        return result
    root = Path(root).resolve()
    if not path.resolve().is_relative_to(root):
        return result
    # A project can contain multiple schemas; only the existing canonical
    # backend schema owns NEXI resource IDs until explicit multi-schema rules.
    canonical = root / "prisma" / "schema.d1.prisma"
    if canonical.is_file() and path.resolve() != canonical.resolve():
        return result
    models = parse_prisma_models(root)
    ids: set[str] = {file["id"]}

    def node(nid: str, label: str, kind: str, sf: str, line: int, **meta: Any) -> None:
        if nid in ids:
            return
        ids.add(nid)
        result["nodes"].append({
            "id": nid, "label": label, "file_type": "code",
            "source_file": sf, "source_location": f"L{line}",
            "metadata": {"entity_type": kind, "nexi_version": "nexi-framework-v1",
                         "surface": "backend", **meta},
        })

    def edge(source: str, target: str, relation: str, sf: str, line: int) -> None:
        result["edges"].append({
            "source": source, "target": target, "relation": relation,
            "context": "nexi", "confidence": "EXTRACTED",
            "source_file": sf, "source_location": f"L{line}",
        })

    for model in models.values():
        sf = model["source_file"]
        if (root / sf).resolve() != path.resolve():
            continue
        table_id = make_id("nexi", "backend", "table", model["table"])
        model_id = make_id("nexi", "backend", "model", model["name"])
        node(model_id, model["name"], "prisma_model_resource", sf, model["line"], model=model["name"])
        node(table_id, model["table"], "sqlite_table_resource", sf, model["line"], table=model["table"])
        edge(model_id, table_id, "maps_to_table", sf, model["line"])
        for field, info in model["fields"].items():
            field_id = make_id("nexi", "backend", "model", model["name"], "field", field)
            node(field_id, f"{model['name']}.{field}", "prisma_field_resource", sf,
                 info["line"], column=info["column"], field_type=info["type"])
            edge(model_id, field_id, "declares_field", sf, info["line"])
            referenced = models.get(str(info["type"]).strip("[]?").casefold())
            if referenced is not None:
                target_id = make_id("nexi", "backend", "model", referenced["name"])
                edge(field_id, target_id, "prisma_relation_target", sf, info["line"])
    return result
