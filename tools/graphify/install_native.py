"""Idempotent NEXI Graphify 0.9.108 extension installer.

Maintained files live in this directory; only Graphify's AST integration hook
and native framework/parser modules are installed into the existing uv tool.
This is source modification, not graph generation or a build.
"""
from __future__ import annotations

import ast
import hashlib
import subprocess
import importlib.metadata as metadata
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

PKG = Path("/home/mellonelay1999/.local/share/uv/tools/graphifyy/lib/python3.12/site-packages/graphify")
STATE = Path("/home/mellonelay1999/.local/share/graphify-nexi/graphify-http-extractor")
NATIVE_SOURCE = Path("/home/mellonelay1999/workspaces/Nexi/tools/graphify/native/graphify")
EXTRACT = PKG / "extract.py"
DETECT = PKG / "detect.py"
MODULE = PKG / "nexi_relationships.py"
SOURCE = NATIVE_SOURCE / "nexi_relationships.py"
SCANNER = PKG / "nexi_semantic_scan.cjs"
SCANNER_SOURCE = NATIVE_SOURCE / "nexi_semantic_scan.cjs"
HTTP = PKG / "http_relationships.py"
HTTP_SOURCE = NATIVE_SOURCE / "http_relationships.py"
PRISMA = PKG / "extractors" / "prisma.py"
PRISMA_SOURCE = NATIVE_SOURCE / "extractors" / "prisma.py"
CSS = PKG / "extractors" / "css.py"
CSS_SOURCE = NATIVE_SOURCE / "extractors" / "css.py"
GRAPHIFY_PYTHON = PKG.parents[3] / "bin" / "python"

NEXI_MERGE = PKG / "nexi_merge.py"
NEXI_MERGE_SOURCE = NATIVE_SOURCE / "nexi_merge.py"
# NEXI_NATIVE_ENGINE_PATCH_V1 — tracked patch; no competing extraction pipeline.
NATIVE_BUILD = PKG / "build.py"
NATIVE_SERVE = PKG / "serve.py"
NATIVE_AFFECTED = PKG / "affected.py"
NATIVE_CLI = PKG / "cli.py"
NATIVE_PATCH = Path(
    "/home/mellonelay1999/workspaces/Nexi/tools/graphify/patches/"
    "graphifyy-0.9.108-nexi-typed-relation-evidence.patch"
)
NATIVE_MODULE_SHA256 = {'build.py': 'c558f0721b9ea4e7e9e394ae21a26a9373544c807398e45dc05e1d7a4e9abc2f', 'serve.py': '2c8fff3ebe65861dd08486234bc929657e9cf581c0bc8980535f37d33fc8e260', 'affected.py': 'a805d07b1b02e480d720681cad9ec4d6eb5bc1919667d5bd8b8a20cac6a84a70', 'cli.py': '062faf6fc342e131b843a9aefdea89f0ae128e9368aeab3ea3abdd522705460d'}
MARKER = "    # NEXI_FRAMEWORK_RELATIONSHIPS_V1"
OLD_MARKER = "    # NEXI_HTTP_RELATIONSHIPS_V1"
ORIGIN_ANCHOR = "    # Tag AST provenance so the incremental watch rebuild can distinguish"
PRISMA_DETECT_MARKER = "# NEXI_PRISMA_DETECT_V1"
CSS_DETECT_MARKER = "# NEXI_CSS_DETECT_V1"
CSS_EXTRACT_MARKER = "    # NEXI_CSS_EXTRACT_V1"
PRISMA_DETECT_ANCHOR = "DOC_EXTENSIONS = "
PRISMA_EXTRACT_MARKER = "    # NEXI_PRISMA_EXTRACT_V1"
PRISMA_EXTRACT_ANCHOR = '    if suffix == ".h":'
CLEANUP_ANCHOR = '    for e in all_edges:\n        e.pop("local_alias", None)\n        e.pop("_python_plain_import", None)\n'

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def atomic_write(p: Path, data: bytes) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    old = p.stat() if p.exists() else None
    with tempfile.NamedTemporaryFile(prefix=".nexi-install-", dir=p.parent, delete=False) as tmp:
        tmp.write(data)
        tmp.flush()
        os.fsync(tmp.fileno())
        name = Path(tmp.name)
    try:
        if old:
            os.chmod(name, old.st_mode & 0o777)
            os.chown(name, old.st_uid, old.st_gid)
        os.replace(name, p)
    finally:
        name.unlink(missing_ok=True)

