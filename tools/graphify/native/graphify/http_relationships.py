"""Tree-sitter HTTP request/route relationships for Graphify's structural pass.

Canonical operation nodes join client requests and server handlers extracted
in one unified source-root pass. Exact routes are extracted; narrowly compatible
dynamic route templates are emitted separately as inferred candidates.
"""
from __future__ import annotations
import ast
import re
from pathlib import Path
from urllib.parse import urlsplit

_HTTP_VERBS = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
_TS_SUFFIXES = {".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"}
_ROUTE_DECORATORS = {"get": "GET", "post": "POST", "put": "PUT", "patch": "PATCH",
                     "delete": "DELETE", "head": "HEAD", "options": "OPTIONS"}

def _parse(path: Path, data: bytes):
    from tree_sitter import Language, Parser
    import tree_sitter_typescript as tst
    factory = tst.language_tsx if path.suffix.lower() in {".tsx", ".jsx"} else tst.language_typescript
    return Parser(Language(factory())).parse(data)

def _walk(node):
    stack = [node]
    while stack:
        cur = stack.pop()
        yield cur
        stack.extend(reversed(cur.children))

def _text(node, data):
    return data[node.start_byte:node.end_byte].decode("utf-8", errors="replace")

def _line(node):
    return node.start_point.row + 1

def _field(node, name):
    try:
        return node.child_by_field_name(name)
    except Exception:
        return None

def _decorators_before(node):
    parent, current = node.parent, node
    while parent is not None:
        siblings = parent.children
        try:
            i = next(i for i, sib in enumerate(siblings) if sib.id == current.id)
        except StopIteration:
            i = -1
        found, j = [], i - 1
        while j >= 0 and siblings[j].type in {"decorator", "comment", "export", "default"}:
            if siblings[j].type == "decorator":
                found.append(siblings[j])
            j -= 1
        if found:
            return list(reversed(found))
        if parent.type not in {"export_statement", "ambient_declaration"}:
            break
        current, parent = parent, parent.parent
    return []

def _decorator_parts(node, data):
    raw = _text(node, data).strip()
    m = re.match(r"@\s*([A-Za-z_$][\w$]*)(?:\s*\((.*)\))?\s*$", raw, re.S)
    if not m:
        return "", None
    name, args = m.group(1), m.group(2)
    if args is None:
        return name, None
    first = re.match(r"""^\s*(['"])(.*?)\1""", args, re.S)
    return name, first.group(2) if first else None

def _normalize_path(value):
    value = value.strip()
    if not value:
        return None
    if value.startswith(("http://", "https://")):
        value = urlsplit(value).path or "/"
    value = re.sub(r"\$\{[^}]*\}", ":param", value)
    value = re.sub(r"\{[^{}]+\}", ":param", value)
    value = value.split("?", 1)[0].split("#", 1)[0]
    if re.fullmatch(r"(?::param)+", value):
        return None
    value = re.sub(r"^(?::param)+(?=/)", "", value)
    if not value.startswith("/"):
        value = "/" + value
    value = re.sub(r"/+", "/", value)
    value = re.sub(r":([A-Za-z_$][\w$-]*)", ":param", value)
    if not re.search(r"[A-Za-z]", value) and value != "/":
        return None
    return value.rstrip("/") or "/"

def _literal(node, data):
    if node is None:
        return None
    raw = _text(node, data).strip()
    if node.type == "string":
        try:
            return ast.literal_eval(raw)
        except Exception:
            return raw[1:-1] if len(raw) >= 2 else None
    if node.type == "template_string":
        return raw[1:-1] if len(raw) >= 2 else None
    return None

def _decl_name(node, data):
    name = _field(node, "name")
    return _text(name, data) if name is not None else ""

def _call_name(node, data):
    fn = _field(node, "function")
    raw = _text(fn, data) if fn is not None else _text(node, data).split("(", 1)[0]
    raw = re.sub(r"<[^<>]*>", "", raw).strip()
    # Tree-sitter may include the enclosing await/void expression in the function field.
    return re.sub(r"^(?:(?:await|void)\s+)+", "", raw)

