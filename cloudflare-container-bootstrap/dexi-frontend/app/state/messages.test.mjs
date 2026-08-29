import test from 'node:test';
import assert from 'node:assert/strict';
import { messageFor } from './messages.ts';
import { SUPPORTED_LOCALES } from './locale.ts';

test('provides shell translations for every supported locale', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(messageFor(locale.code, 'dashboard').length > 0);
    assert.ok(messageFor(locale.code, 'quotesHub').length > 0);
    assert.ok(messageFor(locale.code, 'marketDataUnavailable').length > 0);
    assert.ok(messageFor(locale.code, 'openApplicationMenu').length > 0);
    assert.ok(messageFor(locale.code, 'languageSelection').length > 0);
    assert.ok(messageFor(locale.code, 'tradingWorkspace').length > 0);
  }
});
