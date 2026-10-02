#!/usr/bin/env python3
"""Durable reconciliation gate for the existing NEXI skill checkpoint."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import tempfile

AUTHORITIES = ('NEXI_CURRENT_STATE.md', 'NEXI_PRODUCTION_COMPLETION_LEDGER.md')
PHASES = ('recovery', 'planning', 'diagnosis', 'implementation', 'test', 'browser',
          'review', 'git', 'deploy', 'completion')


def digest(path):
    checksum = hashlib.sha256()
    with open(path, 'rb') as stream:
        for chunk in iter(lambda: stream.read(65536), b''):
            checksum.update(chunk)
    return checksum.hexdigest()


def atomic_write(path, data):
    path = Path(path)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=path.name + '.')
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(data, stream, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


@contextmanager
def locked(capsule):
    with open(str(capsule) + '.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        yield


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fresh_receipt(cycle, authorities):
    require(cycle['lastReceipt'], 'PHASE BLOCKED: save prior-phase proof and reconcile both authorities')
    prior = json.loads(Path(cycle['lastReceipt']).read_text())
    require(prior['authorityHashes'] == authorities,
            'PHASE BLOCKED: authority changed after receipt; reconcile again')
    require(all(digest(path) == sha for path, sha in prior['evidenceHashes'].items()),
            'PHASE BLOCKED: evidence changed after receipt; revalidate affected proof')
    return prior


def checkpoint(repo, capsule, phase, receipt=None, goal=None, scope=None, next_proof=None,
               require_closed=False):
    repo, capsule = Path(repo).resolve(), Path(capsule).resolve()
    require(phase in PHASES, 'Explicit engineering phase required')
    with locked(capsule):
        original = capsule.read_bytes()
        state = json.loads(original)
        authorities = {name: digest(repo / name) for name in AUTHORITIES}
        cycle = state.get('workCycle')
        if cycle is None:
            require(all((goal, scope, next_proof)),
                    'First entry requires --goal, --slice and --next-proof; preserve historical proof')
            cycle = {'repository': str(repo), 'goal': goal, 'slice': scope, 'phase': phase,
                     'nextProof': next_proof, 'entryAuthorities': authorities,
                     'lastReceipt': None, 'completedPhases': []}
        require(cycle.get('repository', str(repo)) == str(repo), 'Capsule belongs to another checkout')
        cycle['repository'] = str(repo)
        if receipt:
            packet = json.loads(Path(receipt).read_text())
            require(isinstance(packet, dict), 'Receipt must be a JSON object')
            require(packet.get('phase') == cycle['phase'], 'Receipt must close the active phase')
            require(packet.get('goal') == cycle['goal'] and packet.get('slice') == cycle['slice'],
                    'Receipt goal/slice must match the recovered work cycle')
            require(packet.get('outcome') in ('VERIFIED', 'BLOCKED_WITH_EVIDENCE'),
                    'Outcome must be VERIFIED or BLOCKED_WITH_EVIDENCE; never implicit completion')
            require(packet.get('proof') and packet.get('nextProof'), 'Proof scope and next proof required')
            evidence = packet.get('evidence', [])
            require(isinstance(evidence, list) and evidence, 'At least one evidence file required')
            hashes = {str(Path(path).resolve()): digest(path) for path in evidence}
            reconciliation = packet.get('reconciliation', {})
            for name in AUTHORITIES:
                item = reconciliation.get(name, {})
                require(item.get('action') in ('UPDATED', 'UNCHANGED') and item.get('reason'),
                        'Reconcile ' + name + ' explicitly (UPDATED or justified UNCHANGED)')
                changed = authorities[name] != cycle['entryAuthorities'][name]
                require(changed == (item['action'] == 'UPDATED'),
                        name + ': declared reconciliation disagrees with phase-entry hash')
            sealed = dict(packet, evidenceHashes=hashes, authorityHashes=authorities,
                          recordedAt=datetime.now(timezone.utc).isoformat())
            receipt_id = hashlib.sha256(json.dumps(sealed, sort_keys=True).encode()).hexdigest()
            receipt_dir = capsule.parent / 'nexi-phase-receipts'
            receipt_dir.mkdir(mode=0o700, exist_ok=True)
            saved = receipt_dir / (receipt_id + '.json')
            atomic_write(saved, sealed)
            cycle['lastReceipt'] = str(saved)
            cycle['nextProof'] = packet['nextProof']
        if phase != cycle['phase']:
            prior = fresh_receipt(cycle, authorities)
            cycle['completedPhases'].append({'phase': cycle['phase'], 'slice': cycle['slice'],
                                            'outcome': prior['outcome'], 'receipt': cycle['lastReceipt']})
            cycle.update(phase=phase, entryAuthorities=authorities, lastReceipt=None)
            if goal or scope:
                require(all((goal, scope, next_proof)), 'New slice requires goal, slice and next proof')
                cycle.update(goal=goal, slice=scope, nextProof=next_proof)
        elif goal or scope:
            require(goal == cycle['goal'] and scope == cycle['slice'],
                    'Cannot replace an active slice without closing its phase')
        if require_closed:
            fresh_receipt(cycle, authorities)
        state['workCycle'] = cycle
        if json.loads(original) != state:
            require(capsule.read_bytes() == original, 'Capsule changed concurrently; recover before retry')
            state['updatedAt'] = datetime.now(timezone.utc).isoformat()
            atomic_write(capsule, state)
        return {'checkpoint': 'DURABLE_PHASE_GATE', 'phase': phase, 'goal': cycle['goal'],
                'slice': cycle['slice'], 'nextProof': cycle['nextProof'],
                'lastReceipt': cycle['lastReceipt'], 'capsule': str(capsule),
                'authorityHashes': authorities}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True)
    parser.add_argument('--capsule', required=True)
    parser.add_argument('--phase', choices=PHASES, required=True)
    parser.add_argument('--receipt')
    parser.add_argument('--goal')
    parser.add_argument('--slice', dest='scope')
    parser.add_argument('--next-proof')
    parser.add_argument('--require-closed', action='store_true')
    args = parser.parse_args()
    try:
        print(json.dumps(checkpoint(**vars(args)), indent=2))
    except (ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(2, 'DURABLE_PHASE_GATE: ' + str(error) + '\n')


if __name__ == '__main__':
    main()
