import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Dashboard from './Dashboard';

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

const mockUsageDataFree = {
    plan: 'free',
    subscription_ends_at: '2024-12-31T23:59:59Z',
    requests: { used: 1500, limit: 10000 },
    webhooks: { used: 2, limit: 3 },
};

const mockUsageDataPro = {
    plan: 'pro',
    subscription_ends_at: '2024-12-31T23:59:59Z',
    requests: { used: 50000, limit: 1000000 },
    webhooks: { used: 25, limit: 100 },
};

const renderWithRouter = () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    return render(
        <BrowserRouter>
            <Dashboard />
        </BrowserRouter>
    );
};

const mockFetchSuccess = (data: any) => {
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
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
    });
};

const mockFetchError = (status = 500) => {
    const statusTexts: Record<number, string> = {
        401: 'Unauthorized',
        500: 'Internal Server Error',
    };
    (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status,
        statusText: statusTexts[status] || 'Internal Server Error',
        headers: {
            get: (name: string) => {
                if (name.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            },
        },
        json: () => Promise.resolve({ message: 'Error' }),
        text: () => Promise.resolve('Error'),
    });
};

// Helper to check if text exists anywhere in the document
const expectTextInDocument = (text: string) => {
    expect(document.body.textContent).toContain(text);
};

describe('Dashboard Page - Loading & Display', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
    });

    it('renders the page title', () => {
        mockFetchSuccess(mockUsageDataFree);
        renderWithRouter();

        expect(screen.getByText('Bem-vindo ao seu API Gateway')).toBeInTheDocument();
    });

    it('shows loading skeleton initially', () => {
        (global.fetch as any).mockImplementation(() => new Promise(() => {}));
        renderWithRouter();

        // Loading skeleton has animate-pulse class
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('displays total requests metric with real data', async () => {
        mockFetchSuccess(mockUsageDataFree);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Should show used/total requests
        expect(screen.getByText('1.500 / 10.000')).toBeInTheDocument();
        // Should show percentage (15%)
        expect(screen.getByText('15%')).toBeInTheDocument();
    });

    it('displays API status metric', async () => {
        mockFetchSuccess(mockUsageDataFree);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Operacional')).toBeInTheDocument();
        expect(screen.getByText('Todas as rotas respondendo')).toBeInTheDocument();
    });

    it('displays plan quota metric with real data', async () => {
        mockFetchSuccess(mockUsageDataFree);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Free')).toBeInTheDocument();
        expectTextInDocument('10.000 req/mês incluídos');
    });

    it('displays pro plan with higher limits', async () => {
        mockFetchSuccess(mockUsageDataPro);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Pro')).toBeInTheDocument();
        expectTextInDocument('1.000.000 req/mês incluídos');
        expect(screen.getByText('5%')).toBeInTheDocument(); // 50000/1000000 = 5%
    });

    it('shows webhooks usage in plan metric', async () => {
        mockFetchSuccess(mockUsageDataFree);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Free plan: 2/3 webhooks = 66%
        expect(screen.getByText('67%')).toBeInTheDocument(); // rounded
    });

    it('shows error message when fetch fails', async () => {
        mockFetchError(500);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/Erro ao carregar métricas/i)).toBeInTheDocument();
        });
    });

    it('shows quick links section', async () => {
        mockFetchSuccess(mockUsageDataFree);
        renderWithRouter();

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
        expect(screen.getByText('Gerenciar API Keys')).toBeInTheDocument();
        expect(screen.getByText('Ver Histórico de Webhooks')).toBeInTheDocument();
        expect(screen.getByText('Fazer Upgrade para Pro')).toBeInTheDocument();
    });
});

describe('Dashboard Page - Auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm.mockReturnValue(true);
    });

    it('fetches without Authorization header when no token', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockFetchSuccess(mockUsageDataFree);

        render(
            <BrowserRouter>
                <Dashboard />
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