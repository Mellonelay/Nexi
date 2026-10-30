import axios, { type InternalAxiosRequestConfig } from 'axios';
import {
  clearAuthSession,
  getAccessToken,
  setAuthSession,
  type AuthSessionPayload,
} from './auth-session';

// Local wallet-auth verification uses a local NestJS API instance.
// Keep explicit deployment configuration authoritative, but do not
// route a local production build's wallet challenge back to the frontend's
// own `/api` path.
const isLocalBrowser = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const defaultApiBase = isLocalBrowser || process.env.NODE_ENV !== 'production'
  ? 'http://127.0.0.1:3200'
  : 'https://api.nexitrading.app';

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiBase;

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  // Bound API latency so reference panels and authenticated reloads can report failures.
  timeout: 15_000,
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { _nexiAuthRetry?: boolean };

let refreshPromise: Promise<boolean> | null = null;

async function recoverPublicSession(rejectedAuthorization?: string) {
  const token = getAccessToken();
  // A late 401 may belong to the token another request already renewed.
  if (token && `Bearer ${token}` !== rejectedAuthorization) return true;
  if (!refreshPromise) {
    refreshPromise = refreshClient.post<AuthSessionPayload>('/auth/refresh')
      .then((response) => {
        setAuthSession(response.data);
        return true;
      })
      .catch(() => {
        clearAuthSession();
        return false;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export { recoverPublicSession };

// Public access tokens are held only by the in-memory session boundary.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Cache-Control'] = 'no-cache';
    }
  }
  return config;
});

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error);
  const config = error.config as RetriableRequestConfig | undefined;
  const requestPath = config?.url ?? '';
  const isPublicAuthEndpoint = /^\/auth\/(login|signup|refresh|wallet(?:\/|$))/.test(requestPath);
  if (
    error.response?.status !== 401
    || !config
    || config._nexiAuthRetry
    || isPublicAuthEndpoint
  ) {
    return Promise.reject(error);
  }

  const recovered = await recoverPublicSession(config.headers.get('Authorization')?.toString());
  const token = getAccessToken();
  if (!recovered || !token) return Promise.reject(error);
  config._nexiAuthRetry = true;
  config.headers.Authorization = `Bearer ${token}`;
  return api(config);
});

export default api;
