import { ParsedMessage } from '@spruceid/siwe-parser';
import { buildSiweMessage, isSiweOriginMatch, validateSiweOrigin } from './wallet-auth.service';

const base = {
  address: '0x0000000000000000000000000000000000000001',
  statement: 'Sign in to NEXI.',
  chainId: 11155111,
  nonce: '0123456789abcdef',
  issuedAt: '2026-08-05T00:00:00.000Z',
  expirationTime: '2026-08-05T00:05:00.000Z',
};

describe('wallet SIWE origin contract', () => {
  it('emits an explicit HTTP scheme for the active local development origin', () => {
    const origin = validateSiweOrigin('127.0.0.1:3000', 'http://127.0.0.1:3000');
    const parsed = new ParsedMessage(buildSiweMessage({ ...base, ...origin }));
    expect(parsed.scheme).toBe('http');
    expect(parsed.domain).toBe('127.0.0.1:3000');
    expect(parsed.uri).toBe('http://127.0.0.1:3000');
  });

  it('rejects HTTPS localhost when the approved origin is HTTP', () => {
    const approved = validateSiweOrigin('127.0.0.1:3000', 'http://127.0.0.1:3000');
    const requested = validateSiweOrigin('127.0.0.1:3000', 'https://127.0.0.1:3000');
    expect(isSiweOriginMatch(approved, requested)).toBe(false);
  });

  it('rejects localhost when 127.0.0.1 is approved', () => {
    expect(() => validateSiweOrigin('127.0.0.1:3000', 'http://localhost:3000')).toThrow();
  });

  it('preserves an HTTPS production origin', () => {
    expect(validateSiweOrigin('nexi.example.com', 'https://nexi.example.com')).toEqual({ scheme: 'https', domain: 'nexi.example.com', uri: 'https://nexi.example.com' });
  });

  it('does not accept an omitted SIWE scheme for the HTTP local case', () => {
    const message = buildSiweMessage({ ...base, domain: '127.0.0.1:3000', uri: 'http://127.0.0.1:3000', scheme: 'http' }).replace('http://127.0.0.1:3000 wants', '127.0.0.1:3000 wants');
    const parsed = new ParsedMessage(message);
    expect(parsed.scheme).toBeUndefined();
    expect(isSiweOriginMatch(validateSiweOrigin('127.0.0.1:3000', 'http://127.0.0.1:3000'), parsed)).toBe(false);
  });
});
