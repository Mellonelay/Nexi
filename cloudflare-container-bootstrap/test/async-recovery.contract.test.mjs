import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

test('Queue consumer uses explicit retry for invalid/failed ingress and explicit ack only after success', () => {
  assert.match(source, /async queue\(batch, env\)/);
  assert.match(source, /if \(!validQueueEnvelope\(message\.body\)\)[\s\S]*message\.retry\(\{ delaySeconds: 30 \}\)/);
  assert.match(source, /if \(!response\.ok\)[\s\S]*message\.retry\(\{[\s\S]*delaySeconds: Math\.min/);
  assert.match(source, /if \(!response\.ok\)[\s\S]*continue;[\s\S]*message\.ack\(\)/);
  assert.match(source, /x-nexi-event-signature/);
  assert.match(source, /_internal\/events\/queue/);
});

test('approved-loan workflow dispatch completes before Queue acknowledgement and retries failures', () => {
  const dispatch = source.indexOf('await dispatchLoanApproval(env, message.body)');
  const ack = source.indexOf('message.ack()', dispatch);
  assert.ok(dispatch >= 0 && ack > dispatch);
  assert.match(source.slice(dispatch, ack), /catch \(error\)[\s\S]*message\.retry\(/);
});

test('domain-event Queue has bounded retries and a configured dead-letter destination', () => {
  assert.match(config, /"queue"\s*:\s*"nexi-domain-events-staging"[\s\S]*"max_retries"\s*:\s*5[\s\S]*"dead_letter_queue"\s*:\s*"nexi-domain-events-staging-dlq"/);
});

test('Workflow bridge exposes only withdrawal/mining/loan and validates identifiers and object params', () => {
  assert.match(source, /const workflows = \{\s*withdrawal: env\.WITHDRAWAL_WORKFLOW,\s*mining: env\.MINING_WORKFLOW,\s*loan: env\.LOAN_WORKFLOW,\s*\}/);
  assert.match(source, /typeof body\.id !== \"string\" \|\| !\/\^\[A-Za-z0-9\._:-\]\{1,100\}\$\/\.test\(body\.id\)/);
  assert.match(source, /typeof params !== "object" \|\| Array\.isArray\(params\)/);
  assert.match(source, /workflow\.create\(\{ id: body\.id, params \}\)/);
});


test('Workflow entrypoints consume the Cloudflare event payload', async () => {
  const classes = source.slice(source.indexOf('export class NexiWithdrawalWorkflow'), source.indexOf('function requireLoanDueTerminal')).replaceAll('export class', 'class');
  const calls = [];
  const make = new Function('WorkflowEntrypoint', 'workflowEntityId', 'invokeWorkflowCommand', 'workflowEventPayload', 'NonRetryableError', classes + '; return [NexiWithdrawalWorkflow, NexiMiningWorkflow, NexiLoanWorkflow];');
  const workflows = make(class {}, (params, key) => {
    assert.equal(params[key], 'controlled-entity');
    return params[key];
  }, async (...args) => {
    calls.push(args);
    return { done: true };
  }, event => event.payload, Error);
  const step = {
    do: async (_name, _options, callback) => callback(),
    waitForEvent: async (_name, options) => {
      assert.equal(options.type, 'decision');
      return { payload: { decision: 'REJECTED' } };
    },
  };
  for (const [index, key] of ['withdrawalId', 'subscriptionId', 'loanId'].entries()) {
    const result = await new workflows[index]().run({ payload: { [key]: 'controlled-entity' }, instanceId: 'controlled-instance' }, step);
    assert.equal(result.done, true);
  }
  assert.deepEqual(calls.map(args => args[4]), ['controlled-entity', 'controlled-entity']);
});
