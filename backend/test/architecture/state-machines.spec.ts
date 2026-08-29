import { assertTransition, BINARY_TRANSITIONS, LOAN_TRANSITIONS, MARKET_TRANSITIONS, MINING_TRANSITIONS, SETTLEMENT_TRANSITIONS, SPOT_TRANSITIONS } from '../../src/authority/state-machines';

describe('NEXI state machines', () => {
  it('accepts required forward transitions', () => {
    expect(() => assertTransition(MARKET_TRANSITIONS, 'LOADING', 'LIVE')).not.toThrow();
    expect(() => assertTransition(SPOT_TRANSITIONS, 'OPEN', 'FILLED')).not.toThrow();
    expect(() => assertTransition(BINARY_TRANSITIONS, 'EXPIRED', 'SETTLEMENT_PENDING')).not.toThrow();
    expect(() => assertTransition(SETTLEMENT_TRANSITIONS, 'PROCESSING', 'COMPLETED')).not.toThrow();
    expect(() => assertTransition(LOAN_TRANSITIONS, 'ACTIVE', 'PAID')).not.toThrow();
    expect(() => assertTransition(MINING_TRANSITIONS, 'ACTIVE', 'COMPLETED')).not.toThrow();
  });
  it('rejects backward and duplicate terminal transitions', () => {
    expect(() => assertTransition(BINARY_TRANSITIONS, 'COMPLETED', 'OPEN')).toThrow();
    expect(() => assertTransition(SETTLEMENT_TRANSITIONS, 'COMPLETED', 'PROCESSING')).toThrow();
    expect(() => assertTransition(SPOT_TRANSITIONS, 'FILLED', 'OPEN')).toThrow();
  });
});
