import { useNavigate } from 'react-router-dom';

/**
 * Centralized API client with global 401 interceptor and silent token refresh.
 * Handles token management, automatic refresh on 401, and redirect on unauthorized access.
 */

const API_BASE_URL = '';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  _retry?: boolean;
}

let navigateRef: ReturnType<typeof useNavigate> | null = null;
let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (value: Response) => void;
  reject: (reason: Error) => void;
}> = [];

/**
 * Sets the navigate function for redirects (called from a component)
 */
export function setNavigate(navigate: ReturnType<typeof useNavigate>) {
  navigateRef = navigate;
}

/**
 * Gets the current auth token from localStorage
 */
function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Gets the refresh token from localStorage
 */
function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

/**
 * Saves the access token to localStorage
 */
function setToken(token: string): void {
  localStorage.setItem('token', token);
}

/**
 * Saves the refresh token to localStorage
 */
function setRefreshToken(token: string): void {
  localStorage.setItem('refresh_token', token);
}

/**
 * Clears auth state and redirects to login
 */
function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  if (navigateRef) {
    navigateRef('/login');
  } else {
    window.location.href = '/login';
  }
}

/**
 * Processes the queue of failed requests after a successful token refresh
 */
function processQueue(error: Error | null, token: string | null = null) {
  failedRequestsQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as unknown as Response);
    }
  });
  failedRequestsQueue = [];
}

/**
 * Attempts to refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      setToken(data.access_token);
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
      }
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Core fetch wrapper with global 401 interceptor and silent token refresh
 */
async function apiFetch(endpoint: string, options: RequestOptions = {}): Promise<Response> {
  const { requiresAuth = true, _retry = false, headers = {}, ...fetchOptions } = options;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      (requestHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  // Debug: log the exact URL being requested
  console.log('[apiFetch] Request URL:', `${API_BASE_URL}${endpoint}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  // Global 401 interceptor with silent token refresh
  if (response.status === 401) {
    // Don't try to refresh the refresh endpoint itself to avoid infinite loops
    const isRefreshEndpoint = endpoint === '/api/auth/refresh';

    // If already retried, or it's the refresh endpoint, or no refresh token, redirect to login
    if (_retry || isRefreshEndpoint || !getRefreshToken()) {
      handleUnauthorized();
      throw new Error('Unauthorized - redirected to login');
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<Response>((resolve, reject) => {
        failedRequestsQueue.push({ resolve, reject });
      }).then((): Promise<Response> => {
        // Retry the original request with the new token
        return apiFetch(endpoint, { ...options, _retry: true });
      });
    }

    // Start the refresh process
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Refresh successful - process queued requests and retry the original
        processQueue(null, newToken);
        return apiFetch(endpoint, { ...options, _retry: true });
      } else {
        // Refresh failed - process queue with error and redirect to login
        const refreshError = new Error('Token refresh failed');
        processQueue(refreshError);
        handleUnauthorized();
        throw refreshError;
      }
    } catch (error) {
      // Any error during refresh - process queue with error and redirect
      const refreshError = error instanceof Error ? error : new Error('Token refresh failed');
      processQueue(refreshError);
      handleUnauthorized();
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

/**
 * Convenience methods
 */
export const api = {
  get: (endpoint: string, options?: RequestOptions) =>
    apiFetch(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body: unknown, options?: RequestOptions) =>
    apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: (endpoint: string, body: unknown, options?: RequestOptions) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: (endpoint: string, body: unknown, options?: RequestOptions) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (endpoint: string, options?: RequestOptions) =>
    apiFetch(endpoint, { ...options, method: 'DELETE' }),

  setNavigate,
};

export default api;

/**
 * Safely parse JSON response, checking content-type first
 */
export async function safeJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}: ${text.slice(0, 200)}`);
  }
  return response.json() as Promise<T>;
}