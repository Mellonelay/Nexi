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

export async function closeMarginPosition(positionId: string, idempotencyKey: string) {
  const response = await api.post<MarginPositionResponse>(`/spot/margin/positions/${encodeURIComponent(positionId)}/close`, { positionId, idempotencyKey });
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
