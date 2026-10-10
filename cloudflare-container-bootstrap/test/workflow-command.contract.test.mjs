import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

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
    async () => "signature",
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

  const result = await invoke(
    { JWT_SECRET: "test-only" },
    "loan",
    "loan-test-id",
    "schedule",
    "loan-test-id",
    "loan-test-id:schedule",
  );

  assert.deepEqual(result, { done: true, state: "PAID" });
  assert.equal(
    new URL(globalThis.workflowCommandRequest.url).pathname,
    "/_internal/workflows/loan/schedule",
  );
  assert.deepEqual(
    globalThis.workflowCommandRequest.body,
    {
      instanceId: "loan-test-id",
      entityId: "loan-test-id",
      idempotencyKey: "loan-test-id:schedule",
      payload: {},
    },
  );
  delete globalThis.workflowCommandRequest;
});
