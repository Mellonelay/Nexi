import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { reorderByIds } from "../src/admin/data/banner-order.ts";
import { ALL_ROUTES, findRoute, NAV_GROUPS } from "../src/admin/config/navigation.ts";
import { mapBinaryPositionStatus, mapLedgerScope, mapWalletAccount, mapLedgerPosting } from "../src/admin/types/index.ts";
import { isPublishedAnnouncement } from "../src/admin/data/announcement-status.ts";
import { isOngoingBinaryPositionStatus } from "../src/admin/data/binary-position-view.ts";
import { groupAdminMessageConversations } from "../src/admin/data/message-conversations.ts";
import { buildOverviewWorkItems } from "../src/admin/data/overview-work-items.ts";
import { learnCategoryStatusUpdate } from "../src/admin/data/learn-category-status.ts";

test("ledger scope mapping preserves all canonical wallet accounts", () => {
  assert.deepEqual(["MAIN", "SPOT", "MARGIN", "BINARY", "FINANCE"].map(mapLedgerScope),
    ["funding", "spot", "margin", "option", "financial"]);
  assert.equal(mapLedgerScope("UNKNOWN"), undefined);
});

test("Admin wallet and ledger rows preserve canonical balances, scope and owner", () => {
  const account = { id: "account-1", userId: "user-1", asset: "USDT", scope: "MARGIN", status: "ACTIVE", available: "12.50", locked: "2.00" };
  assert.deepEqual(mapWalletAccount(account), { id: "account-1", userId: "user-1", asset: "USDT", domain: "margin", status: "active", available: "12.50", locked: "2.00", updatedAt: undefined });
  const posting = { id: "posting-1", userId: "user-1", scope: "MARGIN", asset: "USDT", amount: "2.00", kind: "DEBIT", createdAt: "2026-10-27T00:00:00Z", referenceId: "ref-1", referenceType: "MARGIN_INTEREST" };
  assert.deepEqual(mapLedgerPosting(posting), { id: "posting-1", userId: "user-1", domain: "margin", asset: "USDT", amount: "2.00", type: "posting", ts: posting.createdAt, refId: "ref-1", note: "DEBIT · MARGIN_INTEREST", debit: "2.00", credit: undefined, status: "posted" });
  const { userId, scope, ...nestedPosting } = posting;
  assert.equal(mapLedgerPosting({ ...nestedPosting, account: { userId, scope } })?.userId, "user-1");
  assert.equal(mapWalletAccount({ ...account, scope: "UNKNOWN" }), undefined);
  assert.equal(mapWalletAccount({ ...account, status: "__proto__" }), undefined);
  assert.equal(mapLedgerPosting({ ...posting, scope: "UNKNOWN" }), undefined);
});

test("reorders banners by a complete ID permutation and preserves each record", () => {
  const banners = [
    { id: "first", message: "First", active: true },
    { id: "second", message: "Second", active: false },
  ];
  const reordered = reorderByIds(banners, ["second", "first"]);
  assert.deepEqual(reordered, [banners[1], banners[0]]);
  assert.equal(reordered[0].active, false);
});

test("rejects duplicate, missing, and stale banner IDs", () => {
  const banners = [{ id: "first" }, { id: "second" }];
  assert.equal(reorderByIds(banners, ["first", "first"]), null);
  assert.equal(reorderByIds(banners, ["first"]), null);
  assert.equal(reorderByIds(banners, ["first", "missing"]), null);
});

test("Admin navigation presents eight workspaces and hides the guarded sandbox link", async () => {
  assert.deepEqual(
    NAV_GROUPS.map((group) => group.label),
    [
      "Overview",
      "Clients",
      "Trading",
      "Wallet & Finance",
      "Markets",
      "Products",
      "Communications",
      "Administration & Settings",
    ],
  );
  assert.equal(
    ALL_ROUTES.some((route) => route.to === "/sandbox"),
    false,
  );
  assert.equal(findRoute("/sandbox"), undefined);

  const sandbox = await readFile(new URL("../src/routes/sandbox.tsx", import.meta.url), "utf8");
  assert.match(sandbox, /createFileRoute\("\/sandbox"\)/);
  assert.match(sandbox, /RouteGuard permission="sandbox\.view"/);
  assert.doesNotMatch(sandbox, /title="Binary Trading Control"/);
});

test("settling Binary positions are not exposed as open research-control targets", () => {
  assert.equal(mapBinaryPositionStatus("active"), "open");
  assert.equal(mapBinaryPositionStatus("settling"), "settling");
  assert.equal(mapBinaryPositionStatus("settlement_delayed"), "settling");
  assert.equal(mapBinaryPositionStatus("win"), "won");
  assert.equal(mapBinaryPositionStatus("loss"), "lost");
  assert.equal(mapBinaryPositionStatus("unknown"), "error");
});

