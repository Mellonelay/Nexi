import api from './api';

export interface WalletProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  walletAddress: string | null;
  chainId: number | null;
  kycStatus: string;
}

export interface WalletChallenge {
  message: string;
  nonce: string;
  domain: string;
  uri: string;
  chainId: number;
  issuedAt: string;
  expirationTime: string;
}

export function setWalletSession(payload: { access_token: string; user?: unknown; profile?: WalletProfile }) {
  window.localStorage.setItem('token', payload.access_token);
  const sessionUser = payload.user ?? payload.profile;
  if (sessionUser) window.localStorage.setItem('user', JSON.stringify(sessionUser));
  window.dispatchEvent(new CustomEvent('nexi:wallet-session'));
}

export function clearWalletSession() {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('nexi:wallet-session'));
}

export async function requestWalletChallenge(address: string, chainId: number) {
  const response = await api.post<WalletChallenge>('/auth/wallet/challenge', { address, chainId });
  return response.data;
}

export async function verifyWalletChallenge(message: string, signature: string) {
  const response = await api.post<{ access_token: string; refresh_token?: string; user?: unknown; profile: WalletProfile }>('/auth/wallet/verify', { message, signature });
  return response.data;
}

export async function loadCurrentUser() {
  const response = await api.get<WalletProfile>('/auth/me');
  return response.data;
}

export async function logoutWallet() {
  try { await api.post('/auth/logout'); } finally { clearWalletSession(); }
}
