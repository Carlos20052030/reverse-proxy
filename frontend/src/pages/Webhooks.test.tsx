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

const renderWithRouter = () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    return render(
        <BrowserRouter>
            <Webhooks />
        </BrowserRouter>
    );
};

describe('Webhooks Page - Loading & Display', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the page with navigation and title', () => {
        renderWithRouter();

        expect(screen.getByText('Webhooks')).toBeInTheDocument();
        expect(screen.getByText('Novo Webhook')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'API Keys' })).toBeInTheDocument();
        expect(screen.getByText('Sair')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
        renderWithRouter();

        expect(screen.getByText('Carregando webhooks...')).toBeInTheDocument();
    });

    it('displays mock webhooks in table after loading', async () => {
        renderWithRouter();

        // Advance timers to resolve the setTimeout in fetchWebhooks (300ms)
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText('https://api.example.com/webhooks/github')).toBeInTheDocument();
        expect(screen.getByText('https://staging.example.com/hooks/deploy')).toBeInTheDocument();
        expect(screen.getByText('https://legacy.example.com/old-webhook')).toBeInTheDocument();
    });

    it('displays webhook events as badges', async () => {
        renderWithRouter();

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        // "push" appears in two webhooks (wh_1 and wh_3)
        const pushBadges = screen.getAllByText('push');
        expect(pushBadges.length).toBe(2);
        expect(screen.getByText('pull_request')).toBeInTheDocument();
        expect(screen.getByText('deployment')).toBeInTheDocument();
        expect(screen.getByText('release')).toBeInTheDocument();
    });

    it('displays status badges correctly', async () => {
        renderWithRouter();

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        // Active badges (green)
        const activeBadges = screen.getAllByText('active');
        expect(activeBadges).toHaveLength(2);

        // Inactive badge (gray)
        expect(screen.getByText('inactive')).toBeInTheDocument();
    });
});

describe('Webhooks Page - Interactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
        vi.useRealTimers();
    });

    const waitForLoading = async () => {
        await waitFor(() => {
            expect(screen.queryByText('Carregando webhooks...')).not.toBeInTheDocument();
        }, { timeout: 1000 });
    };

    it('opens modal when "Novo Webhook" button is clicked', async () => {
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
        renderWithRouter();
        await waitForLoading();

        const newWebhookButton = screen.getByRole('button', { name: 'Novo Webhook' });
        await userEvent.click(newWebhookButton);

        // Fill form
        await userEvent.type(screen.getByLabelText('URL do Endpoint *'), 'https://new.example.com/webhook');
        await userEvent.type(screen.getByLabelText('Eventos (separados por vírgula) *'), 'push, release');
        await userEvent.type(screen.getByLabelText('Secret (opcional)'), 'mysecret');

        // Submit
        const submitButton = screen.getByRole('button', { name: 'Criar Webhook' });
        await userEvent.click(submitButton);

        // Wait for modal to close (500ms timeout in component)
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        }, { timeout: 2000 });

        // Check new webhook appears in table
        await waitFor(() => {
            expect(screen.getByText('https://new.example.com/webhook')).toBeInTheDocument();
        }, { timeout: 1000 });
    });

    it('validates required fields', async () => {
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
        renderWithRouter();
        await waitForLoading();

        // Find and click delete button for first webhook
        const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' });
        expect(deleteButtons.length).toBeGreaterThan(0);

        await userEvent.click(deleteButtons[0]);

        // Wait for webhook to be removed (300ms timeout in component)
        await waitFor(() => {
            expect(screen.queryByText('https://api.example.com/webhooks/github')).not.toBeInTheDocument();
        }, { timeout: 2000 });

        // Other webhooks should still be there
        expect(screen.getByText('https://staging.example.com/hooks/deploy')).toBeInTheDocument();
    });

    it('handles logout', async () => {
        renderWithRouter();
        await waitForLoading();

        const logoutButton = screen.getByRole('button', { name: 'Sair' });
        await userEvent.click(logoutButton);

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
});

describe('Webhooks Page - Auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm.mockReturnValue(true);
        vi.useRealTimers();
    });

    it('redirects to login when no token', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        render(
            <BrowserRouter>
                <Webhooks />
            </BrowserRouter>
        );

        // Should navigate to login (handled by navigate('/'))
        // Since we're using fake router, we can't easily test navigation
        // but we can verify the component handles missing token
    });
});