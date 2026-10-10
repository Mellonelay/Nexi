import test from "node:test";
import assert from "node:assert/strict";
import { dispatchLoanApproval } from "../src/loan-workflow-dispatch.js";

test("LOAN_APPROVED creates one deterministic workflow when get reports not found", async () => {
  const sendEvent = async (event) => assert.equal(event.type, "decision");
  const running = { status: async () => ({ status: "running" }), sendEvent };
  const get = async () => {
    get.calls += 1;
    const error = new Error("(instance.not_found) Instance not found");
    error.code = 10400;
    throw error;
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

test("a concurrent creation conflict is recovered by the next queue retry", async () => {
  const sent = [];
  const instance = {
    status: async () => ({ status: "running" }),
    sendEvent: async (event) => sent.push(event),
  };
  let getCalls = 0;
  const env = {
    LOAN_WORKFLOW: {
      get: async () => {
        getCalls += 1;
        if (getCalls === 1) {
          const error = new Error("(instance.not_found) Instance not found");
          error.code = 10400;
          throw error;
        }
        return instance;
      },
      create: async () => {
        const error = new Error("(instance.already_exists) Instance already exists");
        error.code = 10405;
        throw error;
      },
    },
  };
  const event = {
    type: "LOAN_APPROVED",
    payload: { loanId: "loan-42" },
  };

  await assert.rejects(dispatchLoanApproval(env, event), /already_exists/);
  await dispatchLoanApproval(env, event);

  assert.equal(getCalls, 2);
  assert.deepEqual(sent, [
    { type: "decision", payload: { decision: "APPROVED" } },
  ]);
});

test("unexpected workflow lookup failures remain retryable", async () => {
  const env = {
    LOAN_WORKFLOW: {
      get: async () => {
        throw new Error("workflow API unavailable");
      },
      create: async () => assert.fail("unexpected errors must not create instances"),
    },
  };

  await assert.rejects(
    dispatchLoanApproval(env, {
      type: "LOAN_APPROVED",
      payload: { loanId: "loan-42" },
    }),
    /workflow API unavailable/,
  );
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
    { type: "decision", payload: { decision: "APPROVED" } },
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