def _args(node):
    args = _field(node, "arguments")
    return list(args.named_children) if args is not None else []

def _object_property(node, key, data):
    if node is None:
        return None
    for child in _walk(node):
        if child.type not in {"pair", "property_assignment"}:
            continue
        k = _field(child, "key") or (child.named_children[0] if child.named_children else None)
        if k is not None and _text(k, data).strip("'\"") == key:
            return _field(child, "value") or (child.named_children[-1] if child.named_children else None)
    return None

def _nearest_graph_symbol(node, by_line):
    cur = node
    while cur is not None:
        if cur.type in {"method_definition", "function_declaration", "function_expression", "arrow_function"}:
            for candidate in by_line.get(_line(cur), []):
                if candidate.get("_callable"):
                    return candidate.get("id")
        cur = cur.parent
    return None

def _source_key(path, root):
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except Exception:
        return path.as_posix()

def _operation_id(verb, route, origin=None):
    suffix = f"@{origin}" if origin else ""
    return f"http_operation:{verb}:{route}{suffix}"

def _external_origin(value):
    if not isinstance(value, str) or not value.startswith(("http://", "https://")):
        return None
    parsed = urlsplit(value)
    host = (parsed.hostname or "").lower()
    if not host:
        return None
    port = parsed.port
    if port and not ((parsed.scheme == "https" and port == 443) or (parsed.scheme == "http" and port == 80)):
        host = f"{host}:{port}"
    # NEXI first-party API origins still join local handlers.
    if host in {"api.nexitrading.app", "127.0.0.1:3200"}:
        return None
    return f"{parsed.scheme.lower()}://{host}"

def _is_test_file(path):
    parts = {part.lower() for part in Path(path).parts}
    name = Path(path).name.lower()
    return bool(parts & {"test", "tests", "__tests__", "__mocks__"}) or bool(
        re.search(r"(?:\.test|\.spec)\.[^.]+$", name)
    )

def _next_route(path, root):
    try:
        rel = Path(path).resolve().relative_to(root.resolve())
    except Exception:
        return None
    parts = list(rel.parts)
    try:
        api_index = parts.index("api")
    except ValueError:
        return None
    if "app" not in parts[:api_index] or parts[-1].split(".", 1)[0] != "route":
        return None
    route_parts = []
    for segment in parts[api_index: -1]:
        if segment.startswith("@") or (segment.startswith("(") and segment.endswith(")")):
            continue
        if segment.startswith("[[...") or segment.startswith("[..."):
            route_parts.append(":param")
        elif segment.startswith("[") and segment.endswith("]"):
            route_parts.append(":param")
        else:
            route_parts.append(segment)
    return _normalize_path("/" + "/".join(route_parts))