test("announcement publication mapping accepts SQLite integer booleans", () => {
  assert.equal(isPublishedAnnouncement(true), true);
  assert.equal(isPublishedAnnouncement(1), true);
  assert.equal(isPublishedAnnouncement(false), false);
  assert.equal(isPublishedAnnouncement(0), false);
  assert.equal(isPublishedAnnouncement("true"), false);
});

test("the Binary ongoing view includes open and settling positions, but not completed positions", () => {
  assert.equal(isOngoingBinaryPositionStatus("open"), true);
  assert.equal(isOngoingBinaryPositionStatus("settling"), true);
  assert.equal(isOngoingBinaryPositionStatus("won"), false);
  assert.equal(isOngoingBinaryPositionStatus("lost"), false);
  assert.equal(isOngoingBinaryPositionStatus("error"), false);
});

test("Admin messages are grouped into recent conversations with unread counts", () => {
  const messages = [
    {
      id: "one",
      senderId: "admin",
      recipientId: "client-a",
      body: "Earlier",
      deliveryState: "DELIVERED",
      createdAt: "2026-10-20T10:00:00.000Z",
      readAt: null,
    },
    {
      id: "two",
      senderId: "client-a",
      recipientId: "admin",
      body: "Latest",
      deliveryState: "DELIVERED",
      createdAt: "2026-10-20T10:02:00.000Z",
      readAt: null,
    },
    {
      id: "three",
      senderId: "client-b",
      recipientId: "admin",
      body: "Read thread",
      deliveryState: "DELIVERED",
      createdAt: "2026-10-20T10:01:00.000Z",
      readAt: "2026-10-20T10:03:00.000Z",
    },
    {
      id: "unrelated",
      senderId: "client-a",
      recipientId: "client-b",
      body: "Not an Admin conversation",
      deliveryState: "DELIVERED",
      createdAt: "2026-10-20T10:04:00.000Z",
      readAt: null,
    },
  ];

  assert.deepEqual(
    groupAdminMessageConversations(messages, "admin").map((conversation) => ({
      clientId: conversation.clientId,
      latestMessageId: conversation.latestMessage.id,
      unreadCount: conversation.unreadCount,
    })),
    [
      { clientId: "client-a", latestMessageId: "two", unreadCount: 1 },
      { clientId: "client-b", latestMessageId: "three", unreadCount: 0 },
    ],
  );
});

test("Admin message provider fetches bounded API pages through the final partial page", async () => {
  const source = await readFile(new URL("../src/admin/data/nexi-api-provider.ts", import.meta.url), "utf8");
  assert.match(source, /async listMessages\(\): Promise<AdminMessage\[\]>[\s\S]*?for \(let page = 1; ; page \+= 1\)/);
  assert.match(source, /\/communications\/admin\/messages\?page=\$\{page\}&limit=100/);
  assert.match(source, /if \(rows\.length < 100\) return messages/);
  assert.match(source, /const seenIds = new Set<string>\(\)/);
});

test("Admin groups routed customer messages under their canonical support conversation", async () => {
  const conversations = groupAdminMessageConversations([
    {
      id: "public-1",
      conversationId: "conversation:customer:support:nexi",
      supportCustomerId: "customer",
      senderId: "customer",
      recipientId: "support:nexi",
      body: "Question",
      deliveryState: "SENT",
      createdAt: "2026-10-24T10:00:00.000Z",
      readAt: null,
    },
    {
      id: "admin-1",
      conversationId: "conversation:customer:support:nexi",
      supportCustomerId: "customer",
      senderId: "support:nexi",
      recipientId: "customer",
      body: "Reply",
      deliveryState: "SENT",
      createdAt: "2026-10-24T10:01:00.000Z",
      readAt: null,
    },
  ], "admin");

  assert.equal(conversations.length, 1);
  assert.equal(conversations[0].conversationId, "conversation:customer:support:nexi");
  assert.equal(conversations[0].clientId, "customer");
  assert.equal(conversations[0].latestMessage.id, "admin-1");
  assert.equal(conversations[0].unreadCount, 1);
});

test("Learn category status actions compare against current status and send the opposite target", () => {
  assert.deepEqual(learnCategoryStatusUpdate("ACTIVE"), {
    expectedStatus: "ACTIVE",
    status: "INACTIVE",
  });
  assert.deepEqual(learnCategoryStatusUpdate("INACTIVE"), {
    expectedStatus: "INACTIVE",
    status: "ACTIVE",
  });
});

