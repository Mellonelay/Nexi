#!/usr/bin/env python3
"""Canonicalize Graphify HTTP operation nodes after per-surface graph merge."""
from __future__ import annotations
import copy
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(os.environ.get('GRAPHIFY_NEXI_GRAPH_ROOT', '/srv/nexi/graphify-live/20261107'))
GRAPH = ROOT / 'merged-graph.json'
REPORT = ROOT / 'merged-graph-report.json'
# NEXI_NATIVE_MERGE_V1 — authoritative extractors ship inside graphify.
NATIVE_PACKAGE = Path(__file__).resolve().parent
EXTRACTOR = NATIVE_PACKAGE / 'http_relationships.py'
NEXI_EXTENSION = NATIVE_PACKAGE / 'nexi_relationships.py'
NEXI_SCANNER = NATIVE_PACKAGE / 'nexi_semantic_scan.cjs'
NEXI_PRISMA = NATIVE_PACKAGE / 'extractors' / 'prisma.py'
NEXI_INSTALLER = Path('/home/mellonelay1999/workspaces/Nexi/tools/graphify/install_native.py')
NEXI_PATCH = Path('/home/mellonelay1999/workspaces/Nexi/tools/graphify/patches/graphifyy-0.9.108-nexi-typed-relation-evidence.patch')
SOURCE_MANIFEST = ROOT / 'source-manifest.json'
PROFILE = os.environ.get("GRAPHIFY_NEXI_SOURCE_PROFILE", "main")
SURFACE_PROFILES = {
    "main": {
        "frontend": {"root": "/home/mellonelay1999/workspaces/Nexi/frontend", "revision": None},
        "backend": {"root": "/home/mellonelay1999/workspaces/Nexi/backend", "revision": None},
        "admin": {"root": "/home/mellonelay1999/workspaces/Nexi/Admin", "revision": None},
    },
    "deployed": {
        "frontend": {"root": "/srv/nexi/public/current", "release": "/srv/nexi/public/current/RELEASE_SHA", "revision": None},
        "backend": {"root": "/srv/nexi/backend", "release": "/srv/nexi/backend/RELEASE_SHA", "revision": None},
        "admin": {"root": "/srv/nexi/admin/current", "release": "/srv/nexi/admin/current/RELEASE_SHA", "revision": None},
    },
}
SURFACES = SURFACE_PROFILES[PROFILE]
HTTP_RELATIONS = {'http_calls', 'http_handled_by', 'http_route_delegates_to', 'http_path_pattern_may_match', 'http_call_unresolved'}

def operation_key(node):
    m = node.get('metadata') or {}
    if m.get('entity_type') != 'http_operation':
        return None
    return (m.get('http_method'), m.get('http_path'), m.get('http_origin'))

def canonical_id(key, nodes):
    local_ids = {n.get('local_id') for n in nodes if n.get('local_id')}
    if len(local_ids) == 1:
        return next(iter(local_ids))
    method, path, origin = key
    return f"http_operation:{method}:{path}" + (f"@{origin}" if origin else '')

