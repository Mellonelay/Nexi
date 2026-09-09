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
