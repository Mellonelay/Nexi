import json
from pathlib import Path
import tempfile
import unittest
from nexi_phase_checkpoint import AUTHORITIES, checkpoint


class PhaseGateTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in AUTHORITIES:
            (self.root / name).write_text('geometry closed; full acceptance NO\n')
        self.capsule = self.root / 'capsule.json'
        self.capsule.write_text(json.dumps({'completed': ['geometry'],
            'production': {'sourceSha': 'deployed-sha'}, 'phase': 'GEOMETRY_CLOSED'}))
        self.evidence = self.root / 'test-output.json'
        self.evidence.write_text('{"pass": true}')
        self.receipt = self.root / 'receipt.json'
        self.enter('implementation', goal='kernel', scope='phase gate', next_proof='test gate')

    def enter(self, phase, **kwargs):
        return checkpoint(self.root, self.capsule, phase, **kwargs)

    def seal(self, outcome='VERIFIED', updated=()):
        self.receipt.write_text(json.dumps({'phase': 'implementation', 'goal': 'kernel',
            'slice': 'phase gate', 'outcome': outcome, 'proof': 'focused tests only; not deployed',
            'nextProof': 'verify wrapper', 'evidence': [str(self.evidence)],
            'reconciliation': {name: {'action': 'UPDATED' if name in updated else 'UNCHANGED',
                'reason': 'kernel-only; product completion unchanged'} for name in AUTHORITIES}}))
        self.enter('implementation', receipt=self.receipt)

    def test_transition_refuses_missing_receipt_without_mutation(self):
        before = self.capsule.read_bytes()
        with self.assertRaisesRegex(ValueError, 'PHASE BLOCKED'):
            self.enter('test')
        self.assertEqual(before, self.capsule.read_bytes())

    def test_resume_preserves_product_truth_and_saved_proof(self):
        self.seal()
        result = self.enter('test')
        state = json.loads(self.capsule.read_text())
        self.assertEqual(state['completed'], ['geometry'])
        self.assertEqual(state['phase'], 'GEOMETRY_CLOSED')
        self.assertEqual(state['production']['sourceSha'], 'deployed-sha')
        self.assertEqual(result['phase'], 'test')
        self.assertTrue(Path(state['workCycle']['completedPhases'][0]['receipt']).exists())
        before = self.capsule.read_bytes()
        self.enter('test')
        self.assertEqual(before, self.capsule.read_bytes())

    def test_later_authority_change_invalidates_only_transition(self):
        self.seal()
        (self.root / AUTHORITIES[0]).write_text('new durable truth')
        with self.assertRaisesRegex(ValueError, 'authority changed'):
            self.enter('test')
        self.seal(updated=(AUTHORITIES[0],))
        self.enter('test')

    def test_changed_evidence_is_not_reused(self):
        self.seal()
        self.evidence.write_text('{"pass": false}')
        with self.assertRaisesRegex(ValueError, 'evidence changed'):
            self.enter('test')

    def test_false_reconciliation_and_completion_claim_rejected(self):
        (self.root / AUTHORITIES[0]).write_text('changed')
        with self.assertRaisesRegex(ValueError, 'disagrees'):
            self.seal()
        with self.assertRaisesRegex(ValueError, 'Outcome'):
            self.seal(outcome='OWNER_ACCEPTED')

    def test_blocked_phase_has_durable_evidence(self):
        self.seal(outcome='BLOCKED_WITH_EVIDENCE')
        self.enter('review')
        state = json.loads(self.capsule.read_text())
        self.assertEqual(state['workCycle']['completedPhases'][0]['outcome'], 'BLOCKED_WITH_EVIDENCE')

    def test_new_slice_requires_prior_closeout(self):
        with self.assertRaisesRegex(ValueError, 'Cannot replace'):
            self.enter('implementation', goal='other', scope='other', next_proof='other')
        self.seal()
        self.enter('planning', goal='other', scope='next task', next_proof='inspect owner')

    def test_completion_report_requires_current_phase_receipt(self):
        self.seal()
        before = self.capsule.read_bytes()
        with self.assertRaisesRegex(ValueError, 'PHASE BLOCKED'):
            self.enter('completion', require_closed=True)
        self.assertEqual(before, self.capsule.read_bytes())


if __name__ == '__main__':
    unittest.main()
