export interface AuthSessionPayload {
  access_token: string;
  user?: unknown;
  profile?: unknown;
}

const SESSION_EVENT = 'nexi:wallet-session';

let accessToken: string | null = null;
let sessionUser: unknown = null;

function publishSessionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EVENT));
  }
}

export function setAuthSession(payload: AuthSessionPayload) {
  if (typeof payload?.access_token !== 'string' || payload.access_token.length === 0) {
    throw new Error('Authentication response did not include an access token');
  }
  accessToken = payload.access_token;
  sessionUser = payload.user ?? payload.profile ?? null;
  publishSessionChange();
}

export function setSessionUser(user: unknown) {
  sessionUser = user ?? null;
  publishSessionChange();
}

export function getAccessToken() {
  return accessToken;
}

export function getAccessTokenPrincipalId() {
  if (!accessToken) return null;
  try {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return null;
    const json = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - encodedPayload.length % 4) % 4));
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}

export function hasAuthSession() {
  return Boolean(accessToken);
}

export function getSessionUser<T = unknown>() {
  return sessionUser as T | null;
}

export function getSessionUserId() {
  if (!sessionUser || typeof sessionUser !== 'object') return null;
  const id = (sessionUser as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function clearAuthSession() {
  accessToken = null;
  sessionUser = null;
  publishSessionChange();
}