def ensure_native_graph_patch() -> str:
    """Reapply the tracked, version-pinned native patch after a uv replacement.

    Never accept a half-patched engine or fuzzy patch offsets as success.
    """
    for file in (NATIVE_BUILD, NATIVE_SERVE, NATIVE_AFFECTED, NATIVE_CLI, NATIVE_PATCH):
        if not file.is_file():
            raise SystemExit(f"Missing NEXI native engine input: {file}")
    build = NATIVE_BUILD.read_text(encoding="utf-8")
    serve = NATIVE_SERVE.read_text(encoding="utf-8")
    affected = NATIVE_AFFECTED.read_text(encoding="utf-8")
    cli = NATIVE_CLI.read_text(encoding="utf-8")
    has_build = build.count("def _nexi_relation_variants(") == 1
    has_serve = (serve.count("def _emit_parallel(d: dict)") == 1
                 and serve.count("def _path_edge_facts(") == 1)
    has_affected = affected.count("def _incoming_source_facts(") == 1
    has_cli = cli.count("NEXI_NATIVE_MERGE_CLI_V1") == 1
    if has_build and has_serve and has_affected and has_cli:
        for file in (NATIVE_BUILD, NATIVE_SERVE, NATIVE_AFFECTED, NATIVE_CLI):
            ast.parse(file.read_text(encoding="utf-8"), filename=str(file))
            if digest(file.read_bytes()) != NATIVE_MODULE_SHA256[file.name]:
                raise SystemExit(f"NEXI native module has drifted: {file}")
        return "unchanged"
    if has_build or has_serve or has_affected or has_cli:
        raise SystemExit("NEXI native engine partially patched; refusing overwrite")
    args = ["patch", "--batch", "--forward", "--fuzz=0", "-p1", "-d", str(PKG.parent)]
    payload = NATIVE_PATCH.read_text(encoding="utf-8")
    dry = subprocess.run([*args, "--dry-run"], input=payload,
                         capture_output=True, text=True, timeout=20)
    if dry.returncode:
        raise SystemExit(f"NEXI native patch mismatches Graphify 0.9.108: {dry.stdout[-900:]} {dry.stderr[-900:]}")
    result = subprocess.run(args, input=payload,
                            capture_output=True, text=True, timeout=20)
    if result.returncode:
        raise SystemExit(f"NEXI native patch failed: {result.stdout[-900:]} {result.stderr[-900:]}")
    for file in (NATIVE_BUILD, NATIVE_SERVE, NATIVE_AFFECTED, NATIVE_CLI):
        ast.parse(file.read_text(encoding="utf-8"), filename=str(file))
        if digest(file.read_bytes()) != NATIVE_MODULE_SHA256[file.name]:
            raise SystemExit(f"NEXI installed core module hash mismatch: {file}")
    return "installed"


