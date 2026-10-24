import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => fs.readFileSync(new URL(relative, root), 'utf8');

test('support retains help topics and reads only configured contact entry points', () => {
  const support = read('./app/dashboard/support/page.tsx');
  assert.match(support, /Wallet operations/);
  assert.match(support, /Chat with NEXI/);
  assert.match(support, /api\.get<unknown>\('\/public\/config\/support'\)/);
  assert.match(support, /telegramUrl: string \| null; email: string \| null/);
  assert.match(support, /contacts\.telegramUrl &&/);
  assert.match(support, /contacts\.email &&/);
  assert.match(support, /import \{ LifeBuoy, Mail, Search, Send \}/);
  assert.doesNotMatch(support, /communications\/tickets|Recent tickets|Ticket timeline|Submit ticket/);
});

test('messages is one customer-service chat with an accessible history drawer', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /Nexi Customer Service/);
  assert.match(messages, /NexiLogoMark compact/);
  assert.match(messages, /setHistoryOpen\(true\)/);
  assert.match(messages, /<ModalSurface open=\{historyOpen\} onClose=\{\(\) => setHistoryOpen\(false\)\} title="Message history" align="left">/);
  assert.match(messages, /Local welcome · not sent by support/);
  assert.match(messages, /<LocalDateTime value=\{message\.createdAt\}/);
  assert.match(messages, /message\.readAt \? 'Read' : 'Sent'/);
  assert.doesNotMatch(messages, /recipientId|Report conversation|Conversation filters|Message summary/);
});

test('messages pages the canonical support thread and rejects stale session results', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /api\.get<unknown>\('\/communications\/support\/thread', \{ params: \{ page: pageNumber, limit: PAGE_SIZE \}, signal \}\)/);
  assert.match(messages, /const PAGE_SIZE = 100/);
  assert.match(messages, /stableConversationId !== page\.conversationId/);
  assert.match(messages, /if \(page\.messages\.length < PAGE_SIZE \|\| unseen\.length === 0\) break/);
  assert.match(messages, /generation !== loadGeneration\.current \|\| requestUserId !== userIdRef\.current/);
});

test('messages marks only unread incoming items and reconciles persisted read receipts', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /message\.senderId === requestUserId \|\| message\.readAt/);
  assert.match(messages, /api\.post<unknown>\(`\/communications\/messages\/\$\{encodeURIComponent\(message\.id\)\}\/read`, \{\}, \{ signal \}\)/);
  assert.match(messages, /readReceipt\(response\.data, message\.id\)/);
  assert.match(messages, /loaded\[index\] = \{ \.\.\.loaded\[index\], readAt \}/);
  assert.match(messages, /setMessages\(\(current\) => requestUserId === userIdRef\.current/);
  assert.match(messages, /sessionController\.current\?\.abort\(\)/);
  assert.match(messages, /readInFlight\.current\.has\(readKey\)/);
});

test('messages sends through the support route and reuses an idempotency key on retry', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /api\.post\('\/communications\/support\/messages'/);
  assert.match(messages, /attachmentIds: requestAttachments\.map\(\(item\) => item\.id\)/);
  assert.match(messages, /const idempotencyKey = pendingMessageKey \?\? globalThis\.crypto\?\.randomUUID/);
  assert.doesNotMatch(messages, /recipientId\s*[:,}]/);
  assert.match(messages, /Your draft is still here so you can retry/);
});

test('messages provides emoji insertion, multipart upload and authorized attachment reads', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /setEmojiOpen\(\(value\) => !value\)/);
  assert.match(messages, /fileInputRef\.current\?\.click\(\)/);
  assert.match(messages, /data\.append\('file', file\)/);
  assert.match(messages, /api\.post<unknown>\('\/communications\/support\/attachments', data\)/);
  assert.match(messages, /api\.get<Blob>\(`\/communications\/support\/attachments\/\$\{encodeURIComponent\(attachment\.id\)\}`/);
  assert.match(messages, /Preview image/);
  assert.match(messages, /<Image src=\{previewUrl\} alt=\{attachment\.name\}/);
  assert.match(messages, /URL\.revokeObjectURL\(url\)/);
});

test('support messages reacts to communication reconnects and avoids fake persisted greetings', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /type === 'MESSAGE_SENT' \|\| event\?\.type === 'MESSAGE_READ'/);
  assert.match(messages, /socket\.off\('communications\.event'/);
  assert.match(messages, /socket\.disconnect\(\)/);
  assert.doesNotMatch(messages, /ARCHIVED/);
});

test('messages reads the current session token for each realtime connection', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /auth: \(callback\) => callback\(\{ token: getAccessToken\(\) \}\)/);
  assert.doesNotMatch(messages, /auth: \{ token \}/);
});

test('announcements and learn send the active locale to canonical backend content endpoints', () => {
  const announcements = read('./app/dashboard/announcement/page.tsx');
  const learn = read('./app/dashboard/learn/page.tsx');
  const notifications = read('./app/components/NotificationsPanel.tsx');
  assert.match(announcements, /useLocale/);
  assert.match(announcements, /params: \{ locale \}/);
  assert.match(learn, /useLocale/);
  assert.match(learn, /communications\/learn', \{ params: \{ locale \} \}/);
  assert.match(learn, /communications\/learn\/\$\{encodeURIComponent\(slug\)\}/);
  assert.match(notifications, /role="dialog"/);
  assert.match(notifications, /Retry/);
});
