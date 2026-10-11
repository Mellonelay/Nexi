import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac, webcrypto } from "node:crypto";

const source = readFileSync(
  new URL("../src/index.js", import.meta.url),
  "utf8",
);

test("Workflow command keeps path parameters out of the strict Nest DTO body", async () => {
  const start = source.indexOf("async function invokeWorkflowCommand(");
  const end = source.indexOf("function workflowEventPayload(", start);
  assert.ok(start >= 0 && end > start, "workflow command helper is present");
  const helper = source.slice(start, end);
  const invoke = new Function(
    "workflowCommandSignature",
    "getRunningNexiContainer",
    "NonRetryableError",
    `${helper}; return invokeWorkflowCommand;`,
  )(
    async (...args) => {
      globalThis.workflowCommandSignatureArguments = args;
      return "signature";
    },
    async () => ({
      fetch: async (request) => {
        globalThis.workflowCommandRequest = {
          url: request.url,
          body: await request.json(),
        };
        return Response.json({ done: true, state: "PAID" });
      },
    }),
    Error,
  );

  const payload = { reason: "signed payload" };
  const result = await invoke(
    { JWT_SECRET: "test-only" },
    "loan",
    "loan-test-id",
    "schedule",
    "loan-test-id",
    "loan-test-id:schedule",
    payload,
  );

  assert.deepEqual(result, { done: true, state: "PAID" });
  assert.equal(
    new URL(globalThis.workflowCommandRequest.url).pathname,
    "/_internal/workflows/loan/schedule",
  );
  assert.deepEqual(globalThis.workflowCommandRequest.body, {
    instanceId: "loan-test-id",
    entityId: "loan-test-id",
    idempotencyKey: "loan-test-id:schedule",
    payload,
  });
  assert.deepEqual(globalThis.workflowCommandSignatureArguments.at(-1), {
    workflow: "loan",
    instanceId: "loan-test-id",
    action: "schedule",
    entityId: "loan-test-id",
    idempotencyKey: "loan-test-id:schedule",
    payload,
  });
  delete globalThis.workflowCommandRequest;
  delete globalThis.workflowCommandSignatureArguments;
});

test("Workflow HMAC changes when the signed command payload changes", async () => {
  const start = source.indexOf("async function workflowCommandSignature(");
  const end = source.indexOf("function workflowEntityId(", start);
  assert.ok(start >= 0 && end > start, "Workflow signature helper is present");
  const sign = new Function(
    "crypto",
    "TextEncoder",
    `${source.slice(start, end)}; return workflowCommandSignature;`,
  )(webcrypto, TextEncoder);
  const fixed = {
    workflow: "withdrawal",
    instanceId: "workflow-1",
    action: "fail",
    entityId: "withdrawal-1",
    idempotencyKey: "withdrawal-1:fail",
  };
  const timestamp = 1_797_123_456_789;
  const payload = { reason: "provider rejected" };
  const original = await sign("test-secret", timestamp, {
    ...fixed,
    payload,
  });
  const expected = createHmac("sha256", "test-secret")
    .update(
      JSON.stringify([
        timestamp,
        fixed.workflow,
        fixed.instanceId,
        fixed.action,
        fixed.entityId,
        fixed.idempotencyKey,
        payload,
      ]),
    )
    .digest("hex");
  const mutated = await sign("test-secret", timestamp, {
    ...fixed,
    payload: { reason: "mutated" },
  });
  const boundaryCollision = await sign("test-secret", timestamp, {
    ...fixed,
    entityId: "withdrawal-1:withdrawal-1",
    idempotencyKey: "fail",
    payload,
  });

  assert.equal(original, expected);
  assert.notEqual(mutated, original);
  assert.notEqual(boundaryCollision, original);
});
