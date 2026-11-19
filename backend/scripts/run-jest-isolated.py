#!/usr/bin/env python3
"""Run NEXI Jest suites in bounded native-safe processes, without installing packages.

Use a Node release with the native cleanup-hook fix (24.22.0 or later on
Node 24). Set NEXI_NODE_BIN for a test-only runtime on older deployments.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
JEST = ROOT / "node_modules/jest/bin/jest.js"
NATIVE_IMPORT = re.compile(r"""(?:from\s+|require\s*\()['"]better-sqlite3['"]""")
LOG_ROOT = Path(os.environ.get("NEXI_TEST_EVIDENCE_DIR", str(Path.home() / ".cache/nexi-backend-verify")))


def pick_node() -> str:
    override = os.environ.get("NEXI_NODE_BIN")
    if override:
        if not Path(override).is_file():
            raise RuntimeError("NEXI_NODE_BIN must point to an existing Node executable")
        return override
    pinned = Path("/opt/nexi/runtime/node-v24.21.0/bin/node")
    return str(pinned) if pinned.is_file() else (shutil.which("node") or "")


def build_jobs(node: str, lane: str) -> tuple[list[tuple[str, list[str], int]], int, int]:
    package = json.loads((ROOT / "package.json").read_text())
    ignored = package["jest"]["testPathIgnorePatterns"]
    local = sorted(x.removeprefix("<rootDir>/") for x in ignored if x.endswith(".spec.ts"))
    if not local or any(not (ROOT / path).is_file() for path in local):
        raise RuntimeError("Local SQLite test configuration is missing files")
    base = [node, str(JEST), "--runInBand", "--no-coverage"]
    jobs: list[tuple[str, list[str], int]] = []
    standard_total = 0
    if lane in ("standard", "all"):
        discovery = subprocess.run([node, str(JEST), "--listTests", "--runInBand"],
                                   cwd=ROOT, capture_output=True, text=True, timeout=35, check=True)
        standard = sorted({str(Path(row.strip()).relative_to(ROOT))
                          for row in discovery.stdout.splitlines()
                          if row.strip().endswith((".spec.ts", ".test.ts"))})
        if not standard or set(standard) & set(local):
            raise RuntimeError("Standard Jest discovery is empty or overlaps real SQLite lane")
        standard_total = len(standard)
        native = [name for name in standard if NATIVE_IMPORT.search((ROOT / name).read_text())]
        ordinary = [name for name in standard if name not in native]
        # Cap the number of suites per job to bound memory and retain useful logs.
        for i in range(0, len(ordinary), 18):
            subset = ordinary[i:i + 18]
            jobs.append((f"standard-group-{1 + i // 18}", base + ["--runTestsByPath", *subset], len(subset)))
        for name in native:
            jobs.append(("native-" + name.replace("/", "-"), base + ["--runTestsByPath", name], 1))
    if lane in ("local", "all"):
        local_base = base + ["--config", "test/jest-local-sqlite.config.cjs"]
        for name in local:
            jobs.append(("local-" + name.replace("/", "-"), local_base + ["--runTestsByPath", name], 1))
    return jobs, standard_total, len(local) if lane != "standard" else 0


def run_job(job: tuple[str, list[str], int], node_env: dict[str, str], outdir: Path) -> dict:
    label, cmd, expected_suites = job
    start = time.monotonic()
    try:
        completed = subprocess.run(cmd, cwd=ROOT, env=node_env,
                                   capture_output=True, text=True, timeout=160)
        output = completed.stderr + "\n" + completed.stdout
        code = completed.returncode
    except subprocess.TimeoutExpired as exc:
        output = str(exc)
        code = -1
    (outdir / (label + ".log")).write_text(output)
    suites = re.search(r"Test Suites:\s+(\d+) passed,\s+(\d+) total", output)
    tests = re.search(r"^Tests:\s+(.+)$", output, flags=re.MULTILINE)
    passed = re.search(r"(\d+) passed", tests.group(1)) if tests else None
    skipped = re.search(r"(\d+) skipped", tests.group(1)) if tests else None
    ok = code == 0 and suites is not None and int(suites.group(1)) == expected_suites and (
        int(suites.group(2)) == expected_suites
    ) and passed is not None
    return {
        "name": label, "ok": bool(ok), "code": code, "seconds": round(time.monotonic() - start, 2),
        "suites": expected_suites if ok else 0,
        "tests": int(passed.group(1)) if passed else 0,
        "skipped": int(skipped.group(1)) if skipped else 0,
        "native_abort": "RemoveEnvironmentCleanupHook" in output,
        "log": label + ".log",
        "last_error": output[-1500:] if not ok else "",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", choices=["standard", "local", "all"], default="all")
    parser.add_argument("--jobs", type=int, choices=(1, 2), default=2)
    args = parser.parse_args()
    node = pick_node()
    if not node or not JEST.is_file():
        raise RuntimeError("Pinned Node or Jest is unavailable; do not install into shared dependencies")
    version = subprocess.check_output([node, "--version"], text=True, timeout=10).strip()
    if re.fullmatch(r"v24\.(19|20|21)\.\d+", version):
        print(
            f"Node {version} has a native addon cleanup-hook regression. "
            "Set NEXI_NODE_BIN to Node 24.22.0 or a later fixed Node 24 release.",
            file=sys.stderr,
        )
        return 1
    env = os.environ.copy()
    if "--experimental-vm-modules" not in env.get("NODE_OPTIONS", ""):
        env["NODE_OPTIONS"] = (env.get("NODE_OPTIONS", "") + " --experimental-vm-modules").strip()
    queue, standard_count, local_count = build_jobs(node, args.lane)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output_dir = LOG_ROOT / (stamp + "-" + args.lane)
    output_dir.mkdir(parents=True, exist_ok=False)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        results = list(pool.map(lambda item: run_job(item, env, output_dir), queue))
    for item in results:
        print(f"{'PASS' if item['ok'] else 'FAIL'} {item['name']}: "
              f"{item['suites']} suites, {item['tests']} tests, {item['seconds']}s", flush=True)
    covered_standard = sum(x["suites"] for x in results if x["name"].startswith(("standard-", "native-")))
    passed = all(item["ok"] for item in results) and covered_standard == standard_count
    if args.lane in ("local", "all"):
        covered_local = sum(x["suites"] for x in results if x["name"].startswith("local-"))
        passed = passed and covered_local == local_count
    summary = {"ok": passed, "lane": args.lane, "node": node, "node_version": version, "standard_suites": standard_count,
               "local_source_suites": local_count, "suite_executions": sum(item["suites"] for item in results),
               "passed_tests": sum(item["tests"] for item in results),
               "skipped_tests": sum(item["skipped"] for item in results),
               "results": results}
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2))
    print(f"VERDICT={'PASS' if passed else 'FAIL'} tests={summary['passed_tests']} evidence={output_dir}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