test("Trading Binary opens on positions and separates the two control contexts", async () => {
  const source = await readFile(new URL("../src/routes/binary.tsx", import.meta.url), "utf8");
  const clients = await readFile(new URL("../src/routes/users.tsx", import.meta.url), "utf8");
  assert.match(source, /view = "positions"/);
  assert.match(source, /initialFilterValues=\{\{ status: "ongoing" \}\}/);
  assert.match(
    source,
    /positions\.find\(\(position\) => isOngoingBinaryPositionStatus\(position\.status\)\)/,
  );
  assert.match(source, /validateSearch: binarySearchSchema/);
  assert.match(source, /data-testid="binary-position-inspector"/);
  assert.match(source, /if \(position\.status !== "open"\)/);
  assert.match(source, /if \(!position\.researchEligible\)/);
  assert.match(clients, /aria-label="Binary account default"/);
});

test("Messages renders a conversation inbox and selected thread from live messages", async () => {
  const source = await readFile(new URL("../src/routes/messages.tsx", import.meta.url), "utf8");
  assert.match(source, /groupAdminMessageConversations/);
  assert.match(source, /aria-label="Message conversations"/);
  assert.match(source, /aria-label="Selected client conversation"/);
  assert.match(source, /if \(!recipientId && conversations\.length\) \{\s*void openThread\(conversations\[0\]\.clientId, conversations\[0\]\.conversationId\);/);
  assert.match(source, /const unread = \(messages\.data \?\? \[\]\)\.filter\([\s\S]*?!message\.readAt[\s\S]*?\);\s*if \(!unread\.length\) return;\s*try \{\s*await Promise\.all\(unread\.map\(\(message\) => provider\.markAdminMessageRead\(message\.id\)\)\)/);
  assert.match(source, /onChange=\{\(event\) => \{\s*setPendingMessageKey\(null\);\s*setSelectedConversationId\(""\);\s*void openThread\(event\.target\.value\);/);
});

test("Admin Messages uses one idempotency key per compose intent and retains it on failure", async () => {
  const route = await readFile(new URL("../src/routes/messages.tsx", import.meta.url), "utf8");
  const provider = await readFile(new URL("../src/admin/data/nexi-api-provider.ts", import.meta.url), "utf8");

  assert.match(route, /const \[pendingMessageKey, setPendingMessageKey\] = useState<string \| null>\(null\)/);
  assert.match(route, /pendingMessageKey \?\? globalThis\.crypto\?\.randomUUID/);
  assert.match(route, /sendAdminMessage\(\{[\s\S]*?recipientId,[\s\S]*?selectedConversation\?\.support \? \{ conversationId: selectedConversation\.conversationId \}/);
  assert.match(route, /setPendingMessageKey\(null\);\s+messages\.refresh\(\)/);
  assert.match(provider, /idempotencyKey: idempotencyKey \?\? boundedIdempotencyKey/);
  assert.match(provider, /payload: \{ recipientId: string; conversationId\?: string; body: string; attachmentIds\?: string\[\]; idempotencyKey: string \}/);
});

test("Overview queues only actionable live records visible to the operator", () => {
  const items = buildOverviewWorkItems({
    kyc: [
      {
        id: "kyc",
        userId: "client",
        documentType: "id_card",
        status: "pending",
        submittedAt: "2026-10-22T00:00:00Z",
        country: "US",
      },
      {
        id: "approved",
        userId: "client",
        documentType: "passport",
        status: "approved",
        submittedAt: "2026-10-22T00:00:00Z",
        country: "US",
      },
    ],
    withdrawals: [
      {
        id: "withdrawal",
        userId: "client",
        amount: "2",
        asset: "BTC",
        network: "mainnet",
        status: "pending",
      },
      {
        id: "paid",
        userId: "client",
        amount: "1",
        asset: "BTC",
        network: "mainnet",
        status: "confirmed",
      },
    ],
    health: [
      { id: "api", name: "API", status: "down", latencyMs: 100, updatedAt: "2026-10-22T00:00:00Z" },
      { id: "db", name: "SQLite", status: "ok", latencyMs: 1, updatedAt: "2026-10-22T00:00:00Z" },
    ],
    access: { kyc: true, withdrawals: false, health: true },
  });

  assert.deepEqual(
    items.map(({ id }) => id),
    ["kyc:kyc", "health:api"],
  );
});

test("Admin Messages invalidates protected HTTP data on authenticated Socket.IO changes and reconnect", async () => {
  const provider = await readFile(new URL("../src/admin/data/nexi-api-provider.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../src/routes/messages.tsx", import.meta.url), "utf8");
  assert.match(provider, /subscribeToCommunications\(onChange: \(\) => void\)/);
  assert.match(provider, /auth: \(callback\).*getToken/s);
  assert.match(provider, /socket\.on\("communications\.changed", onChange\)/);
  assert.match(provider, /socket\.on\("connect", onChange\)/);
  assert.match(provider, /return \(\) => socket\.disconnect\(\)/);
  assert.match(route, /subscribeToCommunications\?\.\(\(\) => \{[\s\S]*refreshMessages\(\);[\s\S]*refreshModeration\(\);/);
});
