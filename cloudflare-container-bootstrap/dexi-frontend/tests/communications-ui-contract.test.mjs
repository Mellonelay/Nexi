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
