import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hapticFeedback } from './haptics.ts';

function installBrowserState({ hasBeenActive, reducedMotion = false, vibrate }) {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      vibrate,
      userActivation: { hasBeenActive },
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { matchMedia: () => ({ matches: reducedMotion }) },
  });
  return () => {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else delete globalThis.navigator;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete globalThis.window;
  };
}

test('haptics do not call the vibration API before the page has user activation', () => {
  let calls = 0;
  const restore = installBrowserState({ hasBeenActive: false, vibrate: () => calls++ });
  try {
    hapticFeedback('selection');
    assert.equal(calls, 0);
  } finally {
    restore();
  }
});

test('haptics retain the selected pattern after a user interaction', () => {
  const patterns = [];
  const restore = installBrowserState({
    hasBeenActive: true,
    vibrate: (pattern) => patterns.push(pattern),
  });
  try {
    hapticFeedback('confirm');
    assert.deepEqual(patterns, [14]);
  } finally {
    restore();
  }
});

test('haptics continue to respect reduced motion', () => {
  let calls = 0;
  const restore = installBrowserState({
    hasBeenActive: true,
    reducedMotion: true,
    vibrate: () => calls++,
  });
  try {
    hapticFeedback('warning');
    assert.equal(calls, 0);
  } finally {
    restore();
  }
});
