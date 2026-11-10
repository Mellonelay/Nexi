import api from './api';

export type MarginDirection = 'LONG' | 'SHORT';
export type MarginLeverage = number;

export interface MarginPositionResponse {
  id: string;
  accountId?: string;
  pair?: string;
  direction: MarginDirection;
  leverage: MarginLeverage;
  collateral: string;
  quantity: string;
  entryPrice: string;
  markPrice: string | null;
  unrealizedPnl: string;
  status: 'PENDING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'LIQUIDATED';
  openIdempotencyKey?: string;
  openedAt: string;
  closedAt: string | null;
  state?: string;
}

export interface MarginQuoteResponse {
  pair: string;
  state: 'LIVE';
  price: string;
  quoteId: string;
  provider: string;
  source: string;
  observedAt: string | null;
  receivedAt: string;
  maintenanceRatio: string;
  leverageOptions: number[];
}

export async function getMarginQuote(pair: string) {
  const response = await api.get<MarginQuoteResponse>('/spot/margin/quote', { params: { pair } });
  return response.data;
}

export async function openMarginPosition(input: { pair: string; direction: MarginDirection; leverage: MarginLeverage; collateral: string; idempotencyKey: string }) {
  const response = await api.post<MarginPositionResponse>('/spot/margin/positions', input);
  return response.data;
}

// A close can remain CLOSING while its matching order is unfilled. The
// acknowledgement is not necessarily a full persisted position projection.
export interface MarginCloseResponse {
  positionId: string;
  state: 'CLOSING' | 'CLOSED' | 'LIQUIDATED';
  replayed?: boolean;
  orderId?: string;
  closeOrderId?: string;
}

export interface MarginExitIntentReadback {
  positionId: string;
  state: 'PENDING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'LIQUIDATED';
  confirmed: boolean;
}

export async function getMarginExitIntent(
  positionId: string,
  idempotencyKey: string,
  operation: 'close' | 'cancel-pending',
) {
  const response = await api.get<MarginExitIntentReadback>(
    `/spot/margin/positions/${encodeURIComponent(positionId)}/exit-intent`,
    { params: { idempotencyKey, operation } },
  );
  return response.data;
}

export async function closeMarginPosition(positionId: string, idempotencyKey: string) {
  const response = await api.post<MarginCloseResponse>(`/spot/margin/positions/${encodeURIComponent(positionId)}/close`, { positionId, idempotencyKey });
  return response.data;
}

export interface CancelPendingMarginPositionResponse {
  positionId: string;
  state: 'CLOSED';
  replayed: boolean;
  repayment?: unknown;
}

export async function cancelPendingMarginPosition(positionId: string, idempotencyKey: string) {
  const response = await api.post<CancelPendingMarginPositionResponse>(`/spot/margin/positions/${encodeURIComponent(positionId)}/cancel-pending`, { idempotencyKey });
  return response.data;
}

export async function listMarginPositions() {
  const response = await api.get<MarginPositionResponse[]>('/spot/margin/positions');
  return response.data;
}

export async function markMarginPosition(positionId: string) {
  const response = await api.post<MarginPositionResponse>('/spot/margin/positions/mark', { positionId, idempotencyKey: `margin:mark:${positionId}` });
  return response.data;
}
