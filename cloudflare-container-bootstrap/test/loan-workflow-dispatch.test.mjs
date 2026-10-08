import test from "node:test";
import assert from "node:assert/strict";
import { dispatchLoanApproval } from "../src/loan-workflow-dispatch.js";

test("LOAN_APPROVED creates one deterministic workflow and signals its approval wait", async () => {
  const sendEvent = async () => {};
  const status = async () => ({ status: "unknown" });
  const running = { status: async () => ({ status: "running" }), sendEvent };
  const get = async () => {
    get.calls += 1;
    return get.calls === 1 ? { status } : running;
  };
  get.calls = 0;
  const create = async (input) => {
    create.calls.push(input);
    return running;
  };
  create.calls = [];
  const env = { LOAN_WORKFLOW: { get, create } };

  assert.equal(
    await dispatchLoanApproval(env, {
      type: "LOAN_APPROVED",
      payload: { loanId: "loan-42" },
    }),
    true,
  );

  assert.deepEqual(create.calls, [
    { id: "loan-loan-42", params: { loanId: "loan-42" } },
  ]);
  assert.equal(get.calls, 1);
});

test("replayed approval reuses the existing workflow instance", async () => {
  const sent = [];
  const instance = {
    status: async () => ({ status: "running" }),
    sendEvent: async (event) => sent.push(event),
  };
  const create = async () => assert.fail("existing workflow must not be recreated");
  const env = { LOAN_WORKFLOW: { get: async () => instance, create } };

  await dispatchLoanApproval(env, {
    type: "LOAN_APPROVED",
    payload: { loanId: "loan-42" },
  });

  assert.deepEqual(sent, [
    { type: "loan-decision", payload: { decision: "APPROVED" } },
  ]);
});

test("replayed approval acknowledges an already-complete workflow without signaling it", async () => {
  const instance = {
    status: async () => ({ status: "complete" }),
    sendEvent: async () => assert.fail("completed workflow must not receive events"),
  };
  const env = {
    LOAN_WORKFLOW: {
      get: async () => instance,
      create: async () => assert.fail("completed workflow must not be recreated"),
    },
  };

  assert.equal(
    await dispatchLoanApproval(env, {
      type: "LOAN_APPROVED",
      payload: { loanId: "loan-42" },
    }),
    true,
  );
});

test("unrelated and malformed events do not create loan workflows", async () => {
  const env = {
    LOAN_WORKFLOW: {
      get: async () => assert.fail("unrelated event must be ignored"),
      create: async () => assert.fail("unrelated event must be ignored"),
    },
  };
  assert.equal(await dispatchLoanApproval(env, { type: "MESSAGE_SENT", payload: {} }), false);
  await assert.rejects(
    dispatchLoanApproval(env, { type: "LOAN_APPROVED", payload: {} }),
    /valid loanId/,
  );
});
