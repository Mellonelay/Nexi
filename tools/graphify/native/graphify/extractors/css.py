"""NEXI source-only CSS selector/token declarations for native Graphify.

Uses the CSS Syntax Level 3 parser; never infers that a JSX class reference
is necessarily applied at runtime. Scoped to the Public/Admin source roots.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import tinycss2
from graphify.ids import make_id
from graphify.extractors.base import _make_id, active_scan_root

_CLASS = re.compile(r"(?<![\w-])\.([A-Za-z_-][\w-]*)")
_ID = re.compile(r"(?<![\w-])#([A-Za-z_-][\w-]*)")
_MAX_BYTES = 2_000_000


def extract_css_file(path: Path) -> dict[str, Any]:
    path = Path(path).resolve()
    file_node = {"id": _make_id(str(path)), "label": path.name,
                 "file_type": "code", "source_file": str(path),
                 "source_location": "L1"}
    result: dict[str, Any] = {"nodes": [file_node], "edges": []}
    active = active_scan_root()
    if active is None:
        return result
    root = Path(active).resolve()
    if root.name.lower() not in {"frontend", "admin"} or not path.is_relative_to(root):
        return result
    if path.suffix.lower() != ".css" or not path.is_file() or path.stat().st_size > _MAX_BYTES:
        return result
    source = path.relative_to(root).as_posix()
    surface = root.name.lower()
    rules = tinycss2.parse_stylesheet_bytes(
        path.read_bytes(), skip_comments=True, skip_whitespace=True
    )[0]
    emitted: set[str] = set()

    def emit(kind: str, name: str, line: int) -> None:
        ident = make_id("nexi", surface, "css", source, kind, name)
        if ident in emitted:
            return
        emitted.add(ident)
        result["nodes"].append({
            "id": ident, "label": name, "file_type": "code",
            "source_file": source, "source_location": f"L{line}",
            "metadata": {"entity_type": kind, "surface": surface,
                         "nexi_version": "nexi-framework-v1"}
        })
        result["edges"].append({
            "source": file_node["id"], "target": ident,
            "relation": "declares_css_selector" if kind == "css_selector" else "declares_css_token",
            "context": "css", "confidence": "EXTRACTED",
            "source_file": source, "source_location": f"L{line}",
        })

    def visit(items: list[Any]) -> None:
        for rule in items:
            if rule.type == "qualified-rule":
                selector = tinycss2.serialize(rule.prelude)
                for match in _CLASS.finditer(selector):
                    emit("css_selector", "." + match.group(1), rule.source_line)
                for match in _ID.finditer(selector):
                    emit("css_selector", "#" + match.group(1), rule.source_line)
                if rule.content is not None:
                    for declaration in tinycss2.parse_declaration_list(
                        rule.content, skip_comments=True, skip_whitespace=True
                    ):
                        if declaration.type == "declaration" and declaration.name.startswith("--"):
                            emit("css_token", declaration.name, declaration.source_line)
            elif rule.type == "at-rule" and rule.content is not None and rule.lower_at_keyword in {
                "media", "supports", "layer", "container", "scope"
            }:
                visit(tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True))

    visit(rules)
    return result