def extract_http_relationships(paths, root, all_nodes, all_edges):
    """Append canonical HTTP operation nodes and source-provenance edges."""
    root = Path(root).resolve() if root else Path.cwd().resolve()
    paths = list(paths)
    file_nodes, symbols_by_file_line = {}, {}
    for n in all_nodes:
        sf = n.get("source_file")
        if not sf:
            continue
        sf = Path(sf).as_posix()
        if n.get("source_location") == "L1" and n.get("id"):
            file_nodes.setdefault(sf, n)
        m = re.match(r"L(\d+)", str(n.get("source_location", "")))
        if m:
            symbols_by_file_line.setdefault(sf, {}).setdefault(int(m.group(1)), []).append(n)

    endpoints, new_edges, seen_edges = {}, [], set()
    def endpoint(verb, route, origin=None):
        eid = _operation_id(verb, route, origin)
        if eid not in endpoints:
            endpoints[eid] = {
                "id": eid, "label": f"{verb} {route}", "file_type": "concept",
                "source_file": "", "source_location": "",
                "metadata": {"entity_type": "http_operation", "http_method": verb, "http_path": route,
                             **({"http_origin": origin, "http_scope": "external"} if origin else {"http_scope": "first_party"})},
                "_origin": "ast",
            }
        return eid

    def add_edge(src, dst, relation, sf, line, confidence="EXTRACTED", score=None):
        key = (src, dst, relation, sf, line)
        if key in seen_edges:
            return
        seen_edges.add(key)
        edge = {"source": src, "target": dst, "relation": relation, "context": "http",
                "confidence": confidence, "source_file": sf,
                "source_location": f"L{line}" if line else ""}
        if score is not None:
            edge["confidence_score"] = score
        new_edges.append(edge)

    for raw_path in paths:
        path = Path(raw_path)
        if path.suffix.lower() not in _TS_SUFFIXES or _is_test_file(path):
            continue
        try:
            data = path.read_bytes()
        except OSError:
            continue
        low = data.lower()
        next_route_hint = _next_route(path, root)
        if next_route_hint is None and not any(marker in low for marker in (
            b"@controller", b"@get(", b"@post(", b"@put(", b"@patch(", b"@delete(",
            b"fetch(", b".request(", b".get(", b".post(", b".put(", b".patch(", b".delete(",
        )):
            continue
        try:
            tree = _parse(path, data)
        except Exception:
            continue
        sf = _source_key(path, root)
        by_line = symbols_by_file_line.get(sf, {})
        file_node = file_nodes.get(sf)
        file_id = file_node.get("id") if file_node else None
        declarations = list(_walk(tree.root_node))

        # Next.js App Router routes: map exported HTTP methods to their
        # callable implementation, or to the route module for re-export files.
        next_route = next_route_hint
        if next_route:
            for statement in (n for n in declarations if n.type == "export_statement"):
                declaration = next((c for c in statement.named_children if c.type in {
                    "function_declaration", "lexical_declaration", "variable_declaration"
                }), None)
                if declaration is None:
                    raw_export = _text(statement, data)
                    match = re.match(r"""export\s*\{\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\}(?:\s+from\s*(['"])(.*?)\2)?""", raw_export)
                    if match:
                        verb = match.group(1)
                        delegated = match.group(3)
                        if delegated:
                            target = path.parent / delegated
                            if target.is_dir():
                                target = target / "route.ts"
                            elif not target.suffix:
                                target = target.with_suffix(".ts")
                            target_route = _next_route(target, root)
                            if target_route:
                                add_edge(endpoint(verb, next_route), endpoint(verb, target_route),
                                         "http_route_delegates_to", sf, _line(statement))
                        elif file_id:
                            add_edge(endpoint(verb, next_route), file_id, "http_handled_by", sf, _line(statement))
                    continue
                if declaration.type == "function_declaration":
                    name = _decl_name(declaration, data).strip()
                    if name.upper() not in _HTTP_VERBS:
                        continue
                    handler = _nearest_graph_symbol(declaration, by_line)
                    if handler:
                        add_edge(endpoint(name.upper(), next_route), handler, "http_handled_by", sf, _line(declaration))
                    continue
                for declarator in (n for n in _walk(declaration) if n.type == "variable_declarator"):
                    name_node = _field(declarator, "name")
                    value_node = _field(declarator, "value")
                    name = _text(name_node, data).strip() if name_node else ""
                    if name.upper() not in _HTTP_VERBS or value_node is None:
                        continue
                    handler = _nearest_graph_symbol(value_node, by_line)
                    if handler:
                        add_edge(endpoint(name.upper(), next_route), handler, "http_handled_by", sf, _line(declarator))

        # NestJS-style route decorators.
        for cls in (n for n in declarations if n.type == "class_declaration"):
            prefix = ""
            for dec in _decorators_before(cls):
                name, val = _decorator_parts(dec, data)
                if name.lower() == "controller":
                    prefix = val or ""
                    break
            body = next((c for c in cls.named_children if c.type == "class_body"), None)
            if body is None:
                continue
            for member in body.named_children:
                if member.type not in {"method_definition", "abstract_method_signature"}:
                    continue
                handler = _nearest_graph_symbol(member, by_line)
                if not handler:
                    continue
                for dec in _decorators_before(member):
                    name, tail = _decorator_parts(dec, data)
                    verb = _ROUTE_DECORATORS.get(name.lower())
                    if not verb:
                        continue
                    route_tail = _normalize_path(tail or "/")
                    if route_tail is None:
                        continue
                    route = _normalize_path(prefix.rstrip("/") + "/" + route_tail.lstrip("/"))
                    if route:
                        add_edge(endpoint(verb, route), handler, "http_handled_by", sf, _line(dec))

        # Resolve request helpers within their lexical class or declared receiver type.
        # Same-named methods in unrelated or unresolved classes are not interchangeable.
        def enclosing_class_id(node):
            current = node.parent
            while current is not None:
                if current.type == "class_declaration":
                    return current.id
                current = current.parent
            return None

        class_nodes_by_name, local_callables, receiver_types = {}, {}, {}
        for declaration in declarations:
            if declaration.type == "class_declaration":
                class_name = _decl_name(declaration, data).strip()
                if class_name:
                    class_nodes_by_name.setdefault(class_name, []).append(declaration)
            if declaration.type in {"method_definition", "function_declaration"}:
                name = _decl_name(declaration, data).strip()
                body = declaration
            elif declaration.type == "variable_declarator":
                name_node, value_node = _field(declaration, "name"), _field(declaration, "value")
                if name_node is None:
                    continue
                if value_node is not None and value_node.type in {"arrow_function", "function_expression"}:
                    name, body = _text(name_node, data).strip(), value_node
                else:
                    name, body = "", None
            else:
                name, body = "", None
            if name and body is not None:
                key = (enclosing_class_id(declaration), name.split(".")[-1])
                local_callables.setdefault(key, []).append(body)

        def add_receiver_type(name_node, type_node, owner):
            if name_node is None or type_node is None:
                return
            name = _text(name_node, data).strip()
            raw_type = _text(type_node, data).strip()
            match = re.match(r":?\s*([A-Za-z_$][\w$]*)\b", raw_type)
            if name and match:
                receiver_types.setdefault((owner, name), set()).add(match.group(1))

        for declaration in declarations:
            if declaration.type == "variable_declarator":
                add_receiver_type(_field(declaration, "name"), _field(declaration, "type"),
                                  enclosing_class_id(declaration))
            elif declaration.type in {"required_parameter", "optional_parameter",
                                      "public_field_definition", "property_signature"}:
                add_receiver_type(_field(declaration, "pattern") or _field(declaration, "name"),
                                  _field(declaration, "type"), enclosing_class_id(declaration))

        def local_callable_key(call):
            function = _field(call, "function")
            if function is None:
                return None
            while function.type in {"await_expression", "parenthesized_expression",
                                    "non_null_expression", "as_expression"}:
                children = function.named_children
                if not children:
                    return None
                function = children[-1]
            if function.type == "identifier":
                return (None, _text(function, data).strip())
            if function.type != "member_expression":
                return None
            receiver, member = _field(function, "object"), _field(function, "property")
            if receiver is None or member is None:
                return None
            receiver_name = _text(receiver, data).strip()
            owner = enclosing_class_id(call)
            if receiver_name == "this":
                return (owner, _text(member, data).strip()) if owner is not None else None
            if receiver.type != "identifier":
                return None
            receiver_name_type = receiver_types.get((owner, receiver_name))
            if receiver_name_type is None:
                receiver_name_type = receiver_types.get((None, receiver_name))
            if not receiver_name_type or len(receiver_name_type) != 1:
                return None
            declarations_for_type = class_nodes_by_name.get(next(iter(receiver_name_type)), [])
            if len(declarations_for_type) != 1:
                return None
            return (declarations_for_type[0].id, _text(member, data).strip())

        def reaches_fetch(body, visited=None):
            visited = set() if visited is None else visited
            if body.id in visited:
                return False
            visited.add(body.id)
            for call in (n for n in _walk(body) if n.type == "call_expression"):
                callee = _call_name(call, data).strip()
                if callee in {"fetch", "globalThis.fetch", "window.fetch"}:
                    return True
                key = local_callable_key(call)
                targets = local_callables.get(key, []) if key else []
                if len(targets) == 1 and reaches_fetch(targets[0], visited):
                    return True
            return False

        request_wrapper_keys = {
            key for key, bodies in local_callables.items()
            if key[1] == "request" and len(bodies) == 1 and reaches_fetch(bodies[0])
        }
        request_mutation_defaults = {}
        for key, bodies in local_callables.items():
            if key[1] != "requestMutation" or len(bodies) != 1:
                continue
            body = bodies[0]
            delegates_to_request = any(
                local_callable_key(call) in request_wrapper_keys
                for call in _walk(body) if call.type == "call_expression"
            )
            if delegates_to_request:
                request_mutation_defaults[key] = bool(
                    re.search(r"""\bmethod\b[^,)]*=\s*['"]POST['"]""",
                              _text(body, data), re.S)
                )

        route_hints = {}
        for declarator in (n for n in declarations if n.type == "variable_declarator"):
            name_node, value_node = _field(declarator, "name"), _field(declarator, "value")
            if name_node is None or value_node is None:
                continue
            candidates = set()
            for leaf_node in _walk(value_node):
                if leaf_node.type not in {"template_string", "string"}:
                    continue
                literal = _literal(leaf_node, data)
                if literal is None:
                    continue
                normalized = _normalize_path(literal)
                if normalized and "/" in normalized.strip("/"):
                    candidates.add(normalized)
            if len(candidates) == 1:
                route_hints[_text(name_node, data).strip()] = next(iter(candidates))
        for call in (n for n in declarations if n.type == "call_expression"):
            callee = _call_name(call, data)
            leaf = callee.split(".")[-1].lower()
            args = _args(call)
            if not args:
                continue
            is_fetch = leaf == "fetch" and callee in {"fetch", "globalThis.fetch", "window.fetch"}
            is_axios_verb = leaf.upper() in _HTTP_VERBS and callee.split(".")[0] in {"axios", "http", "api", "client"}
            callable_key = local_callable_key(call)
            is_wrapper = leaf == "request" and callable_key in request_wrapper_keys
            is_request_mutation = leaf == "requestmutation" and callable_key in request_mutation_defaults
            if not (is_fetch or is_axios_verb or is_wrapper or is_request_mutation):
                continue
            raw_path = _literal(args[0], data)
            route = _normalize_path(raw_path) if raw_path is not None else None
            path_inferred = False
            if route is None and args[0].type in {"identifier", "member_expression"}:
                route = route_hints.get(_text(args[0], data).strip())
                path_inferred = route is not None
            if not route:
                continue

            confidence = "INFERRED" if path_inferred else "EXTRACTED"
            if is_axios_verb:
                verb = leaf.upper()
            elif is_fetch:
                verb = "GET"
                if len(args) > 1:
                    method_node = _object_property(args[1], "method", data)
                    method_val = _literal(method_node, data)
                    if method_val and method_val.upper() in _HTTP_VERBS:
                        verb = method_val.upper()
                    elif method_node is not None:
                        verb, confidence = "ANY", "AMBIGUOUS"
            elif is_request_mutation:
                method_val = _literal(args[4], data) if len(args) > 4 else None
                if method_val and method_val.upper() in {"POST", "PATCH"}:
                    verb = method_val.upper()
                elif request_mutation_defaults.get(callable_key, False):
                    verb, confidence = "POST", "EXTRACTED"
                else:
                    verb, confidence = "ANY", "AMBIGUOUS"
            else:
                method_node = _object_property(args[1], "method", data) if len(args) > 1 else None
                method_val = _literal(method_node, data)
                if method_val and method_val.upper() in _HTTP_VERBS:
                    verb = method_val.upper()
                elif method_node is not None:
                    verb, confidence = "ANY", "AMBIGUOUS"
                else:
                    # Confirm the wrapper itself declares the default before using it.
                    verb = "GET" if b"??" in data and b'"GET"' in data and b"method" in data else "ANY"
                    confidence = "INFERRED" if verb == "GET" else "AMBIGUOUS"
            caller = _nearest_graph_symbol(call, by_line) or file_id
            if caller:
                origin = _external_origin(raw_path)
                eid = endpoint(verb, route, origin)
                add_edge(caller, eid, "http_calls", sf, _line(call), confidence,
                         0.2 if confidence == "AMBIGUOUS" else (0.95 if confidence == "INFERRED" else None))

        # Carry a route suffix from a Next handler into a local helper that
        # performs fetch(). This captures BFFs that pass a computed URL through a
        # helper such as readConfiguredEndpoint(url) before the actual fetch.
        if next_route:
            fetch_helpers = {
                _decl_name(n, data).strip()
                for n in declarations
                if n.type in {"function_declaration", "method_definition"}
                and b"fetch(" in data[n.start_byte:n.end_byte]
            }
            for statement in (n for n in declarations if n.type == "export_statement"):
                fn = next((c for c in statement.named_children if c.type == "function_declaration"), None)
                if fn is None:
                    continue
                verb = _decl_name(fn, data).strip().upper()
                handler = _nearest_graph_symbol(fn, by_line)
                if verb not in _HTTP_VERBS or not handler:
                    continue
                callees = {_call_name(c, data).split(".")[-1] for c in _walk(fn) if c.type == "call_expression"}
                if not (callees & fetch_helpers):
                    continue
                route_candidates = set()
                route_lines = {}
                for leaf_node in _walk(fn):
                    if leaf_node.type != "template_string":
                        continue
                    literal = _literal(leaf_node, data)
                    route = _normalize_path(literal) if literal else None
                    if route and route != next_route and "/" in route.strip("/"):
                        route_candidates.add(route)
                        route_lines[route] = _line(leaf_node)
                if len(route_candidates) == 1:
                    route = next(iter(route_candidates))
                    add_edge(handler, endpoint(verb, route), "http_calls", sf, route_lines[route],
                             "INFERRED", 0.75)


    # variable segment may match a literal segment; fixed segments must agree.
    call_ops = {}
    handled_ops = {}
    for edge in new_edges:
        if edge["relation"] == "http_calls" and edge["target"].startswith("http_operation:"):
            call_ops.setdefault(edge["target"], edge)
        elif edge["relation"] == "http_handled_by" and edge["source"].startswith("http_operation:"):
            handled_ops.setdefault(edge["source"], edge)
    def split_operation(eid):
        _, verb, route = eid.split(":", 2)
        route = route.split("@", 1)[0]
        return verb, route.strip("/").split("/") if route != "/" else []
    candidate_count = 0
    for caller_op, call_edge in call_ops.items():
        cverb, cparts = split_operation(caller_op)
        if cverb == "ANY" or ":param" not in cparts:
            continue
        for server_op in handled_ops:
            sverb, sparts = split_operation(server_op)
            if sverb != cverb or len(cparts) != len(sparts) or caller_op == server_op or ":param" not in sparts:
                continue
            if all(a == b or a == ":param" or b == ":param" for a, b in zip(cparts, sparts)):
                before = len(new_edges)
                line = int(call_edge["source_location"][1:]) if call_edge["source_location"].startswith("L") else 0
                add_edge(caller_op, server_op, "http_path_pattern_may_match",
                         call_edge["source_file"], line, "INFERRED", 0.7)
                candidate_count += len(new_edges) - before

    # React Context is a value-flow contract, not an ordinary call edge.
    # Add explicit provider, consumer-hook and root-wrapper relationships.
    context_nodes, context_edges, context_edge_keys = {}, [], set()
    provider_contexts = {}
    def context_edge(src, dst, relation, sf, line):
        key = (src, dst, relation, sf, line)
        if key in context_edge_keys:
            return
        context_edge_keys.add(key)
        context_edges.append({
            "source": src, "target": dst, "relation": relation,
            "context": "react_context", "confidence": "EXTRACTED",
            "source_file": sf, "source_location": f"L{line}" if line else "",
        })

    parsed_context_files = []
    for raw_path in paths:
        path = Path(raw_path)
        if path.suffix.lower() not in _TS_SUFFIXES or _is_test_file(path):
            continue
        try:
            data = path.read_bytes()
            tree = _parse(path, data)
        except Exception:
            continue
        sf = _source_key(path, root)
        by_line = symbols_by_file_line.get(sf, {})
        declarations = list(_walk(tree.root_node))
        parsed_context_files.append((path, data, sf, by_line, declarations))

        contexts_in_file = {}
        for declaration in (n for n in declarations if n.type == "variable_declarator"):
            name_node, value_node = _field(declaration, "name"), _field(declaration, "value")
            if name_node is None or value_node is None:
                continue
            calls_create_context = any(
                n.type == "call_expression"
                and _call_name(n, data).split(".")[-1].lower() == "createcontext"
                for n in _walk(value_node)
            )
            if not calls_create_context:
                continue
            name = _text(name_node, data).strip()
            context_id = f"react_context:{sf}:{name}"
            contexts_in_file[name] = context_id
            context_nodes[context_id] = {
                "id": context_id, "label": name, "file_type": "concept",
                "source_file": sf, "source_location": f"L{_line(declaration)}",
                "metadata": {"entity_type": "react_context"},
                "_origin": "ast",
            }
            create_call = next(
                (n for n in _walk(value_node) if n.type == "call_expression"
                 and _call_name(n, data).split(".")[-1].lower() == "createcontext"),
                None,
            )
            create_args = _args(create_call) if create_call else []
            default_node = create_args[0] if create_args else None
            default_name = _text(default_node, data).strip() if default_node else ""
            if default_name and re.fullmatch(r"[A-Za-z_$][\w$]*", default_name):
                match = next(
                    (n for line_nodes in by_line.values() for n in line_nodes
                     if n.get("label") == default_name),
                    None,
                )
                if match:
                    context_edge(context_id, match["id"], "context_default_value",
                                 sf, _line(create_call or declaration))

        for declaration in declarations:
            if declaration.type not in {"function_declaration", "method_definition"}:
                continue
            component_name = _decl_name(declaration, data).strip()
            for jsx in (n for n in _walk(declaration)
                        if n.type in {"jsx_opening_element", "jsx_self_closing_element"}):
                name_node = _field(jsx, "name")
                tag = _text(name_node, data).strip() if name_node else ""
                for context_name, context_id in contexts_in_file.items():
                    if tag == f"{context_name}.Provider" and "value" in _text(jsx, data):
                        provider = _nearest_graph_symbol(jsx, by_line) or _nearest_graph_symbol(declaration, by_line)
                        if provider:
                            context_edge(provider, context_id, "provides_context", sf, _line(jsx))
                            provider_contexts[component_name] = context_id
            for call in (n for n in _walk(declaration) if n.type == "call_expression"):
                if _call_name(call, data).split(".")[-1].lower() != "usecontext":
                    continue
                args = _args(call)
                if not args:
                    continue
                context_name = _text(args[0], data).strip()
                context_id = contexts_in_file.get(context_name)
                consumer = _nearest_graph_symbol(call, by_line)
                if context_id and consumer:
                    context_edge(consumer, context_id, "consumes_context", sf, _line(call))

    for path, data, sf, by_line, declarations in parsed_context_files:
        for declaration in declarations:
            if declaration.type not in {"function_declaration", "method_definition"}:
                continue
            wrapper = _decl_name(declaration, data).strip()
            for jsx in (n for n in _walk(declaration)
                        if n.type in {"jsx_opening_element", "jsx_self_closing_element"}):
                name_node = _field(jsx, "name")
                tag = _text(name_node, data).strip() if name_node else ""
                context_id = provider_contexts.get(tag)
                if not context_id:
                    continue
                owner = _nearest_graph_symbol(jsx, by_line) or _nearest_graph_symbol(declaration, by_line)
                if owner:
                    context_edge(owner, context_id, "wraps_context", sf, _line(jsx))

    all_nodes.extend(endpoints.values())
    all_nodes.extend(context_nodes.values())
    all_edges.extend(new_edges)
    all_edges.extend(context_edges)
    return {"http_operation_nodes": len(endpoints), "http_relationship_edges": len(new_edges),
            "http_path_pattern_candidate_edges": candidate_count,
            "react_context_nodes": len(context_nodes), "react_context_edges": len(context_edges)}
