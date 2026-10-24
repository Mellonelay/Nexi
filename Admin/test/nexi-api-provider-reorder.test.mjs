import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { reorderByIds } from "../src/admin/data/banner-order.ts";
import { ALL_ROUTES, findRoute, NAV_GROUPS } from "../src/admin/config/navigation.ts";
import { mapBinaryPositionStatus } from "../src/admin/types/index.ts";
import { isPublishedAnnouncement } from "../src/admin/data/announcement-status.ts";
import { isOngoingBinaryPositionStatus } from "../src/admin/data/binary-position-view.ts";
import { groupAdminMessageConversations } from "../src/admin/data/message-conversations.ts";
import { buildOverviewWorkItems } from "../src/admin/data/overview-work-items.ts";
import { learnCategoryStatusUpdate } from "../src/admin/data/learn-category-status.ts";

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
  assert.match(source, /onChange=\{\(event\) => void openThread\(event\.target\.value\)\}/);
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
    tickets: [
      { id: "ticket", userId: "client", subject: "Needs help", status: "escalated" },
      { id: "resolved", userId: "client", subject: "Done", status: "resolved" },
    ],
    health: [
      { id: "api", name: "API", status: "down", latencyMs: 100, updatedAt: "2026-10-22T00:00:00Z" },
      { id: "db", name: "SQLite", status: "ok", latencyMs: 1, updatedAt: "2026-10-22T00:00:00Z" },
    ],
    access: { kyc: true, withdrawals: false, support: true, health: true },
  });

  assert.deepEqual(
    items.map(({ id }) => id),
    ["kyc:kyc", "ticket:ticket", "health:api"],
  );
});
