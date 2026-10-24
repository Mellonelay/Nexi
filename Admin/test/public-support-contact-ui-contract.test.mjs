import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("failed support settings reads show retry instead of editable blank contacts", async () => {
  const source = await readFile(new URL("../src/routes/frontend-control.tsx", import.meta.url), "utf8");
  assert.match(source, /SupportEntryPanel supports=\{supports\} error=\{supportQ\.error\}/);
  assert.match(source, /if \(error\) \{\s*return <ErrorState title="Could not load support settings" description=\{error\.message\} onRetry=\{onSaved\} \/>;/);
});

test("Admin contact save verifies the canonical config readback without showing a sample address", async () => {
  const source = await readFile(new URL("../src/routes/frontend-control.tsx", import.meta.url), "utf8");
  assert.match(source, /useAdminQuery\(\(p\) => p\.listSupportEntryPoints\(\)\)/);
  assert.match(source, /provider\.updatePublicSupportContacts\(\{ telegramUrl, email \}/);
  assert.match(source, /await provider\.listSupportEntryPoints\(\)/);
  assert.match(source, /persistedTelegram !== telegramUrl\.trim\(\) \|\| persistedEmail !== email\.trim\(\)/);
  assert.doesNotMatch(source, /placeholder="support@example\.com"/);
});