def normalize_graph(data):
    # A graph generated with an earlier extractor is not current graph truth.
    # The older manifest remains inspectable, but normalization fails closed.
    if SOURCE_MANIFEST.is_file():
        source_manifest()
    nodes = data.get('nodes', [])
    links = data.get('links', data.get('edges', []))
    by_key = defaultdict(list)
    for n in nodes:
        key = operation_key(n)
        if key:
            by_key[key].append(n)
    old_to_new = {}
    canonical_nodes = {}
    for key, group in by_key.items():
        cid = canonical_id(key, group)
        for n in group:
            old_to_new[n['id']] = cid
        merged = copy.deepcopy(group[0])
        repositories = sorted({n.get('repo') for n in group if n.get('repo')})
        merged.update({'id': cid, 'local_id': cid, 'repo': 'cross-surface' if len(repositories) > 1 else (repositories[0] if repositories else 'unknown')})
        merged.setdefault('metadata', {})['surface_repositories'] = repositories
        canonical_nodes[cid] = merged

    non_ops = [n for n in nodes if not operation_key(n)]
    non_op_ids = {n.get('id') for n in non_ops}
    collision = non_op_ids & set(canonical_nodes)
    if collision:
        raise ValueError(f'canonical HTTP id collides with non-HTTP node: {sorted(collision)[:5]}')
    final_nodes = non_ops + list(canonical_nodes.values())

    # merge-graphs prefixes IDs with the surface (e.g. backend::), while
    # scanner metadata retains local IDs. Translate unique source-backed
    # pointers to the actual merged IDs; never invent cross-surface owners.
    actual_ids = {n['id'] for n in final_nodes}
    local_targets = defaultdict(set)
    for n in final_nodes:
        if n.get('local_id'):
            local_targets[n['local_id']].add(n['id'])
    for n in final_nodes:
        meta = n.get('metadata') or {}
        target = meta.get('resolved_target_node')
        if target in actual_ids:
            # The operation was resolved after the scanner's first pass.
            # Do not retain contradictory stale unresolved metadata.
            meta.pop('unresolved_target', None)
            continue
        if not target:
            continue
        candidates = local_targets.get(target, set())
        if len(candidates) == 1:
            meta['resolved_target_node'] = next(iter(candidates))
            meta.pop('unresolved_target', None)
        else:
            # An ambiguous/unavailable target is not a resolved edge.
            meta.pop('resolved_target_node', None)
            meta['unresolved_target_reference'] = (
                'ambiguous-merged-node' if candidates else 'missing-merged-node')

    final_links = []
    signatures = set()
    for raw in links:
        e = dict(raw)
        e['source'] = old_to_new.get(e.get('source'), e.get('source'))
        e['target'] = old_to_new.get(e.get('target'), e.get('target'))
        sig = json.dumps(e, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        if sig not in signatures:
            signatures.add(sig)
            final_links.append(e)

    node_index = {n.get('id'): n for n in final_nodes}
    call_edges = [e for e in final_links if e.get('relation') == 'http_calls' and e.get('target') in canonical_nodes]
    handler_edges = [e for e in final_links if e.get('relation') == 'http_handled_by' and e.get('source') in canonical_nodes]
    call_by_op = defaultdict(list)
    handled_by_op = defaultdict(list)
    for e in call_edges:
        call_by_op[e['target']].append(e)
    for e in handler_edges:
        handled_by_op[e['source']].append(e)

    # Reproduce the extractor's conservative dynamic-template rule across separately
    # extracted surfaces. It only emits INFERRED candidates when both paths have
    # parameter segments, the method and segment count agree, and fixed segments match.
    for caller_id, callers in call_by_op.items():
        caller = canonical_nodes[caller_id]
        cm = caller.get('metadata', {})
        cverb, cpath = cm.get('http_method'), cm.get('http_path', '')
        cparts = cpath.strip('/').split('/') if cpath != '/' else []
        if cverb == 'ANY' or ':param' not in cparts:
            continue
        for server_id, servers in handled_by_op.items():
            if server_id == caller_id:
                continue
            server = canonical_nodes[server_id]
            sm = server.get('metadata', {})
            if sm.get('http_method') != cverb or sm.get('http_origin') != cm.get('http_origin'):
                continue
            spath = sm.get('http_path', '')
            sparts = spath.strip('/').split('/') if spath != '/' else []
            if len(cparts) != len(sparts) or ':param' not in sparts:
                continue
            if not all(a == b or a == ':param' or b == ':param' for a, b in zip(cparts, sparts)):
                continue
            source_edge = callers[0]
            edge = {
                'source': caller_id, 'target': server_id,
                'relation': 'http_path_pattern_may_match', 'context': 'http',
                'confidence': 'INFERRED', 'confidence_score': 0.7,
                'source_file': source_edge.get('source_file', ''),
                'source_location': source_edge.get('source_location', ''),
            }
            sig = json.dumps(edge, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
            if sig not in signatures:
                signatures.add(sig)
                final_links.append(edge)

    # Graphify stores direction in _src/_tgt on merged undirected graphs. Keep the
    # directional fields aligned after operation-node IDs are normalized.
    for e in final_links:
        if '_src' in e:
            e['_src'] = old_to_new.get(e['_src'], e['_src'])
        if '_tgt' in e:
            e['_tgt'] = old_to_new.get(e['_tgt'], e['_tgt'])
        variants = e.get("parallel_relations")
        if isinstance(variants, list):
            rewritten = []
            for variant in variants:
                if not isinstance(variant, dict):
                    continue
                item = dict(variant)
                for key in ("_src", "_tgt"):
                    if key in item:
                        item[key] = old_to_new.get(item[key], item[key])
                rewritten.append(item)
            e["parallel_relations"] = rewritten
    link_explicit_socket_events(final_nodes, final_links)
    add_declared_infrastructure(final_nodes, final_links)
    data['nodes'] = final_nodes
    if 'links' in data:
        data['links'] = final_links
    else:
        data['edges'] = final_links
    return data

def typed_relation_integrity(data: dict) -> dict:
    """Check NEXI parallel edge facts against actual serialized graph nodes."""
    nodes = {n.get("id") for n in data.get("nodes", [])}
    links = data.get("links", data.get("edges", []))
    errors: list[str] = []
    preserved = 0
    for edge in links:
        variants = edge.get("parallel_relations")
        if not isinstance(variants, list):
            continue
        pair = {edge.get("source"), edge.get("target")}
        if len(variants) < 2:
            errors.append("parallel_relations requires distinct facts")
            continue
        seen: set[tuple] = set()
        for item in variants:
            if not isinstance(item, dict):
                errors.append("non-object secondary relation")
                continue
            src, tgt, relation = item.get("_src"), item.get("_tgt"), item.get("relation")
            if not src or not tgt or not isinstance(relation, str) or not relation:
                errors.append("secondary relation lacks directed identity")
                continue
            if src not in nodes or tgt not in nodes or {src, tgt} != pair:
                errors.append("secondary relation references unrelated endpoints")
                continue
            signature = (src, tgt, relation)
            if signature in seen:
                errors.append("duplicate secondary relation fact")
                continue
            seen.add(signature)
            preserved += 1
    return {"preserved_typed_facts": preserved, "issues": errors}


def normalize_native_merge(data: dict, out_path: Path, graph_paths: list[Path]) -> dict:
    """NEXI's opt-in native Graphify merge finalization.

    Only the explicitly requested, version-matched three-surface artifact may
    be normalized. Stale or omitted manifests fail closed before graph output.
    No application execution, network access, or graph rebuild happens here.
    """
    if os.environ.get("GRAPHIFY_NEXI_NATIVE_MERGE") != "1":
        return data
    destination = Path(out_path).resolve()
    if destination.parent != ROOT.resolve() or destination != GRAPH.resolve():
        raise ValueError("NEXI native merge destination must be its explicit merged-graph.json")
    if not SOURCE_MANIFEST.is_file():
        raise ValueError("NEXI native merge requires a current source-manifest.json")
    manifest = source_manifest()
    if manifest.get("manifest_format") != "nexi-native-v2":
        raise ValueError("NEXI native merge requires v2 source coverage inventory")
    expected = manifest.get("surface_graphs") or {}
    if set(expected) != set(SURFACES):
        raise ValueError("NEXI merge manifest must cover all three known surfaces")
    paths = {Path(p).resolve() for p in graph_paths}
    registered = {Path(v["path"]).resolve() for v in expected.values()}
    if paths != registered or len(graph_paths) != len(SURFACES):
        raise ValueError("NEXI native merge inputs differ from the manifest")
    for item in expected.values():
        path = Path(item["path"]).resolve()
        if hashlib.sha256(path.read_bytes()).hexdigest() != item.get("sha256"):
            raise ValueError(f"Stale NEXI surface graph: {path}")
    for surface, files in (manifest.get("source_files") or {}).items():
        if surface not in SURFACES or not isinstance(files, dict):
            raise ValueError("Invalid NEXI surface source manifest")
        repo = Path(SURFACES[surface]["root"]).resolve()
        for relative, expected_sha in files.items():
            source = (repo / relative).resolve()
            if not source.is_relative_to(repo) or not source.is_file():
                raise ValueError(f"Missing or escaped NEXI source: {surface}: {relative}")
            if hashlib.sha256(source.read_bytes()).hexdigest() != expected_sha:
                raise ValueError(f"Changed NEXI source: {surface}: {relative}")
    result = normalize_graph(data)
    ids = {node.get("id") for node in result.get("nodes", [])}
    if len(ids) != len(result.get("nodes", [])):
        raise ValueError("NEXI merge yielded duplicate canonical node IDs")
    links = result.get("links", result.get("edges", []))
    issues = typed_relation_integrity(result)
    if issues["issues"]:
        raise ValueError(f"NEXI typed relation integrity failure: {issues['issues'][:3]}")
    for edge in links:
        if edge.get("source") not in ids or edge.get("target") not in ids:
            raise ValueError("NEXI merge yielded a dangling edge")
        if edge.get("relation") in HTTP_RELATIONS and (
            not edge.get("source_file") or not edge.get("source_location")
        ):
            raise ValueError("NEXI HTTP edge lacks source provenance")
    return result


def graphify_version():
    from importlib import metadata
    site = Path('/home/mellonelay1999/.local/share/uv/tools/graphifyy/lib/python3.12/site-packages')
    return next((d.version for d in metadata.distributions(path=[str(site)])
                 if d.metadata.get('Name', '').lower().replace('_', '-') == 'graphifyy'), None)


def candidate_source_inventory(root: Path) -> dict[str, str]:
    """Bounded tracked/new source candidates for gap and freshness accounting.

    This is an input inventory, not an assertion that each file has symbols.
    Ignore sensitive paths and non-source assets. Include stylesheet/config
    candidates that the current Graphify extractor may not yet support.
    """
    from graphify.detect import FileType, classify_file, _is_sensitive
    cmd = ["git", "-C", str(root), "ls-files", "--cached", "--others",
           "--exclude-standard", "-z", "--", "."]
    outcome = subprocess.run(cmd, capture_output=True, timeout=12)
    if outcome.returncode:
        raise ValueError(f"Cannot enumerate NEXI source candidates: {root}")
    candidates: dict[str, str] = {}
    for raw in outcome.stdout.split(b"\0"):
        if not raw:
            continue
        relative = os.fsdecode(raw)
        path = (root / relative).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            continue
        if _is_sensitive(path):
            continue
        extension = path.suffix.lower()
        # CSS and infrastructure files remain coverage candidates even when
        # Graphify's own CODE_EXTENSIONS does not recognize them yet.
        explicit = extension in {".css", ".scss", ".sass", ".conf", ".service", ".jsonc"}
        if classify_file(path) != FileType.CODE and not explicit:
            continue
        if path.stat().st_size > 8_000_000:
            continue  # source input size cap; not a graph correctness claim
        rel = path.relative_to(root).as_posix()
        candidates[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
    return dict(sorted(candidates.items()))


def write_source_manifest():
    """Record the exact three surface graph inputs and source bytes, including dirty edits.

    Source-only manifest builder, intentionally a distinct CLI mode. Never
    rewrites source files, runs application commands, or fabricates Git state.
    Run after all per-surface extracts are complete and before normalization.
    """
    manifest = {
        'profile': PROFILE,
        'created_at_utc': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        'graphify_version': graphify_version(),
        'manifest_format': 'nexi-native-v2',
        'candidate_source_files': {},
        'source_coverage': {},
        'source_revisions': {},
        'source_file_counts': {},
        'source_files': {},
        'surface_graphs': {},
        'extensions': {
            'http_sha256': hashlib.sha256(EXTRACTOR.read_bytes()).hexdigest(),
            'python_sha256': hashlib.sha256(NEXI_EXTENSION.read_bytes()).hexdigest(),
            'typescript_sha256': hashlib.sha256(NEXI_SCANNER.read_bytes()).hexdigest(),
            'canonicalizer_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'installer_sha256': hashlib.sha256(NEXI_INSTALLER.read_bytes()).hexdigest(),
            'prisma_sha256': hashlib.sha256(NEXI_PRISMA.read_bytes()).hexdigest(),
            'native_patch_sha256': hashlib.sha256(NEXI_PATCH.read_bytes()).hexdigest(),
        },
    }
    for surface, cfg in SURFACES.items():
        graph_path = ROOT / 'surfaces' / surface / 'graphify-out' / 'graph.json'
        if not graph_path.is_file():
            raise FileNotFoundError(f'Cannot create source manifest: {graph_path} missing')
        graph = json.loads(graph_path.read_text(encoding='utf-8'))
        src_root = Path(cfg['root']).resolve()
        if not src_root.is_dir():
            raise FileNotFoundError(f'Cannot create source manifest: {src_root} missing')
        unique = sorted({str(n.get('source_file') or '') for n in graph.get('nodes', [])
                         if str(n.get('source_file') or '').strip()})
        files = {}
        for sf in unique:
            raw = Path(sf)
            path = raw.resolve() if raw.is_absolute() else (src_root / raw).resolve()
            if not path.is_relative_to(src_root):
                raise ValueError(f'Graph source escapes approved root: {surface}: {sf}')
            if not path.is_file():
                # Some graph nodes refer to semantic concepts rather than files.
                continue
            rel = path.relative_to(src_root).as_posix()
            files[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
        if not files:
            raise ValueError(f'No readable source files in {surface} graph')
        candidates = candidate_source_inventory(src_root)
        missing = sorted(set(candidates) - set(files))
        manifest['candidate_source_files'][surface] = candidates
        manifest['source_coverage'][surface] = {
            'candidate_inputs': len(candidates),
            'represented_candidate_inputs': len(set(candidates) & set(files)),
            'candidate_inputs_without_nodes': len(missing),
            'candidate_inputs_without_nodes_sample': missing[:35],
            'classification_note': 'candidate files without nodes may be unsupported, empty, excluded or extraction failures',
        }
        encoded = '\n'.join(k + '\0' + files[k] for k in sorted(files)).encode('utf-8')
        tree_sha = hashlib.sha256(encoded).hexdigest()
        state = {'git_head': None, 'dirty': None, 'source_tree_sha256': tree_sha}
        if PROFILE == 'main':
            commit = subprocess.run(['git','-C',str(src_root),'rev-parse','HEAD'],
                                    capture_output=True,text=True,timeout=8)
            status = subprocess.run(['git','-C',str(src_root),'status','--porcelain'],
                                    capture_output=True,text=True,timeout=12)
            if commit.returncode == 0:
                state['git_head'] = commit.stdout.strip()
            if status.returncode == 0:
                state['dirty'] = bool(status.stdout.strip())
        else:
            release = src_root / 'RELEASE_SHA'
            if release.is_file():
                state['release_sha'] = release.read_text(encoding='utf-8').strip()
        manifest['source_revisions'][surface] = state
        manifest['source_file_counts'][surface] = len(files)
        manifest['source_files'][surface] = files
        manifest['surface_graphs'][surface] = {'path': str(graph_path),
             'sha256': hashlib.sha256(graph_path.read_bytes()).hexdigest()}
    temp = SOURCE_MANIFEST.with_suffix('.json.next')
    temp.write_text(json.dumps(manifest,sort_keys=True,indent=2),encoding='utf-8')
    os.replace(temp,SOURCE_MANIFEST)
    return manifest


def source_manifest():
    if not SOURCE_MANIFEST.is_file():
        return None
    m = json.loads(SOURCE_MANIFEST.read_text(encoding='utf-8'))
    if not isinstance(m, dict) or m.get('profile') not in (None, PROFILE):
        raise ValueError('Source manifest must match requested NEXI graph profile')
    expected = {
        'http_sha256': EXTRACTOR,
        'python_sha256': NEXI_EXTENSION,
        'typescript_sha256': NEXI_SCANNER,
        'canonicalizer_sha256': Path(__file__),
        'installer_sha256': NEXI_INSTALLER,
        'prisma_sha256': NEXI_PRISMA,
        'native_patch_sha256': NEXI_PATCH,
    }
    if m.get("manifest_format") == "nexi-native-v2":
        inputs = m.get("candidate_source_files")
        if not isinstance(inputs, dict) or set(inputs) != set(SURFACES):
            raise ValueError("Incomplete NEXI candidate source inventory")
        for surface, files in inputs.items():
            root = Path(SURFACES[surface]["root"]).resolve()
            current = candidate_source_inventory(root)
            if files != current:
                before, now = set(files), set(current)
                added, missing = len(now - before), len(before - now)
                changed = len({k for k in before & now if files[k] != current[k]})
                raise ValueError(
                    f"Stale NEXI source candidate inventory: {surface}: "
                    f"added={added}, removed={missing}, changed={changed}"
                )
    versions = m.get('extensions') or {}
    for name, source in expected.items():
        previous = versions.get(name)
        current = hashlib.sha256(source.read_bytes()).hexdigest()
        if previous != current:
            raise ValueError(f'Stale graph manifest: {name} changed or missing; '
                             'do not claim this graph represents the current extractor')
    return m


def link_explicit_socket_events(nodes, links):
    """Join exact scoped events; report unique unscoped candidates separately.

    Event name alone does not establish origin, room or delivery. Server
    emitters and browser clients must use the same namespace and event,
    and the source direction must be compatible. Unknown origins never
    become confirmed joins.
    """
    by_id = {n.get("id"): n for n in nodes}
    producers, consumers = defaultdict(list), defaultdict(list)
    for e in links:
        relation = e.get("relation")
        if relation not in {"emits_event", "listens_for_event"}:
            continue
        resource = by_id.get(e.get("target")) or {}
        m = resource.get("metadata") or {}
        if m.get("entity_type") != "socket_event_resource":
            continue
        namespace, event, direction = m.get("namespace"), m.get("event"), m.get("direction")
        if not all(isinstance(v, str) and v for v in (namespace, event, direction)):
            continue
        source = by_id.get(e.get("source")) or {}
        repo = source.get("repo") or (source.get("metadata") or {}).get("surface")
        info = (repo, e, m)
        key = (namespace, event, direction)
        (producers if relation == "emits_event" else consumers)[key].append(info)

    seen = {(e.get("source"), e.get("target"), e.get("relation")) for e in links}
    for key in sorted(set(producers) & set(consumers)):
        prods, cons = producers[key], consumers[key]
        for src_repo, producer, src_meta in prods:
            for dst_repo, consumer, dst_meta in cons:
                if not src_repo or not dst_repo or src_repo == dst_repo:
                    continue
                left = src_meta.get("origin_scope")
                right = dst_meta.get("origin_scope")
                valid_left = left not in (None, "", "origin-unspecified")
                valid_right = right not in (None, "", "origin-unspecified")
                if valid_left and valid_right and left != right:
                    continue
                exact = valid_left and valid_right and left == right
                # When origin is unknown, uniqueness within the namespace,
                # event and direction is needed even for a tentative edge.
                unique = len({x[0] for x in prods}) == 1 and len({x[0] for x in cons}) == 1
                if not exact and not unique:
                    continue
                relation = "socket_event_matches" if exact else "socket_event_candidate"
                signature = (producer["source"], consumer["source"], relation)
                if signature in seen:
                    continue
                seen.add(signature)
                links.append({
                    "source": producer["source"], "target": consumer["source"],
                    "_src": producer["source"], "_tgt": consumer["source"],
                    "relation": relation, "context": "nexi",
                    "confidence": "INFERRED" if exact else "AMBIGUOUS",
                    "source_file": producer.get("source_file") or "",
                    "source_location": producer.get("source_location") or "",
                    "matching_scope": "exact-origin-namespace-event-direction" if exact
                                      else "unique-namespace-event-direction-origin-unknown",
                    "runtime_delivery_proven": False,
                })


def add_declared_infrastructure(nodes, links):
    """Expose source-declared Nginx/systemd topology, never runtime claims.

    This is the maintained canonicalizer's explicit non-code scope. Do not
    traverse .env files, service secrets, deployed runtime paths, or templates
    with unknown expansion. All infrastructure nodes have exact provenance.
    """
    if PROFILE != 'main':
        return
    repo = Path('/home/mellonelay1999/workspaces/Nexi')
    root = Path(os.environ.get('GRAPHIFY_NEXI_INFRA_ROOT', str(repo / 'deploy'))).resolve()
    if not root.is_dir():
        return
    index = {n.get('id') for n in nodes}
    edge_index = {(e.get('source'), e.get('target'), e.get('relation')) for e in links}

    def nid(*parts):
        value = '|'.join(str(v) for v in parts)
        return 'nexi_infra_' + hashlib.sha256(value.encode('utf-8')).hexdigest()[:30]

    def node(id_, label, kind, sf, line, **meta):
        if id_ not in index:
            index.add(id_)
            nodes.append({'id': id_, 'label': label, 'file_type': 'code',
                          'source_file': sf, 'source_location': f'L{line}',
                          'repo': 'infra', '_origin': 'ast',
                          'metadata': {'entity_type': kind, 'nexi_version': 'nexi-framework-v1', **meta}})

    def edge(a, b, relation, sf, line):
        sig = (a, b, relation)
        if sig not in edge_index:
            edge_index.add(sig)
            links.append({'source': a, 'target': b, '_src': a, '_tgt': b,
                          'relation': relation, 'context': 'nexi',
                          'confidence': 'EXTRACTED', 'source_file': sf,
                          'source_location': f'L{line}', '_origin': 'ast'})

    files = sorted(set(root.rglob('*.conf')) | set(root.rglob('*.service')))
    for f in files:
        if any(q in f.parts for q in ('.git','node_modules','dist','build','.next','.output')):
            continue
        if not f.is_file() or f.stat().st_size > 300_000:
            continue
        try:
            sf = f.relative_to(repo).as_posix()
        except ValueError:
            # Explicit caller-selected root may be external; keep source
            # paths distinct and reportable, not falsely repo-relative.
            sf = f.as_posix()
        file_id = nid('file', sf)
        node(file_id, sf, 'infrastructure_file', sf, 1)
        for line_no, raw in enumerate(f.read_text(encoding='utf-8', errors='replace').splitlines(), 1):
            text = raw.strip()
            if not text or text.startswith(('#',';')):
                continue
            kind = value = None
            if f.suffix == '.conf':
                m = re.match(r'^(proxy_pass|server_name|upstream|location|listen)\\s+([^;{]+)', text)
                if m: kind,value = m.group(1),m.group(2).strip()
            else:
                m = re.match(r'^(ExecStart|After|Requires|Wants|WorkingDirectory)=(.+)$', text)
                if m: kind,value = m.group(1),m.group(2).strip()
            if not kind or not value or len(value) > 400:
                continue
            # Never record credentials or unexpanded dynamic configuration.
            if kind == 'ExecStart':
                value = value.split(maxsplit=1)[0]
            elif kind == 'proxy_pass':
                if '$' in value:
                    continue
                from urllib.parse import urlsplit, urlunsplit
                if '://' in value:
                    parsed = urlsplit(value)
                    if parsed.username is not None or parsed.password is not None:
                        hostname = parsed.hostname or ''
                        port = ':' + str(parsed.port) if parsed.port else ''
                        value = urlunsplit((parsed.scheme, hostname + port,
                                            parsed.path, parsed.query, ''))
            operation = nid('occurrence',sf,line_no,kind)
            resource = nid('resource',kind,value)
            node(operation, f'{kind}: {value[:110]}', 'infrastructure_declaration', sf, line_no,
                 directive=kind, declared_value=value)
            node(resource, f'{kind}: {value[:110]}', 'infrastructure_reference', sf, line_no,
                 directive=kind, declared_value=value)
            edge(file_id, operation, 'declares_infrastructure', sf, line_no)
            edge(operation, resource, 'configures_reference', sf, line_no)


def report_graph(data):
    nodes = data.get('nodes', [])
    links = data.get('links', data.get('edges', []))
    node_ids = {n.get('id') for n in nodes}
    ops = {n['id']: n for n in nodes if operation_key(n)}
    unresolved_http_nodes = [
        n for n in nodes
        if (n.get('metadata') or {}).get('entity_type') == 'http_unresolved_call'
    ]
    unresolved_http_edges = [
        e for e in links if e.get('relation') == 'http_call_unresolved'
    ]
    calls = [e for e in links if e.get('relation') == 'http_calls' and e.get('target') in ops]
    handlers = [e for e in links if e.get('relation') == 'http_handled_by' and e.get('source') in ops]
    delegates = [e for e in links if e.get('relation') == 'http_route_delegates_to']
    candidates = [e for e in links if e.get('relation') == 'http_path_pattern_may_match']
    call_ops = {e['target'] for e in calls}
    handler_ops = {e['source'] for e in handlers}
    delegated_ops = {e['source'] for e in delegates}
    call_surfaces, handler_surfaces = defaultdict(set), defaultdict(set)
    for e in calls:
        src = next((n for n in nodes if n.get('id') == e.get('source')), {})
        call_surfaces[e['target']].add(src.get('repo', 'unknown'))
    for e in handlers:
        dst = next((n for n in nodes if n.get('id') == e.get('target')), {})
        handler_surfaces[e['source']].add(dst.get('repo', 'unknown'))
    pairs = Counter()
    for op in call_ops & handler_ops:
        for c in call_surfaces[op]:
            for h in handler_surfaces[op]:
                pairs[f'{c}->{h}'] += 1
    source_files = {surface: set() for surface in SURFACES}
    for n in nodes:
        repo = n.get('repo')
        sf = n.get('source_file')
        if repo in source_files and sf:
            source_files[repo].add(sf)
    http_edges = [e for e in links if e.get('relation') in HTTP_RELATIONS]
    dangling = sum(e.get('source') not in node_ids or e.get('target') not in node_ids for e in links)
    manifest = source_manifest()
    nexi_nodes = [n for n in nodes if (n.get('metadata') or {}).get('nexi_version')]
    nexi_edges = [e for e in links if e.get('context') == 'nexi']
    report = {
        'graphify_version': graphify_version(),
        'generated_at_utc': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        'workflow': 'three independent Graphify CLI extracts followed by Graphify merge-graphs and HTTP operation canonicalization',
        'source_revisions': manifest.get('source_revisions') if manifest else None,
        'source_manifest_status': 'present' if manifest else 'not-provided',
        'source_manifest_path': str(SOURCE_MANIFEST) if manifest else None,
        'admin_runtime_comparison': manifest.get('admin_runtime_comparison') if manifest else None,
        'source_roots': {s: v['root'] for s, v in SURFACES.items()},
        'code_files_detected_and_extracted': manifest.get('source_file_counts') if manifest else None,
        'candidate_source_coverage': manifest.get('source_coverage') if manifest else None,
        'graph_outputs': {s: str(ROOT / 'surfaces' / s / 'graphify-out' / 'graph.json') for s in SURFACES},
        'extractor_sha256': hashlib.sha256(EXTRACTOR.read_bytes()).hexdigest(),
        'nexi_extension_sha256': hashlib.sha256(NEXI_EXTENSION.read_bytes()).hexdigest() if NEXI_EXTENSION.exists() else None,
        'nexi_scanner_sha256': hashlib.sha256(NEXI_SCANNER.read_bytes()).hexdigest() if NEXI_SCANNER.exists() else None,
        'nexi_node_count': len(nexi_nodes),
        'nexi_relation_counts': dict(sorted(Counter(e.get('relation', '') for e in nexi_edges).items())),
        'nexi_unresolved_operations': sum(bool((n.get('metadata') or {}).get('unresolved_reason') or (n.get('metadata') or {}).get('unresolved_target')) for n in nexi_nodes),
        'merged_graph_sha256': hashlib.sha256(GRAPH.read_bytes()).hexdigest(),
        'nodes': len(nodes), 'edges': len(links),
        'source_files_with_graph_nodes': {s: len(v) for s, v in source_files.items()},
        'community_count': len({n.get('community') for n in nodes if isinstance(n.get('community'), int)}),
        'community_count_note': 'Count of integer community ids serialized on graph nodes by Graphify cluster-only.',
        'http_operation_nodes': len(ops),
        'http_calls_edges': len(calls), 'http_handled_by_edges': len(handlers),
        'http_unresolved_call_nodes': len(unresolved_http_nodes),
        'http_unresolved_call_edges': len(unresolved_http_edges),
        'http_unresolved_source_files': len({
            (n.get('repo'), n.get('source_file')) for n in unresolved_http_nodes
            if n.get('source_file')
        }),
        'http_route_delegation_edges': len(delegates),
        'inferred_path_pattern_candidate_edges': len(candidates),
        'exact_method_path_client_handler_joins': len(call_ops & handler_ops),
        'exact_joined_surface_pairs': dict(sorted(pairs.items())),
        'client_only_operation_ids': len(call_ops - (handler_ops | delegated_ops)),
        'handler_only_operation_ids': len(handler_ops - call_ops),
        'dangling_edges': dangling,
        'http_edge_provenance_missing': sum(not e.get('source_file') or not e.get('source_location') for e in http_edges),
        'output': str(GRAPH),
    }
    return report

def main():
    requested_root = os.environ.get("GRAPHIFY_NEXI_GRAPH_ROOT")
    if not requested_root:
        raise SystemExit("Refusing implicit graph destination: set GRAPHIFY_NEXI_GRAPH_ROOT explicitly")
    if ROOT.resolve() == Path("/srv/nexi/graphify-live/20261107").resolve():
        raise SystemExit("Refusing writes to the preserved historical 20261107 graph")
    mode = sys.argv[1] if len(sys.argv) > 1 else "normalize"
    if mode == 'manifest':
        written = write_source_manifest()
        print(json.dumps({'manifest': str(SOURCE_MANIFEST),
                          'source_file_counts': written['source_file_counts'],
                          'source_revisions': written['source_revisions']}, indent=2))
        raise SystemExit(0)
    data = json.loads(GRAPH.read_text())
    if mode == 'normalize':
        data = normalize_graph(data)
        temp = GRAPH.with_suffix('.json.next')
        temp.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
        os.replace(temp, GRAPH)
    report = report_graph(data)
    if mode == 'normalize':
        print(json.dumps(report, indent=2))
    elif mode == 'report':
        REPORT.write_text(json.dumps(report, indent=2))
        print(json.dumps(report, indent=2))
    else:
        raise SystemExit('usage: merge_surface_graphs.py [normalize|report]')
    if report['dangling_edges'] or report['http_edge_provenance_missing']:
        raise SystemExit('integrity validation failed: dangling edges or missing HTTP provenance')


if __name__ == "__main__":
    main()
