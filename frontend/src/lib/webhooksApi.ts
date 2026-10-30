import { useNavigate } from 'react-router-dom';

/**
 * Webhooks API client - uses relative path /api/webhooks
 * The reverse proxy routes /api/webhooks to the webhooks dispatcher backend.
 */

const WEBHOOKS_API_BASE_URL = '/api/webhooks';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

let navigateRef: ReturnType<typeof useNavigate> | null = null;

/**
 * Sets the navigate function for redirects (called from a component)
 */
export function setWebhooksNavigate(navigate: ReturnType<typeof useNavigate>) {
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
async function webhooksApiFetch(endpoint: string, options: RequestOptions = {}) {
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

  const response = await fetch(`${WEBHOOKS_API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  // Global 401 interceptor
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized - redirected to login');
  }

  return response;
}

/**
 * Convenience methods
 */
export const webhooksApi = {
  get: (endpoint: string, options?: RequestOptions) =>
    webhooksApiFetch(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body: unknown, options?: RequestOptions) =>
    webhooksApiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: (endpoint: string, body: unknown, options?: RequestOptions) =>
    webhooksApiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: (endpoint: string, body: unknown, options?: RequestOptions) =>
    webhooksApiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (endpoint: string, options?: RequestOptions) =>
    webhooksApiFetch(endpoint, { ...options, method: 'DELETE' }),

  setNavigate: setWebhooksNavigate,
};

export default webhooksApi;

export interface Delivery {
  id: string;
  event_id: string;
  endpoint_id: string;
  event_type: string;
  status: 'pending' | 'queued' | 'in_flight' | 'succeeded' | 'dead';
  attempts: number;
  next_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveriesResponse {
  deliveries: Delivery[];
  next_cursor?: string;
}

/**
 * Fetch deliveries for a specific webhook (endpoint)
 */
export async function fetchDeliveries(endpointId: string): Promise<DeliveriesResponse> {
  const res = await webhooksApi.get(`/deliveries?endpoint_id=${endpointId}&limit=50`);
  if (!res.ok) {
    const errorData = await safeJson(res);
    const errorMessage = typeof errorData === 'object' && errorData && 'message' in errorData
      ? String(errorData.message)
      : `Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMessage);
  }
  return safeJson<DeliveriesResponse>(res);
}

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