def main() -> None:
    site = PKG.parent
    installed = next((d.version for d in metadata.distributions(path=[str(site)])
                      if d.metadata.get("Name", "").lower().replace("_", "-") == "graphifyy"), None)
    if installed != "0.9.108":
        raise SystemExit(f"Requires installed graphifyy 0.9.108, found {installed!r}")

    for p in (DETECT, EXTRACT, SOURCE, SCANNER_SOURCE, HTTP_SOURCE, PRISMA_SOURCE, CSS_SOURCE, NEXI_MERGE_SOURCE):
        if not p.is_file():
            raise SystemExit(f"Required integration source missing: {p}")
    # Validate every candidate before touching the installed package.
    for source in (SOURCE, HTTP_SOURCE, PRISMA_SOURCE, CSS_SOURCE, NEXI_MERGE_SOURCE):
        ast.parse(source.read_text(encoding="utf-8"), filename=str(source))
    node = Path("/opt/nexi/runtime/node-v24.21.0/bin/node")
    if not node.is_file():
        raise SystemExit(f"Missing existing Node 24 for NEXI semantic scanner: {node}")
    checked = subprocess.run([str(node), "--check", str(SCANNER_SOURCE)],
                             capture_output=True, text=True, timeout=20, check=False)
    if checked.returncode:
        raise SystemExit(f"NEXI scanner JavaScript syntax invalid: {checked.stderr[-1200:]}")
    # Install the missing native CSS parser dependency inside the isolated
    # Graphify uv tool, never the NEXI application dependency stores.
    probe = subprocess.run([str(GRAPHIFY_PYTHON), "-c", "import tinycss2"],
                           capture_output=True, text=True, timeout=20)
    if probe.returncode:
        uv = shutil.which("uv") or "/home/mellonelay1999/.local/bin/uv"
        result = subprocess.run([str(uv), "pip", "install", "--python",
                                 str(GRAPHIFY_PYTHON), "tinycss2==1.5.1"],
                                capture_output=True, text=True, timeout=90)
        if result.returncode:
            raise SystemExit(f"Cannot install native CSS parser: {result.stderr[-900:]}")
    native_patch_status = ensure_native_graph_patch()
    desired_scanner = SCANNER_SOURCE.read_bytes()
    desired_prisma = PRISMA_SOURCE.read_bytes()
    desired_css = CSS_SOURCE.read_bytes()
    desired_merge = NEXI_MERGE_SOURCE.read_bytes()
    existing_http = HTTP.read_bytes() if HTTP.exists() else b""
    desired_http = HTTP_SOURCE.read_bytes()
    # Tracked native modules replace their installed copies with a backup.

    detected_original = DETECT.read_text(encoding="utf-8")
    detect_hook = '# NEXI_PRISMA_DETECT_V1\nCODE_EXTENSIONS.add(".prisma")\n'
    if detected_original.count(PRISMA_DETECT_MARKER) > 1:
        raise SystemExit("Duplicate NEXI detect marker")
    if PRISMA_DETECT_MARKER not in detected_original:
        if detected_original.count(PRISMA_DETECT_ANCHOR) != 1:
            raise SystemExit("Graphify detect extension anchor changed; refusing patch")
        desired_detect = detected_original.replace(
            PRISMA_DETECT_ANCHOR, detect_hook + PRISMA_DETECT_ANCHOR, 1)
    else:
        if detected_original.count(detect_hook) != 1:
            raise SystemExit("Existing NEXI detect hook differs; refusing patch")
        desired_detect = detected_original
    css_detect_hook = '# NEXI_CSS_DETECT_V1\nCODE_EXTENSIONS.add(".css")\n'
    if desired_detect.count(CSS_DETECT_MARKER) > 1:
        raise SystemExit("Duplicate native CSS detection hook")
    if CSS_DETECT_MARKER not in desired_detect:
        if desired_detect.count(PRISMA_DETECT_ANCHOR) != 1:
            raise SystemExit("Graphify native CSS detector anchor changed")
        desired_detect = desired_detect.replace(
            PRISMA_DETECT_ANCHOR, css_detect_hook + PRISMA_DETECT_ANCHOR, 1)
    elif desired_detect.count(css_detect_hook) != 1:
        raise SystemExit("Native CSS detection hook differs")
    ast.parse(desired_detect)
    original = EXTRACT.read_text(encoding="utf-8")
    if original.count(ORIGIN_ANCHOR) != 1 or original.count(CLEANUP_ANCHOR) != 1:
        raise SystemExit("Graphify 0.9.108 AST finalization anchors changed; refusing patch")
    if original.count(MARKER) > 1 or original.count(OLD_MARKER) > 1:
        raise SystemExit("Duplicate Graphify integration hooks; refusing patch")

    old_hook = '''    # NEXI_HTTP_RELATIONSHIPS_V1
    # Preserve the NEXI custom HTTP and React Context AST relationship pass.
    from graphify.http_relationships import extract_http_relationships
    extract_http_relationships(paths, root, all_nodes, all_edges)

'''
    new_hook = '''    # NEXI_FRAMEWORK_RELATIONSHIPS_V1
    # One unified NEXI structural pass: HTTP/React Context plus framework rules.
    # Run before Graphify stamps AST provenance and canonicalizes source paths.
    from graphify.nexi_relationships import extract_nexi_relationships
    extract_nexi_relationships(paths, root, all_nodes, all_edges)

'''
    text = original
    if OLD_MARKER in text:
        if text.count(old_hook) != 1:
            raise SystemExit("Existing legacy HTTP hook differs; refusing unsafe rewrite")
        text = text.replace(old_hook, "", 1)
    if MARKER not in text:
        text = text.replace(ORIGIN_ANCHOR, new_hook + ORIGIN_ANCHOR, 1)
    elif text.count(new_hook) != 1:
        raise SystemExit("Unified NEXI hook differs; refusing patch")
    # Native per-file Prisma model/field/table extraction; framework adapter
    # retains source-linked Prisma consumer resolution.
    prisma_hook = (
        "    # NEXI_PRISMA_EXTRACT_V1\n"
        '    if path.suffix.lower() == ".prisma":\n'
        "        from graphify.extractors.prisma import extract_prisma_file\n"
        "        return extract_prisma_file\n"
    )
    if text.count(PRISMA_EXTRACT_MARKER) > 1:
        raise SystemExit("Duplicate NEXI Prisma dispatch hook")
    if PRISMA_EXTRACT_MARKER not in text:
        if text.count(PRISMA_EXTRACT_ANCHOR) != 1:
            raise SystemExit("Graphify Prisma dispatch anchor changed; refusing patch")
        text = text.replace(PRISMA_EXTRACT_ANCHOR, prisma_hook + PRISMA_EXTRACT_ANCHOR, 1)
    elif text.count(prisma_hook) != 1:
        legacy_prisma_hook = (
            "    # NEXI_PRISMA_EXTRACT_V1\n"
            '    if path.suffix.lower() == ".prisma":\n'
            "        from graphify.nexi_relationships import extract_nexi_prisma_file\n"
            "        return extract_nexi_prisma_file\n"
        )
        if text.count(legacy_prisma_hook) != 1:
            raise SystemExit("Existing NEXI Prisma extractor hook differs")
        text = text.replace(legacy_prisma_hook, prisma_hook, 1)
    css_hook = (
        "    # NEXI_CSS_EXTRACT_V1\n"
        '    if path.suffix.lower() == ".css":\n'
        "        from graphify.extractors.css import extract_css_file\n"
        "        return extract_css_file\n"
    )
    if text.count(CSS_EXTRACT_MARKER) > 1:
        raise SystemExit("Duplicate native CSS extractor hook")
    if CSS_EXTRACT_MARKER not in text:
        if text.count(PRISMA_EXTRACT_ANCHOR) != 1:
            raise SystemExit("Graphify CSS dispatch anchor changed")
        text = text.replace(PRISMA_EXTRACT_ANCHOR,
                            css_hook + PRISMA_EXTRACT_ANCHOR, 1)
    elif text.count(css_hook) != 1:
        raise SystemExit("Existing native CSS extractor hook differs")
    ast.parse(text)
    if text.count(MARKER) != 1 or OLD_MARKER in text:
        raise SystemExit("Invalid unified NEXI hook cardinality")
    if text.index(CLEANUP_ANCHOR) > text.index(MARKER) or text.index(MARKER) > text.index(ORIGIN_ANCHOR):
        raise SystemExit("NEXI hook must be after resolver cleanup and before AST provenance")

    will_update = (desired_detect != detected_original or text != original
                   or not MODULE.exists() or MODULE.read_bytes() != SOURCE.read_bytes()
                   or not HTTP.exists() or HTTP.read_bytes() != desired_http
                   or not SCANNER.exists() or SCANNER.read_bytes() != desired_scanner
                   or not PRISMA.exists() or PRISMA.read_bytes() != desired_prisma
                   or not CSS.exists() or CSS.read_bytes() != desired_css
                   or not NEXI_MERGE.exists() or NEXI_MERGE.read_bytes() != desired_merge)
    if will_update:
        backup = STATE / "backups"
        backup.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        if desired_detect != detected_original:
            saved = backup / f"detect-{installed}-{stamp}-{digest(detected_original.encode())[:12]}.py"
            if not saved.exists():
                shutil.copy2(DETECT, saved)
        if text != original:
            saved = backup / f"extract-{installed}-{stamp}-{digest(original.encode())[:12]}.py"
            if not saved.exists():
                shutil.copy2(EXTRACT, saved)
        for name, deployed, desired in (("nexi_relationships", MODULE, SOURCE.read_bytes()),
                                        ("http_relationships", HTTP, desired_http),
                                        ("nexi_semantic_scan", SCANNER, desired_scanner),
                                        ("prisma", PRISMA, desired_prisma),
                                        ("css", CSS, desired_css),
                                        ("nexi_merge", NEXI_MERGE, desired_merge)):
            if deployed.exists() and deployed.read_bytes() != desired:
                saved = backup / f"{name}-{stamp}-{digest(deployed.read_bytes())[:12]}{deployed.suffix}"
                if not saved.exists():
                    shutil.copy2(deployed, saved)

    # Prepare and install the module before activating the integration hook.
    if not MODULE.exists() or MODULE.read_bytes() != SOURCE.read_bytes():
        atomic_write(MODULE, SOURCE.read_bytes())
    if not HTTP.exists() or HTTP.read_bytes() != desired_http:
        atomic_write(HTTP, desired_http)
    if not SCANNER.exists() or SCANNER.read_bytes() != desired_scanner:
        atomic_write(SCANNER, desired_scanner)
    if not PRISMA.exists() or PRISMA.read_bytes() != desired_prisma:
        atomic_write(PRISMA, desired_prisma)
    if not CSS.exists() or CSS.read_bytes() != desired_css:
        atomic_write(CSS, desired_css)
    if not NEXI_MERGE.exists() or NEXI_MERGE.read_bytes() != desired_merge:
        atomic_write(NEXI_MERGE, desired_merge)
    if desired_detect != detected_original:
        atomic_write(DETECT, desired_detect.encode("utf-8"))
    if text != original:
        atomic_write(EXTRACT, text.encode("utf-8"))
    print(f"nexi_native_engine={native_patch_status}")
    print(f"graphify={installed} hook={'unchanged' if text == original else 'installed'} "
          f"module_sha256={digest(MODULE.read_bytes())} scanner_sha256={digest(SCANNER.read_bytes())}")

if __name__ == "__main__":
    main()
