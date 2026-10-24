import type { AdminMessage } from "@/admin/types";

export interface AdminMessageConversation {
  conversationId: string;
  clientId: string;
  support: boolean;
  latestMessage: AdminMessage;
  unreadCount: number;
}

function clientIdForMessage(message: AdminMessage, actorId: string): string | null {
  if (message.supportCustomerId) return message.supportCustomerId;
  if (message.senderId === actorId) return message.recipientId;
  return message.recipientId === actorId ? message.senderId : null;
}

function isUnreadIncoming(message: AdminMessage, actorId: string, support: boolean): boolean {
  return !message.readAt && message.recipientId === (support ? "support:nexi" : actorId);
}

export function groupAdminMessageConversations(
  messages: AdminMessage[],
  actorId: string,
): AdminMessageConversation[] {
  if (!actorId) return [];

  const conversations = new Map<string, AdminMessageConversation>();
  for (const message of messages) {
    const support = !!message.supportCustomerId;
    const clientId = clientIdForMessage(message, actorId);
    if (!clientId || clientId === actorId) continue;

    const conversationId = message.conversationId ?? `legacy:${clientId}`;
    const key = support ? conversationId : `direct:${clientId}`;
    const existing = conversations.get(key);
    if (existing) {
      if (message.createdAt > existing.latestMessage.createdAt) existing.latestMessage = message;
      if (isUnreadIncoming(message, actorId, support)) existing.unreadCount += 1;
      continue;
    }
    conversations.set(key, {
      conversationId,
      clientId,
      support,
      latestMessage: message,
      unreadCount: isUnreadIncoming(message, actorId, support) ? 1 : 0,
    });
  }

  return [...conversations.values()].sort((a, b) =>
    b.latestMessage.createdAt.localeCompare(a.latestMessage.createdAt),
  );
}
