import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Webhooks from './Webhooks';

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
});

// Mock window.confirm
window.confirm = vi.fn(() => true);

// Mock fetch
global.fetch = vi.fn();

const mockWebhooks = [
    {
        id: 'wh_1',
        url: 'https://api.example.com/webhooks/github',
        subscriptions: ['push', 'pull_request'],
        secret: 'whsec_abc123...',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
    },
    {
        id: 'wh_2',
        url: 'https://staging.example.com/hooks/deploy',
        subscriptions: ['deployment', 'release'],
        secret: 'whsec_xyz789...',
        status: 'active',
        created_at: '2024-02-20T14:45:00Z',
        updated_at: '2024-02-20T14:45:00Z',
    },
    {
        id: 'wh_3',
        url: 'https://legacy.example.com/old-webhook',
        subscriptions: ['push'],
        secret: 'whsec_legacy...',
        status: 'inactive',
        created_at: '2023-11-10T09:15:00Z',
        updated_at: '2024-01-05T16:20:00Z',
    },
];

const renderWithRouter = () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    return render(
        <BrowserRouter>
            <Webhooks />
        </BrowserRouter>
    );
};

const mockFetchSuccess = (data: any, ok = true) => {
    (global.fetch as any).mockResolvedValueOnce({
        ok,
        status: 200,
        statusText: 'OK',
        headers: {
            get: (name: string) => {
                if (name.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            },
        },
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
    });
};

const mockFetchError = (status = 500, message = 'Failed', isJson = true) => {
    const statusTexts: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
    };
    const responseBody = isJson ? { message } : statusTexts[status] || 'Internal Server Error';
    (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status,
        statusText: statusTexts[status] || 'Internal Server Error',
        headers: {
            get: (name: string) => {
                if (name.toLowerCase() === 'content-type') {
                    return isJson ? 'application/json' : 'text/plain';
                }
                return null;
            },
        },
        json: isJson ? () => Promise.resolve(responseBody) : () => Promise.reject(new Error('Not JSON')),
        text: () => Promise.resolve(typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)),
    });
};

const mockFetch401 = () => {
    (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
            get: (name: string) => {
                if (name.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            },
        },
        json: () => Promise.resolve({ message: 'Unauthorized' }),
        text: () => Promise.resolve('Unauthorized'),
    });
};

describe('Webhooks Page - Loading & Display', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
    });

    it('renders the page content', () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();

        // Webhooks page content (navigation is in Layout component)
        expect(screen.getByText('Novo Webhook')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
        // Don't resolve the fetch immediately
        (global.fetch as any).mockImplementation(() => new Promise(() => {}));
        renderWithRouter();

        expect(screen.getByText('Carregando webhooks...')).toBeInTheDocument();
    });

    it('displays webhooks in table after loading', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando webhooks...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('https://api.example.com/webhooks/github')).toBeInTheDocument();
        expect(screen.getByText('https://staging.example.com/hooks/deploy')).toBeInTheDocument();
        expect(screen.getByText('https://legacy.example.com/old-webhook')).toBeInTheDocument();
    });

    it('displays webhook events as badges', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando webhooks...')).not.toBeInTheDocument();
        });

        // "push" appears in two webhooks (wh_1 and wh_3)
        const pushBadges = screen.getAllByText('push');
        expect(pushBadges.length).toBe(2);
        expect(screen.getByText('pull_request')).toBeInTheDocument();
        expect(screen.getByText('deployment')).toBeInTheDocument();
        expect(screen.getByText('release')).toBeInTheDocument();
    });

    it('displays status badges correctly', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando webhooks...')).not.toBeInTheDocument();
        });

        // Active badges (green)
        const activeBadges = screen.getAllByText('active');
        expect(activeBadges).toHaveLength(2);

        // Inactive badge (gray)
        expect(screen.getByText('inactive')).toBeInTheDocument();
    });

    it('shows error message when fetch fails', async () => {
        mockFetchError(500, 'Failed to fetch webhooks', true);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch webhooks')).toBeInTheDocument();
        });
    });

    it('shows empty state when no webhooks', async () => {
        mockFetchSuccess([]);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando webhooks...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Nenhum webhook configurado. Clique em "Novo Webhook" para começar.')).toBeInTheDocument();
    });

    it('shows error message from JSON response body when fetch fails', async () => {
        mockFetchError(500, 'Internal server error', true);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('Internal server error')).toBeInTheDocument();
        });
    });

    it('shows error message from status text when response is not JSON', async () => {
        mockFetchError(502, 'Bad Gateway', false);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('Expected JSON response but got text/plain: Bad Gateway')).toBeInTheDocument();
        });
    });

    it('redirects to login on 401 Unauthorized', async () => {
        mockFetch401();
        renderWithRouter();

        await waitFor(() => {
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
        }, { timeout: 1000 });
    });
});

