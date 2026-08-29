import axios from 'axios';

// Local wallet-auth verification uses the existing non-production backend
// tunnel. Keep explicit deployment configuration authoritative, but do not
// route a local production build's wallet challenge back to the frontend's
// own `/api` path.
const isLocalBrowser = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const defaultApiBase = isLocalBrowser || process.env.NODE_ENV !== 'production'
  ? 'http://127.0.0.1:3200'
  : '/api';

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiBase;

const api = axios.create({
  baseURL: apiBaseUrl,
  // Prevent reference panels and authenticated reloads from remaining in a
  // perpetual LOADING state when the staging tunnel drops a request.
  timeout: 15_000,
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const requestPath = config.url ?? '';
    const token = requestPath.startsWith('/admin')
      ? localStorage.getItem('admin_token')
      : localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
