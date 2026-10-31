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