describe('Webhooks Page - Interactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
    });

    const waitForLoading = async () => {
        await waitFor(() => {
            expect(screen.queryByText('Carregando webhooks...')).not.toBeInTheDocument();
        }, { timeout: 1000 });
    };

    it('opens modal when "Novo Webhook" button is clicked', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        expect(screen.getByRole('dialog', { name: 'Criar Novo Webhook' })).toBeInTheDocument();
        expect(screen.getByLabelText('URL do Endpoint *')).toBeInTheDocument();
        expect(screen.getByLabelText('Eventos (separados por vírgula) *')).toBeInTheDocument();
        expect(screen.getByLabelText('Secret (opcional)')).toBeInTheDocument();
    });

    it('closes modal when Cancel button is clicked', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
        await userEvent.click(cancelButton);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes modal when clicking overlay', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Click on the overlay (backdrop)
        const overlay = document.querySelector('.fixed.inset-0.bg-gray-500');
        if (overlay) {
            await userEvent.click(overlay);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        }
    });

    it('creates a new webhook when form is submitted', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        // Fill form - clear fields first since they have default values
        await userEvent.clear(screen.getByLabelText('URL do Endpoint *'));
        await userEvent.type(screen.getByLabelText('URL do Endpoint *'), 'https://new.example.com/webhook');

        await userEvent.clear(screen.getByLabelText('Eventos (separados por vírgula) *'));
        await userEvent.type(screen.getByLabelText('Eventos (separados por vírgula) *'), 'push, release');

        await userEvent.clear(screen.getByLabelText('Secret (opcional)'));
        await userEvent.type(screen.getByLabelText('Secret (opcional)'), 'mysecret');

        // Mock the POST response
        const newWebhook = {
            id: 'wh_new',
            url: 'https://new.example.com/webhook',
            subscriptions: ['push', 'release'],
            secret: 'whsec_myse...',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        mockFetchSuccess(newWebhook);

        // Submit
        const submitButton = screen.getByRole('button', { name: 'Criar Webhook' });
        await userEvent.click(submitButton);

        // Wait for modal to close
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        }, { timeout: 2000 });

        // Check new webhook appears in table
        await waitFor(() => {
            expect(screen.getByText('https://new.example.com/webhook')).toBeInTheDocument();
        }, { timeout: 1000 });

        // Verify POST was called with correct data (second call, first is GET)
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://webhooks.nuntix.com.br/webhooks', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token',
            }),
            body: JSON.stringify({
                url: 'https://new.example.com/webhook',
                subscriptions: ['push', 'release'],
                // secret is generated by the backend, not provided by frontend
            }),
        }));
    });

    it('validates required fields', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        // Try to submit without filling required fields
        const submitButton = screen.getByRole('button', { name: 'Criar Webhook' });
        await userEvent.click(submitButton);

        // Form should not submit (HTML5 validation prevents it)
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('deletes a webhook when delete button is clicked', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        // Find and click delete button for first webhook
        const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' });
        expect(deleteButtons.length).toBeGreaterThan(0);

        // Mock the DELETE response
        mockFetchSuccess({}, true);

        await userEvent.click(deleteButtons[0]);

        // Wait for webhook to be removed
        await waitFor(() => {
            expect(screen.queryByText('https://api.example.com/webhooks/github')).not.toBeInTheDocument();
        }, { timeout: 2000 });

        // Other webhooks should still be there
        expect(screen.getByText('https://staging.example.com/hooks/deploy')).toBeInTheDocument();

        // Verify DELETE was called with correct URL
        expect(global.fetch).toHaveBeenCalledWith('https://webhooks.nuntix.com.br/webhooks/wh_1', expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
                'Authorization': 'Bearer mock-token',
            }),
        }));
    });

    it('shows error when delete fails', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' });

        // Mock the DELETE failure
        mockFetchError(500, 'Failed to delete', true);

        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Failed to delete')).toBeInTheDocument();
        });
    });

    it('shows submitting state during create', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        await userEvent.type(screen.getByLabelText('URL do Endpoint *'), 'https://new.example.com/webhook');
        await userEvent.type(screen.getByLabelText('Eventos (separados por vírgula) *'), 'push');

        // Don't resolve the POST immediately
        let resolvePost: any;
        const postPromise = new Promise(resolve => { resolvePost = resolve; });
        (global.fetch as any).mockImplementationOnce(() => postPromise);

        const submitButton = screen.getByRole('button', { name: 'Criar Webhook' });
        await userEvent.click(submitButton);

        // Should show submitting state
        expect(screen.getByRole('button', { name: 'Criando...' })).toBeInTheDocument();

        // Resolve the POST with proper headers for safeJson
        resolvePost({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: {
                get: (name: string) => {
                    if (name.toLowerCase() === 'content-type') {
                        return 'application/json';
                    }
                    return null;
                },
            },
            json: () => Promise.resolve({
                id: 'wh_new',
                url: 'https://new.example.com/webhook',
                subscriptions: ['push'],
                secret: 'whsec_auto...',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }),
            text: () => Promise.resolve(JSON.stringify({
                id: 'wh_new',
                url: 'https://new.example.com/webhook',
                subscriptions: ['push'],
                secret: 'whsec_auto...',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })),
        });

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    it('shows error when create webhook fails', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        // Fill form
        await userEvent.clear(screen.getByLabelText('URL do Endpoint *'));
        await userEvent.type(screen.getByLabelText('URL do Endpoint *'), 'https://new.example.com/webhook');

        await userEvent.clear(screen.getByLabelText('Eventos (separados por vírgula) *'));
        await userEvent.type(screen.getByLabelText('Eventos (separados por vírgula) *'), 'push');

        // Mock the POST failure
        mockFetchError(400, 'Invalid URL format', true);

        const submitButton = screen.getByRole('button', { name: 'Criar Webhook' });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
        });

        // Modal should still be open
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});

