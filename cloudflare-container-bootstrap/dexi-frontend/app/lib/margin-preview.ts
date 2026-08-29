/**
 * Display-only margin estimate helpers.
 *
 * These helpers never open, close, mark, liquidate, or mutate a position.
 * Backend responses are the only source of financial truth.
 */
export type IsolatedDirection = 'LONG' | 'SHORT';
export type IsolatedLeverage = 2 | 3 | 5;
export type IsolatedPositionStatus = 'LOADING' | 'PENDING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'LIQUIDATED' | 'REJECTED' | 'UNAVAILABLE' | 'DISCONNECTED' | 'ERROR';

export interface IsolatedPosition {
  id: string;
  pair: string;
  direction: IsolatedDirection;
  leverage: IsolatedLeverage;
  collateral: number;
  positionSize: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number | null;
  unrealizedPnl: number;
  status: IsolatedPositionStatus;
  openedAt: string;
  closedAt: string | null;
}

export interface IsolatedCalc {
  positionSize: number | null;
  liquidationPrice: number | null;
  unrealizedPnl: number | null;
  isValid: boolean;
  validationError: string | null;
}

export function calcIsolated(collateralStr: string, leverage: IsolatedLeverage, direction: IsolatedDirection, entryPrice: number | null, markPrice: number | null, maintenanceRatio: number | null): IsolatedCalc {
  const collateral = Number(collateralStr);
  if (!Number.isFinite(collateral) || collateral <= 0) return { positionSize: null, liquidationPrice: null, unrealizedPnl: null, isValid: false, validationError: 'Enter a valid collateral amount.' };
  if (entryPrice === null || !Number.isFinite(entryPrice) || entryPrice <= 0) return { positionSize: null, liquidationPrice: null, unrealizedPnl: null, isValid: false, validationError: 'Market price unavailable — cannot calculate.' };
  const positionSize = (collateral * leverage) / entryPrice;
  const liquidationPrice = maintenanceRatio !== null && Number.isFinite(maintenanceRatio) && maintenanceRatio >= 0 && maintenanceRatio < 1
    ? direction === 'LONG'
      ? entryPrice * (1 - 1 / leverage + maintenanceRatio)
      : entryPrice * (1 + 1 / leverage - maintenanceRatio)
    : null;
  const mark = markPrice ?? entryPrice;
  const unrealizedPnl = (direction === 'LONG' ? mark - entryPrice : entryPrice - mark) * positionSize;
  return { positionSize, liquidationPrice, unrealizedPnl, isValid: true, validationError: null };
}

export function pnlDisplay(pnl: number | null): { text: string; className: string } {
  if (pnl === null) return { text: '—', className: 'text-[#8C8299]' };
  const sign = pnl >= 0 ? '+' : '';
  return { text: `${sign}${pnl.toFixed(4)} USDT`, className: pnl >= 0 ? 'text-[#22D3A6]' : 'text-[#FF5C7C]' };
}
