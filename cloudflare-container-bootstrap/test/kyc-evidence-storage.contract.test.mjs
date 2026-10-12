import test from "node:test";
import assert from "node:assert/strict";
import { handleKycEvidenceStorage } from "../kyc-evidence-storage.js";

const key = "kyc-evidence/user-123/0fdbd7e0-1cf7-46b2-a759-1ce812570ad4";
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("fails closed when the KYC bucket binding is absent", async () => {
  const response = await handleKycEvidenceStorage(new Request("http://nexi-kyc-evidence/objects?key=" + encodeURIComponent(key), { method: "HEAD" }), {});
  assert.equal(response.status, 503);
});

test("restricts storage operations to the private KYC key namespace", async () => {
  const response = await handleKycEvidenceStorage(new Request("http://nexi-kyc-evidence/objects?key=deposit-proofs/x", { method: "PUT", body: png }), {
    KYC_EVIDENCE: { put: async () => assert.fail("must not write") },
  });
  assert.equal(response.status, 400);
});

test("stores private evidence with sensitive classification and no-store metadata", async () => {
  let stored;
  const response = await handleKycEvidenceStorage(new Request("http://nexi-kyc-evidence/objects?key=" + encodeURIComponent(key), {
    method: "PUT", headers: { "content-type": "image/png" }, body: png,
  }), {
    KYC_EVIDENCE: { put: async (...args) => { stored = args; } },
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(stored[0], key);
  assert.deepEqual(stored[2], {
    httpMetadata: { contentType: "image/png" },
    customMetadata: { classification: "sensitive-kyc-evidence" },
  });
});

test("serves evidence only through private no-store container access", async () => {
  const response = await handleKycEvidenceStorage(new Request("http://nexi-kyc-evidence/objects?key=" + encodeURIComponent(key)), {
    KYC_EVIDENCE: { get: async () => ({ body: new Blob([png]), httpMetadata: { contentType: "image/png" } }) },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="kyc-evidence"');
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);
});

test("rejects unsupported MIME, oversized body, and public URL access", async () => {
  const binding = { put: async () => assert.fail("must not write") };
  const badMime = await handleKycEvidenceStorage(new Request("http://nexi-kyc-evidence/objects?key=" + encodeURIComponent(key), {
    method: "PUT", headers: { "content-type": "image/gif" }, body: png,
  }), { KYC_EVIDENCE: binding });
  assert.equal(badMime.status, 413);
  const publicRead = await handleKycEvidenceStorage(new Request("https://public.example/kyc-evidence/" + encodeURIComponent(key)), { KYC_EVIDENCE: binding });
  assert.equal(publicRead.status, 400);
});
