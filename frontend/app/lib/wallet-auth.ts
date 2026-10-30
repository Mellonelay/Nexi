import api from './api';
import {
  clearAuthSession,
  getAccessToken,
  getAccessTokenPrincipalId,
  setAuthSession,
  setSessionUser,
  type AuthSessionPayload,
} from './auth-session';

export function sessionPrincipalId(): string | null {
  return getAccessTokenPrincipalId();
}

export interface ReferralProfile {
  referralCode: string;
  referralCount: number;
  totalEarnings: string;
  referredByUserCode: number | null;
}

export interface VipProfile {
  level: number;
  name: string;
  progress: string;
  threshold: string;
  benefits: unknown;
  evaluatedAt: string;
  qualifiedAt: string | null;
}

export interface WalletProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  walletAddress: string | null;
  chainId: number | null;
  kycStatus: string;
  referral?: ReferralProfile | null;
  vip?: VipProfile | null;
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

const REFERRAL_STORAGE_KEY = 'nexi:referral-code';

export function captureReferralCode() {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('ref')?.trim();
  if (fromUrl) window.localStorage.setItem(REFERRAL_STORAGE_KEY, fromUrl);
  return fromUrl || window.localStorage.getItem(REFERRAL_STORAGE_KEY);
}

export function clearReferralCode() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
}

export function setWalletSession(payload: AuthSessionPayload) {
  setAuthSession(payload);
}

export function clearWalletSession() {
  clearAuthSession();
}

export async function requestWalletChallenge(address: string, chainId: number) {
  const response = await api.post<WalletChallenge>('/auth/wallet/challenge', { address, chainId });
  return response.data;
}

export async function verifyWalletChallenge(message: string, signature: string, referralCode?: string | null) {
  const response = await api.post<AuthSessionPayload & { profile: WalletProfile }>('/auth/wallet/verify', {
    message,
    signature,
    ...(referralCode?.trim() ? { referralCode: referralCode.trim() } : {}),
  });
  return response.data;
}

export async function loadCurrentUser() {
  const response = await api.get<WalletProfile>('/auth/me');
  setSessionUser(response.data);
  return response.data;
}

export async function logoutWallet() {
  try { await api.post('/auth/logout'); } finally { clearWalletSession(); }
}