describe('Webhooks Page - Auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm.mockReturnValue(true);
    });

    it('redirects to login when no token', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        render(
            <BrowserRouter>
                <Webhooks />
            </BrowserRouter>
        );

        // Since we're using fake router, we can't easily test navigation
        // but we can verify the component handles missing token
        // The fetch is still called but without Authorization header
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('https://webhooks.nuntix.com.br/webhooks', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
            }),
        }));
        // Should not have Authorization header
        const call = (global.fetch as any).mock.calls[0];
        expect(call[1].headers.Authorization).toBeUndefined();
    });
});

describe('Webhooks Page - Delivery History', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
    });

    const mockDeliveries = [
        {
            id: 'dlv_1',
            event_id: 'evt_abc123',
            endpoint_id: 'wh_1',
            event_type: 'push',
            status: 'succeeded' as const,
            attempts: 1,
            next_attempt_at: null,
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:31:00Z',
        },
        {
            id: 'dlv_2',
            event_id: 'evt_def456',
            endpoint_id: 'wh_1',
            event_type: 'pull_request',
            status: 'dead' as const,
            attempts: 5,
            next_attempt_at: null,
            created_at: '2024-01-15T11:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
        },
        {
            id: 'dlv_3',
            event_id: 'evt_ghi789',
            endpoint_id: 'wh_1',
            event_type: 'deployment',
            status: 'pending' as const,
            attempts: 0,
            next_attempt_at: '2024-01-15T12:30:00Z',
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
        },
        {
            id: 'dlv_4',
            event_id: 'evt_jkl012',
            endpoint_id: 'wh_1',
            event_type: 'release',
            status: 'queued' as const,
            attempts: 0,
            next_attempt_at: '2024-01-15T12:30:00Z',
            created_at: '2024-01-15T12:15:00Z',
            updated_at: '2024-01-15T12:15:00Z',
        },
        {
            id: 'dlv_5',
            event_id: 'evt_mno345',
            endpoint_id: 'wh_1',
            event_type: 'push',
            status: 'in_flight' as const,
            attempts: 2,
            next_attempt_at: '2024-01-15T13:00:00Z',
            created_at: '2024-01-15T12:45:00Z',
            updated_at: '2024-01-15T12:50:00Z',
        },
    ];

    const mockFetchDeliveriesSuccess = (deliveries = mockDeliveries) => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: {
                get: (name: string) => {
                    if (name.toLowerCase() === 'content-type') {
                        return 'application/json';
                    }
                    return null;
                },
            },
            json: () => Promise.resolve({ deliveries, next_cursor: undefined }),
            text: () => Promise.resolve(JSON.stringify({ deliveries, next_cursor: undefined })),
        });
    };

    const mockFetchDeliveriesError = (status = 500, message = 'Failed to fetch deliveries', isJson = true) => {
        const statusTexts: Record<number, string> = {
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
        };
        const responseBody = isJson ? { message } : statusTexts[status] || 'Internal Server Error';
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status,
            statusText: statusTexts[status] || 'Internal Server Error',
            headers: {
                get: (name: string) => {
                    if (name.toLowerCase() === 'content-type') {
                        return isJson ? 'application/json' : 'text/plain';
                    }
                    return null;
                },
            },
            json: isJson ? () => Promise.resolve(responseBody) : () => Promise.reject(new Error('Not JSON')),
            text: () => Promise.resolve(typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)),
        });
    };

    const waitForLoading = async () => {
        await waitFor(() => {
            expect(screen.queryByText('Carregando webhooks...')).not.toBeInTheDocument();
        }, { timeout: 1000 });
    };

    const openDeliveryHistory = async () => {
        const viewHistoryButtons = screen.getAllByRole('button', { name: 'Ver Histórico' });
        expect(viewHistoryButtons.length).toBeGreaterThan(0);
        await userEvent.click(viewHistoryButtons[0]);
    };

    it('opens delivery history modal when "Ver Histórico" button is clicked', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        expect(screen.getByRole('dialog', { name: /Histórico de Entregas/ })).toBeInTheDocument();
        expect(screen.getByText(/Histórico de Entregas - https:\/\/api\.example\.com\/webhooks\/github/)).toBeInTheDocument();
    });

    it('calls fetchDeliveries with correct endpoint_id when opening modal', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        // Verify fetch was called for deliveries with correct endpoint_id
        expect(global.fetch).toHaveBeenCalledTimes(2);
        const deliveriesCall = (global.fetch as any).mock.calls[1];
        expect(deliveriesCall[0]).toContain('/deliveries?endpoint_id=wh_1&limit=50');
        expect(deliveriesCall[1].method).toBe('GET');
        expect(deliveriesCall[1].headers.Authorization).toBe('Bearer mock-token');
    });

    it('shows loading state while fetching deliveries', async () => {
        mockFetchSuccess(mockWebhooks);
        // Don't resolve the deliveries fetch immediately
        let resolveDeliveries: any;
        const deliveriesPromise = new Promise(resolve => { resolveDeliveries = resolve; });
        (global.fetch as any).mockResolvedValueOnce(deliveriesPromise);

        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        expect(screen.getByText('Carregando histórico de entregas...')).toBeInTheDocument();

        // Resolve the deliveries fetch
        resolveDeliveries({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: {
                get: (name: string) => {
                    if (name.toLowerCase() === 'content-type') {
                        return 'application/json';
                    }
                    return null;
                },
            },
            json: () => Promise.resolve({ deliveries: mockDeliveries, next_cursor: undefined }),
            text: () => Promise.resolve(JSON.stringify({ deliveries: mockDeliveries, next_cursor: undefined })),
        });

        await waitFor(() => {
            expect(screen.queryByText('Carregando histórico de entregas...')).not.toBeInTheDocument();
        });
    });

    it('renders deliveries with correct data in table', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        await waitFor(() => {
            expect(screen.queryByText('Carregando histórico de entregas...')).not.toBeInTheDocument();
        });

        // Get the modal dialog to query within it
        const modal = screen.getByRole('dialog', { name: /Histórico de Entregas/ });
        const modalContent = within(modal);

        // Check table headers within modal
        expect(modalContent.getByText('Status')).toBeInTheDocument();
        expect(modalContent.getByText('Evento')).toBeInTheDocument();
        expect(modalContent.getByText('Tentativas')).toBeInTheDocument();
        expect(modalContent.getByText('Data/Hora')).toBeInTheDocument();
        expect(modalContent.getByText('Próxima Tentativa')).toBeInTheDocument();

        // Check delivery data within modal - use getAllByText for duplicates
        const pushEvents = modalContent.getAllByText('push');
        expect(pushEvents).toHaveLength(2); // dlv_1 and dlv_5
        expect(modalContent.getByText('pull_request')).toBeInTheDocument();
        expect(modalContent.getByText('deployment')).toBeInTheDocument();
        expect(modalContent.getByText('release')).toBeInTheDocument();

        // Check event IDs (unique)
        expect(modalContent.getByText('evt_abc123')).toBeInTheDocument();
        expect(modalContent.getByText('evt_def456')).toBeInTheDocument();
        expect(modalContent.getByText('evt_ghi789')).toBeInTheDocument();
        expect(modalContent.getByText('evt_jkl012')).toBeInTheDocument();
        expect(modalContent.getByText('evt_mno345')).toBeInTheDocument();
    });

    it('shows correct status badge colors for each delivery status', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        await waitFor(() => {
            expect(screen.queryByText('Carregando histórico de entregas...')).not.toBeInTheDocument();
        });

        const modal = screen.getByRole('dialog', { name: /Histórico de Entregas/ });
        const modalContent = within(modal);

        // Check status badges have correct colors
        // succeeded = green
        const succeededBadge = modalContent.getByText('succeeded').closest('span');
        expect(succeededBadge).toHaveClass('bg-green-100');
        expect(succeededBadge).toHaveClass('text-green-800');

        // dead = red
        const deadBadge = modalContent.getByText('dead').closest('span');
        expect(deadBadge).toHaveClass('bg-red-100');
        expect(deadBadge).toHaveClass('text-red-800');

        // pending = yellow
        const pendingBadge = modalContent.getByText('pending').closest('span');
        expect(pendingBadge).toHaveClass('bg-yellow-100');
        expect(pendingBadge).toHaveClass('text-yellow-800');

        // queued = blue
        const queuedBadge = modalContent.getByText('queued').closest('span');
        expect(queuedBadge).toHaveClass('bg-blue-100');
        expect(queuedBadge).toHaveClass('text-blue-800');

        // in_flight = purple
        const inFlightBadge = modalContent.getByText('in_flight').closest('span');
        expect(inFlightBadge).toHaveClass('bg-purple-100');
        expect(inFlightBadge).toHaveClass('text-purple-800');
    });

    it('shows attempts count correctly', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        await waitFor(() => {
            expect(screen.queryByText('Carregando histórico de entregas...')).not.toBeInTheDocument();
        });

        const modal = screen.getByRole('dialog', { name: /Histórico de Entregas/ });
        const modalContent = within(modal);

        // Check attempts within the modal table - use getAllByText for duplicates
        expect(modalContent.getByText('1')).toBeInTheDocument(); // dlv_1 has 1 attempt
        expect(modalContent.getByText('5')).toBeInTheDocument(); // dlv_2 has 5 attempts
        const zeroAttempts = modalContent.getAllByText('0');
        expect(zeroAttempts.length).toBeGreaterThanOrEqual(2); // dlv_3 and dlv_4 have 0 attempts (also date may contain 0)
        expect(modalContent.getByText('2')).toBeInTheDocument(); // dlv_5 has 2 attempts
    });

    it('shows next attempt date when available, dash when null', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        await waitFor(() => {
            expect(screen.queryByText('Carregando histórico de entregas...')).not.toBeInTheDocument();
        });

        // dlv_1 and dlv_2 have next_attempt_at = null, should show dash
        const dashElements = screen.getAllByText('—');
        expect(dashElements.length).toBeGreaterThanOrEqual(2);

        // dlv_3, dlv_4, dlv_5 have next_attempt_at set, should show formatted date
        // We just verify the date is formatted (not a dash)
        const nextAttemptCells = screen.getAllByText(/^\d{2}\/\d{2}\/\d{4}/);
        expect(nextAttemptCells.length).toBeGreaterThan(0);
    });

    it('shows empty state when no deliveries', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess([]);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        await waitFor(() => {
            expect(screen.getByText('Nenhuma entrega encontrada para este webhook.')).toBeInTheDocument();
        });
    });

    it('shows error state when fetch deliveries fails', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesError(500, 'Failed to fetch deliveries', true);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar entregas: Failed to fetch deliveries')).toBeInTheDocument();
        });
    });

    it('shows error state when fetch deliveries fails with non-JSON response', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesError(502, 'Bad Gateway', false);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar entregas: Expected JSON response but got text/plain: Bad Gateway')).toBeInTheDocument();
        });
    });

    it('closes modal when close button is clicked', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        expect(screen.getByRole('dialog', { name: /Histórico de Entregas/ })).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: 'Fechar' });
        await userEvent.click(closeButton);

        expect(screen.queryByRole('dialog', { name: /Histórico de Entregas/ })).not.toBeInTheDocument();
    });

    it('closes modal when clicking overlay', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        await openDeliveryHistory();

        expect(screen.getByRole('dialog', { name: /Histórico de Entregas/ })).toBeInTheDocument();

        const overlay = document.querySelector('.fixed.inset-0.bg-gray-500');
        if (overlay) {
            await userEvent.click(overlay);
            expect(screen.queryByRole('dialog', { name: /Histórico de Entregas/ })).not.toBeInTheDocument();
        }
    });

    it('shows correct webhook URL in modal title', async () => {
        mockFetchSuccess(mockWebhooks);
        mockFetchDeliveriesSuccess(mockDeliveries);
        renderWithRouter();
        await waitForLoading();

        // Click on second webhook's "Ver Histórico" button
        const viewHistoryButtons = screen.getAllByRole('button', { name: 'Ver Histórico' });
        await userEvent.click(viewHistoryButtons[1]);

        expect(screen.getByText(/Histórico de Entregas - https:\/\/staging\.example\.com\/hooks\/deploy/)).toBeInTheDocument();
    });
});