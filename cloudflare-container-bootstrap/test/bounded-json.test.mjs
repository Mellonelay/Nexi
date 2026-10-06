import test from "node:test";
import assert from "node:assert/strict";
import { boundedJson, MAX_GATEWAY_BODY_BYTES } from "../src/bounded-json.js";

const request = (body, headers = {}) => new Request("https://nexi.internal/", {
  method: "POST", body, headers, duplex: "half",
});

test("JSON byte cap accepts exactly the limit and rejects one byte more", async () => {
  const exact = "{}" + " ".repeat(MAX_GATEWAY_BODY_BYTES - 2);
  assert.deepEqual(await boundedJson(request(exact)), {});
  assert.equal(await boundedJson(request(exact + " ")), null);
});

test("missing or misleading Content-Length cannot bypass the byte cap", async () => {
  let pulled = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      pulled += 1;
      controller.enqueue(new Uint8Array(MAX_GATEWAY_BODY_BYTES / 2));
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  assert.equal(await boundedJson(request(body, { "content-length": "1" })), null);
  assert.equal(pulled, 3);
  assert.equal(cancelled, true);
});

test("UTF-8 is decoded across chunk boundaries and counted as bytes", async () => {
  const encoded = new TextEncoder().encode(JSON.stringify({ value: "€" }));
  const chunks = Array.from(encoded, (byte) => new Uint8Array([byte]));
  const body = new ReadableStream({
    pull(controller) {
      const chunk = chunks.shift();
      if (chunk) controller.enqueue(chunk);
      else controller.close();
    },
  });
  assert.deepEqual(await boundedJson(request(body)), { value: "€" });
  assert.equal(await boundedJson(request(JSON.stringify("€".repeat(MAX_GATEWAY_BODY_BYTES / 2)))), null);
});

test("invalid JSON, missing body and failed streams fail closed", async () => {
  assert.equal(await boundedJson(request("{broken")), null);
  assert.equal(await boundedJson(new Request("https://nexi.internal/")), null);
  const body = new ReadableStream({ start(controller) { controller.error(new Error("interrupted")); } });
  assert.equal(await boundedJson(request(body)), null);
});

test("declared oversized bodies are rejected before reading", async () => {
  let pulled = false;
  const body = new ReadableStream({ pull() { pulled = true; } }, { highWaterMark: 0 });
  assert.equal(await boundedJson(request(body, { "content-length": String(MAX_GATEWAY_BODY_BYTES + 1) })), null);
  assert.equal(pulled, false);
});
