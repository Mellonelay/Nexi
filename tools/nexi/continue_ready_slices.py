#!/usr/bin/env python3
"""Minimal continuation controller: run ready slices, persist, and advance."""
import argparse, json, subprocess, sys
from pathlib import Path

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--plan', required=True)
    p.add_argument('--state', required=True)
    p.add_argument('--start', type=int, default=None)
    a=p.parse_args()
    plan=json.loads(Path(a.plan).read_text())
    state_path=Path(a.state)
    state=json.loads(state_path.read_text()) if state_path.exists() else {'completed': [], 'next_index': 0}
    i=state.get('next_index', 0) if a.start is None else a.start
    while i < len(plan['slices']):
        sl=plan['slices'][i]
        print(f"START {sl['id']}", flush=True)
        result=subprocess.run(sl['command'], cwd=plan.get('cwd'), text=True)
        if result.returncode:
            state.update({'next_index': i, 'last_status': 'FAILED', 'last_slice': sl['id']})
            state_path.write_text(json.dumps(state, indent=2) + "\n")
            return result.returncode
        state.setdefault('completed', []).append(sl['id'])
        state.update({'next_index': i + 1, 'last_status': 'PASS', 'last_slice': sl['id']})
        state_path.write_text(json.dumps(state, indent=2) + "\n")
        next_id = plan['slices'][i + 1]['id'] if i + 1 < len(plan['slices']) else 'NONE'
        print(f"PASS {sl['id']} -> NEXT_READY {next_id}", flush=True)
        i += 1
    state['status'] = 'COMPLETE'
    state_path.write_text(json.dumps(state, indent=2) + "\n")
    return 0

if __name__ == '__main__':
    sys.exit(main())
