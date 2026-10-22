import type { AdminMessage } from "@/admin/types";

export interface AdminMessageConversation {
  clientId: string;
  latestMessage: AdminMessage;
  unreadCount: number;
}

export function groupAdminMessageConversations(
  messages: AdminMessage[],
  actorId: string,
): AdminMessageConversation[] {
  if (!actorId) return [];

  const conversations = new Map<string, AdminMessageConversation>();
  for (const message of messages) {
    const clientId =
      message.senderId === actorId
        ? message.recipientId
        : message.recipientId === actorId
          ? message.senderId
          : null;
    if (!clientId || clientId === actorId) continue;

    const existing = conversations.get(clientId);
    if (!existing) {
      conversations.set(clientId, {
        clientId,
        latestMessage: message,
        unreadCount: message.recipientId === actorId && !message.readAt ? 1 : 0,
      });
      continue;
    }

    if (message.createdAt > existing.latestMessage.createdAt) existing.latestMessage = message;
    if (message.recipientId === actorId && !message.readAt) existing.unreadCount += 1;
  }

  return [...conversations.values()].sort((a, b) =>
    b.latestMessage.createdAt.localeCompare(a.latestMessage.createdAt),
  );
}
