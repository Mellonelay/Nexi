import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public-route reorder buttons have descriptive accessible names", async () => {
  const source = await readFile(
    new URL("../src/routes/frontend-control.tsx", import.meta.url),
    "utf8",
  );
  const buttonSource = (testId) => {
    const markerIndex = source.indexOf(testId);
    assert.notEqual(markerIndex, -1, `missing ${testId}`);
    const start = source.lastIndexOf("<Button", markerIndex);
    const end = source.indexOf("</Button>", markerIndex);
    assert.ok(start >= 0 && end > markerIndex, `could not locate ${testId} button`);
    return source.slice(start, end);
  };

  assert.match(buttonSource("route-up-${r.id}"), /aria-label=\{`Move \$\{r\.label\} up`\}/);
  assert.match(buttonSource("route-down-${r.id}"), /aria-label=\{`Move \$\{r\.label\} down`\}/);
});

test("Public App Settings combines existing guarded controls without removing compatibility routes", async () => {
  const [settings, navigation, flags, shell] = await Promise.all([
    readFile(new URL("../src/routes/frontend-control.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/navigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/feature-flags.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/admin/components/shell/AdminShell.tsx", import.meta.url), "utf8"),
  ]);
  for (const label of [
    "Routes & Navigation",
    "Markets & Quotes",
    "Content & Notices",
    "Contact Us",
    "Advanced Settings & Audit",
  ]) {
    assert.ok(settings.includes(label), "missing settings section: " + label);
  }
  assert.match(settings, /<PublicNavigationSettings embedded \/>/);
  assert.match(settings, /<FeatureControls embedded \/>/);
  assert.ok(navigation.includes('createFileRoute("/navigation")'));
  assert.ok(navigation.includes('permission="navigation.view"'));
  assert.ok(flags.includes('createFileRoute("/feature-flags")'));
  assert.ok(flags.includes('permission="flags.view"'));
  assert.ok(shell.includes("item.anyPermissions?.some(can)"));
});
