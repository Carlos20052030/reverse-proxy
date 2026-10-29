import { useNavigate } from 'react-router-dom';

/**
 * Centralized API client with global 401 interceptor.
 * Handles token management and automatic redirect on unauthorized access.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

let navigateRef: ReturnType<typeof useNavigate> | null = null;

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
 * Clears auth state and redirects to login
 */
function handleUnauthorized() {
  localStorage.removeItem('token');
  if (navigateRef) {
    navigateRef('/login');
  } else {
    window.location.href = '/login';
  }
}

/**
 * Core fetch wrapper with global 401 interceptor
 */
async function apiFetch(endpoint: string, options: RequestOptions = {}) {
  const { requiresAuth = true, headers = {}, ...fetchOptions } = options;

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  // Global 401 interceptor
  if (response.status === 401) {
    handleUnauthorized();
    // Throw an error to stop further processing
    throw new Error('Unauthorized - redirected to login');
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