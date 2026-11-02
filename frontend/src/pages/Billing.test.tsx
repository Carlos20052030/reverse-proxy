import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Billing from './Billing';

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

// Mock window.location.href for redirect testing
const originalLocation = window.location;
Object.defineProperty(window, 'location', {
    value: {
        ...originalLocation,
        href: '',
    },
    writable: true,
});

const mockUsageData = {
    plan: 'free',
    period_end: '2024-12-31T23:59:59Z',
    requests: { used: 1500, limit: 10000 },
    webhooks: { used: 5, limit: 10 },
};

const mockUsageDataPro = {
    plan: 'pro',
    period_end: '2024-12-31T23:59:59Z',
    requests: { used: 50000, limit: 1000000 },
    webhooks: { used: 25, limit: 100 },
};

const mockCheckoutUrl = {
    url: 'https://checkout.stripe.com/pay/cs_test_123',
};

const renderWithRouter = () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    return render(
        <BrowserRouter>
            <Billing />
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

// Mock the refresh endpoint to return 401 (simulating expired refresh token)
const mockFetchRefresh401 = () => {
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
        json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        text: () => Promise.resolve('Invalid refresh token'),
    });
};

describe('Billing Page - Loading & Display', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
        window.location.href = '';
    });

    it('renders the page content', () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();

        expect(screen.getByText('Billing & Usage')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
        (global.fetch as any).mockImplementation(() => new Promise(() => {}));
        renderWithRouter();

        expect(screen.getByText('Carregando informações de faturamento...')).toBeInTheDocument();
    });

    it('displays plan information after loading', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Free')).toBeInTheDocument();
        expect(screen.getByText('Pro')).toBeInTheDocument(); // Plan label is shown
    });

    it('displays requests usage with progress bar', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Requisições')).toBeInTheDocument();
        expect(screen.getByText('1.500 / 10.000')).toBeInTheDocument();
        // Check progress bar exists (15% used)
        const progressBar = screen.getByRole('progressbar', { name: 'Requisições' });
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow', '15');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('displays webhooks usage with progress bar', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Webhooks')).toBeInTheDocument();
        expect(screen.getByText('5 / 10')).toBeInTheDocument();
        // Check progress bar exists (50% used)
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBe(2);
        const webhookProgressBar = progressBars[1];
        expect(webhookProgressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('displays period end date', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Fim do período:')).toBeInTheDocument();
        expect(screen.getByText('31/12/2024')).toBeInTheDocument();
    });

    it('shows upgrade button for free plan', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Fazer Upgrade para Pro' })).toBeInTheDocument();
    });

    it('disables upgrade button for pro plan', async () => {
        mockFetchSuccess(mockUsageDataPro);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        });

        const upgradeButton = screen.getByRole('button', { name: 'Fazer Upgrade para Pro' });
        expect(upgradeButton).toBeDisabled();
    });

    it('shows "Já é Pro" text for pro plan', async () => {
        mockFetchSuccess(mockUsageDataPro);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Já é Pro')).toBeInTheDocument();
    });
});

describe('Billing Page - Upgrade Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
        window.location.href = '';
    });

    const waitForLoading = async () => {
        await waitFor(() => {
            expect(screen.queryByText('Carregando informações de faturamento...')).not.toBeInTheDocument();
        }, { timeout: 1000 });
    };

    it('redirects to Stripe Checkout when upgrade button is clicked', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();
        await waitForLoading();

        // Mock the checkout response
        mockFetchSuccess(mockCheckoutUrl);

        const upgradeButton = screen.getByRole('button', { name: 'Fazer Upgrade para Pro' });
        await userEvent.click(upgradeButton);

        // Wait for redirect
        await waitFor(() => {
            expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_test_123');
        }, { timeout: 1000 });

        // Verify checkout endpoint was called
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/billing/checkout', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token',
            }),
        }));
    });

    it('shows loading state on upgrade button during checkout', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();
        await waitForLoading();

        // Don't resolve the checkout fetch immediately
        let resolveCheckout: any;
        const checkoutPromise = new Promise(resolve => { resolveCheckout = resolve; });
        (global.fetch as any).mockImplementationOnce(() => checkoutPromise);

        const upgradeButton = screen.getByRole('button', { name: 'Fazer Upgrade para Pro' });
        await userEvent.click(upgradeButton);

        // Should show loading state
        expect(screen.getByRole('button', { name: 'Redirecionando...' })).toBeInTheDocument();
        expect(upgradeButton).toBeDisabled();

        // Resolve the checkout
        resolveCheckout({
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
            json: () => Promise.resolve(mockCheckoutUrl),
            text: () => Promise.resolve(JSON.stringify(mockCheckoutUrl)),
        });

        await waitFor(() => {
            expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_test_123');
        });
    });

    it('shows error when checkout fails', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();
        await waitForLoading();

        mockFetchError(500, 'Failed to create checkout session', true);

        const upgradeButton = screen.getByRole('button', { name: 'Fazer Upgrade para Pro' });
        await userEvent.click(upgradeButton);

        await waitFor(() => {
            expect(screen.getByText('Erro ao criar sessão de checkout: Failed to create checkout session')).toBeInTheDocument();
        });

        // Button should be re-enabled
        expect(screen.getByRole('button', { name: 'Fazer Upgrade para Pro' })).not.toBeDisabled();
    });

    it('shows error when checkout returns non-JSON response', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();
        await waitForLoading();

        mockFetchError(502, 'Bad Gateway', false);

        const upgradeButton = screen.getByRole('button', { name: 'Fazer Upgrade para Pro' });
        await userEvent.click(upgradeButton);

        await waitFor(() => {
            expect(screen.getByText('Erro ao criar sessão de checkout: Expected JSON response but got text/plain: Bad Gateway')).toBeInTheDocument();
        });
    });

    it('redirects to login on 401 during checkout', async () => {
        mockFetchSuccess(mockUsageData);
        renderWithRouter();
        await waitForLoading();

        mockFetch401();
        mockFetchRefresh401(); // Refresh token also expired

        const upgradeButton = screen.getByRole('button', { name: 'Fazer Upgrade para Pro' });
        await userEvent.click(upgradeButton);

        await waitFor(() => {
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
        }, { timeout: 1000 });
    });
});

describe('Billing Page - Errors', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
        window.location.href = '';
    });

    it('shows error message when fetch fails', async () => {
        mockFetchError(500, 'Failed to fetch billing', true);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar faturamento: Failed to fetch billing')).toBeInTheDocument();
        });
    });

    it('shows error message from JSON response body when fetch fails', async () => {
        mockFetchError(500, 'Internal server error', true);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar faturamento: Internal server error')).toBeInTheDocument();
        });
    });

    it('shows error message from status text when response is not JSON', async () => {
        mockFetchError(502, 'Bad Gateway', false);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar faturamento: Expected JSON response but got text/plain: Bad Gateway')).toBeInTheDocument();
        });
    });

    it('redirects to login on 401 Unauthorized', async () => {
        mockFetch401();
        mockFetchRefresh401(); // Refresh token also expired
        renderWithRouter();

        await waitFor(() => {
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
        }, { timeout: 1000 });
    });
});

describe('Billing Page - Auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm.mockReturnValue(true);
    });

    it('fetches without Authorization header when no token', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockFetchSuccess(mockUsageData);

        render(
            <BrowserRouter>
                <Billing />
            </BrowserRouter>
        );

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/billing/usage', expect.objectContaining({
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