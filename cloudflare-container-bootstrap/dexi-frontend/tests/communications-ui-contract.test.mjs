import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => fs.readFileSync(new URL(relative, root), 'utf8');

test('communications tranche preserves truthful UI and mobile navigation contracts', () => {
  const support = read('./app/dashboard/support/page.tsx');
  const messages = read('./app/dashboard/messages/page.tsx');
  const announcements = read('./app/dashboard/announcement/page.tsx');
  const learn = read('./app/dashboard/learn/page.tsx');
  const notifications = read('./app/components/NotificationsPanel.tsx');

  assert.match(support, /Recent tickets/);
  assert.match(support, /Add attachment/);
  assert.match(messages, /Back to conversations/);
  assert.match(messages, /selected \? 'hidden lg:block'/);
  assert.match(announcements, /Back to announcements/);
  assert.match(announcements, /selected \? 'hidden lg:block'/);
  assert.match(learn, /Back to lessons/);
  assert.match(learn, /Media is not available for this lesson./);
  assert.match(notifications, /role="dialog"/);
  assert.match(notifications, /Retry/);
});


test('support exposes ticket timeline, reply, and realtime recovery', () => {
  const support = read('./app/dashboard/support/page.tsx');
  assert.match(support, /Ticket timeline/);
  assert.match(support, /encodeURIComponent\(selectedTicket\.id\).*\/replies/);
  assert.match(support, /apiBaseUrl \+ '\/communications'/);
  assert.match(support, /type\.startsWith\('SUPPORT_TICKET_'\)/);
  assert.match(support, /socket\.off\('communications\.event'/);
  assert.match(support, /socket\.disconnect\(\)/);
});


test('messages uses durable realtime recovery without synthetic archive state', () => {
  const messages = read('./app/dashboard/messages/page.tsx');
  assert.match(messages, /apiBaseUrl \+ '\/communications'/);
  assert.match(messages, /type === 'MESSAGE_SENT' \|\| type === 'MESSAGE_READ'/);
  assert.match(messages, /socket\.off\('communications\.event'/);
  assert.match(messages, /socket\.disconnect\(\)/);
  assert.doesNotMatch(messages, /ARCHIVED/);
  assert.match(messages, /\/communications\/conversations/);
  assert.doesNotMatch(messages, /function groupMessages/);
  assert.match(messages, /Report conversation/);
  assert.match(messages, /conversationEndpoint.*encodeURIComponent\(conversationId\).*report/);
});

test('announcements and learn send the active locale to canonical backend content endpoints', () => {
  const announcements = read('./app/dashboard/announcement/page.tsx');
  const learn = read('./app/dashboard/learn/page.tsx');
  assert.match(announcements, /useLocale/);
  assert.match(announcements, /params: \{ locale \}/);
  assert.match(learn, /useLocale/);
  assert.match(learn, /communications\/learn', \{ params: \{ locale \} \}/);
  assert.match(learn, /communications\/learn\/\$\{encodeURIComponent\(slug\)\}/);
});
