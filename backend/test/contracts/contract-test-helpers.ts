import { expect } from '@jest/globals';

export function expectAuthority(owner: string): void {
  expect(owner).toMatch(/^backend\//);
}

export function expectInvalidState<T extends string>(states: readonly T[]): void {
  const invalid = 'INVALID' as T;
  expect(states).not.toContain(invalid);
}

export function expectNoClientAuthority(value: Record<string, unknown>): void {
  expect(Object.keys(value)).not.toEqual(expect.arrayContaining([
    'clientPrice',
    'clientBalance',
    'clientOutcome',
    'clientPayout',
    'clientSettlement',
  ]));
}
