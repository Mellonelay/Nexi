import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const header = readFileSync(new URL('app/components/AppHeader.tsx', root), 'utf8');
const panel = readFileSync(new URL('app/components/NotificationsPanel.tsx', root), 'utf8');

assert.match(header, /NotificationsPanel/);
assert.match(header, /aria-controls="nexi-notifications-panel"/);
assert.match(header, /setNotificationsOpen\(\(open\) => !open\)/);
assert.match(panel, /id="nexi-notifications-panel"/);
console.log('Notifications header wiring: PASS');
