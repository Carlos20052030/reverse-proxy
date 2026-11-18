import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Docs from './Docs';

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
            <Docs />
        </BrowserRouter>
    );
};

// Helper to check if text exists anywhere in the document
const expectTextInDocument = (text: string) => {
    expect(document.body.textContent).toContain(text);
};

describe('Docs Page - Rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        window.confirm.mockReturnValue(true);
    });

    it('renders the page title', () => {
        renderWithRouter();
        expect(screen.getByText('Documentação da API')).toBeInTheDocument();
    });

    it('renders the introduction section', () => {
        renderWithRouter();
        expect(screen.getByText(/Bem-vindo à documentação da API Nuntix/i)).toBeInTheDocument();
    });

    it('renders authentication section', () => {
        renderWithRouter();
        expect(screen.getByText('Autenticação')).toBeInTheDocument();
        expect(screen.getByText('JWT Bearer Token')).toBeInTheDocument();
    });

    it('renders rate limiting section', () => {
        renderWithRouter();
        expect(screen.getByText('Rate Limiting')).toBeInTheDocument();
    });

    it('renders bookmarks endpoints section', () => {
        renderWithRouter();
        expect(screen.getByText('Bookmarks')).toBeInTheDocument();
        expectTextInDocument('POST/bookmarks');
        expectTextInDocument('GET/bookmarks');
    });

    it('renders tags endpoints section', () => {
        renderWithRouter();
        expect(screen.getByText('Tags')).toBeInTheDocument();
        expectTextInDocument('POST/tags');
        expectTextInDocument('GET/tags');
    });

    it('renders api keys endpoints section', () => {
        renderWithRouter();
        expect(screen.getByText('API Keys')).toBeInTheDocument();
        expectTextInDocument('POST/api-keys');
        expectTextInDocument('GET/api-keys');
    });

    it('renders webhooks endpoints section', () => {
        renderWithRouter();
        expect(screen.getByText('Webhooks')).toBeInTheDocument();
    });

    it('renders billing endpoints section', () => {
        renderWithRouter();
        expect(screen.getByText('Faturamento')).toBeInTheDocument();
        expectTextInDocument('GET/billing/usage');
    });

    it('renders error codes section', () => {
        renderWithRouter();
        expect(screen.getByText('Códigos de Erro')).toBeInTheDocument();
        expect(screen.getByText('401')).toBeInTheDocument();
        expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('renders code examples', () => {
        renderWithRouter();
        expect(screen.getByText('Exemplos de Código')).toBeInTheDocument();
        expectTextInDocument('curl');
    });
});