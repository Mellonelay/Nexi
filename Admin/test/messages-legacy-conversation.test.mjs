import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("selected legacy conversation displays only its matching null-ID direct messages", async () => {
  const source = await readFile(new URL("../src/routes/messages.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /selectedConversationId\.startsWith\("legacy:"\)[\s\S]*?!message\.supportCustomerId[\s\S]*?\(message\.conversationId === null \|\| message\.conversationId === undefined\)[\s\S]*?message\.senderId === session\.actorId[\s\S]*?message\.recipientId === recipientId[\s\S]*?message\.recipientId === session\.actorId[\s\S]*?message\.senderId === recipientId/,
  );
  assert.match(source, /message\.conversationId === selectedConversationId/);
});
