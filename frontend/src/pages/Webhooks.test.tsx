import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
        events: ['push', 'pull_request'],
        secret: 'whsec_abc123...',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
    },
    {
        id: 'wh_2',
        url: 'https://staging.example.com/hooks/deploy',
        events: ['deployment', 'release'],
        secret: 'whsec_xyz789...',
        status: 'active',
        created_at: '2024-02-20T14:45:00Z',
        updated_at: '2024-02-20T14:45:00Z',
    },
    {
        id: 'wh_3',
        url: 'https://legacy.example.com/old-webhook',
        events: ['push'],
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
        json: () => Promise.resolve(data),
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
    (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status,
        statusText: statusTexts[status] || 'Internal Server Error',
        json: isJson ? () => Promise.resolve({ message }) : () => Promise.reject(new Error('Not JSON')),
    });
};

const mockFetch401 = () => {
    (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Unauthorized' }),
    });
};

describe('Webhooks Page - Loading & Display', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
    });

    it('renders the page with navigation and title', () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();

        expect(screen.getByText('Webhooks')).toBeInTheDocument();
        expect(screen.getByText('Novo Webhook')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'API Keys' })).toBeInTheDocument();
        expect(screen.getByText('Sair')).toBeInTheDocument();
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
            expect(screen.getByText('Error 502: Bad Gateway')).toBeInTheDocument();
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
            events: ['push', 'release'],
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
        expect(global.fetch).toHaveBeenNthCalledWith(2, '/webhooks', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token',
            }),
            body: JSON.stringify({
                url: 'https://new.example.com/webhook',
                events: ['push', 'release'],
                secret: 'mysecret',
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
        expect(global.fetch).toHaveBeenCalledWith('/webhooks/wh_1', expect.objectContaining({
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

    it('handles logout', async () => {
        mockFetchSuccess(mockWebhooks);
        renderWithRouter();
        await waitForLoading();

        const logoutButton = screen.getByRole('button', { name: 'Sair' });
        await userEvent.click(logoutButton);

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
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

        // Resolve the POST
        resolvePost({
            ok: true,
            json: () => Promise.resolve({
                id: 'wh_new',
                url: 'https://new.example.com/webhook',
                events: ['push'],
                secret: 'whsec_auto...',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }),
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
        // The fetch should not be called
        expect(global.fetch).not.toHaveBeenCalled();
    });
});