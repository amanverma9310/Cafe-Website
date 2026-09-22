import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, { status = 0, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.isApiError = true;
  }
}

const FRIENDLY = {
  401: 'Please sign in to continue.',
  403: 'You do not have permission to do that.',
  404: 'That could not be found.',
  409: 'That conflicts with existing data.',
  413: 'That file is too large.',
  422: 'Please check the highlighted fields.',
  429: 'Too many requests. Please wait a moment and try again.',
};

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the HTTP-only session cookie
  timeout: 120_000,
  headers: { 'X-Requested-With': 'agama-web' },
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    let message = body?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'The request timed out. Please try again.';
      else if (!error.response) message = 'Cannot reach the server. Check your connection and try again.';
      else message = FRIENDLY[status] || (status >= 500 ? 'Something went wrong on our side. Please try again.' : 'The request failed.');
    }
    if (status === 401 && !error.config?.skipAuthEvent) window.dispatchEvent(new CustomEvent('agama:unauthorized'));
    return Promise.reject(new ApiError(message, { status, details: body?.details }));
  },
);

export const unwrap = (res) => res.data.data;
export const unwrapPage = (res) => ({ items: res.data.data, meta: res.data.meta });

/** multipart body: structured data goes in `payload` (JSON), files in named fields. */
export function buildForm(payload = {}, files = {}) {
  const fd = new FormData();
  fd.append('payload', JSON.stringify(payload));
  Object.entries(files).forEach(([name, file]) => file && fd.append(name, file));
  return fd;
}
