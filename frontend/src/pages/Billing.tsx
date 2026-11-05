import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { safeJson } from '../lib/api';

interface UsageData {
    plan: 'free' | 'pro';
    period_end: string;
    requests: { used: number; limit: number };
    webhooks: { used: number; limit: number };
}

interface CheckoutResponse {
    url: string;
}

export default function Billing() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [upgradeError, setUpgradeError] = useState('');
    const [portalLoading, setPortalLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Set navigate for global 401 redirect
    api.setNavigate(navigate);

    const fetchUsage = async () => {
        try {
            setError('');
            // Using explicit /api prefix since api.ts no longer prepends base URL
            const res = await api.get('/api/billing/usage');

            if (!res.ok) {
                let errorMessage = `Error ${res.status}: ${res.statusText}`;
                try {
                    const errorData = await safeJson<{ message?: string }>(res);
                    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                        errorMessage = String(errorData.message);
                    }
                } catch (parseErr) {
                    if (parseErr instanceof Error) {
                        // Use the safeJson error message which includes content-type info
                        errorMessage = parseErr.message;
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await safeJson<UsageData>(res);
            setUsage(data);
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle checkout success/cancel query parameters
    useEffect(() => {
        const checkout = searchParams.get('checkout');
        if (checkout === 'success') {
            setToast({ message: 'Pagamento aprovado! Bem-vindo ao Pro.', type: 'success' });
            fetchUsage(); // Refetch billing data to ensure UI is up to date
            // Clean up URL
            window.history.replaceState(null, '', window.location.pathname);
        } else if (checkout === 'canceled' || checkout === 'cancel') {
            setToast({ message: 'Pagamento cancelado.', type: 'error' });
            // Clean up URL
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [searchParams]);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsage();
    }, []);

    const handleUpgrade = async () => {
        if (upgradeLoading || usage?.plan === 'pro') return;

        setUpgradeLoading(true);
        setUpgradeError('');

        try {
            // Using explicit /api prefix since api.ts no longer prepends base URL
            const res = await api.get('/api/billing/checkout');

            if (!res.ok) {
                let errorMessage = `Error ${res.status}: ${res.statusText}`;
                try {
                    const errorData = await safeJson<{ message?: string }>(res);
                    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                        errorMessage = String(errorData.message);
                    }
                } catch (parseErr) {
                    if (parseErr instanceof Error) {
                        errorMessage = parseErr.message;
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await safeJson<CheckoutResponse>(res);

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                setUpgradeError(err.message);
            }
        } finally {
            setUpgradeLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        if (portalLoading || usage?.plan !== 'pro') return;

        setPortalLoading(true);

        try {
            // Backend route is /billing/portal (reverse proxy handles routing)
            const res = await api.post('/billing/portal', {});

            if (!res.ok) {
                let errorMessage = `Error ${res.status}: ${res.statusText}`;
                try {
                    const errorData = await safeJson<{ message?: string }>(res);
                    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                        errorMessage = String(errorData.message);
                    }
                } catch (parseErr) {
                    if (parseErr instanceof Error) {
                        errorMessage = parseErr.message;
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await safeJson<{ url: string }>(res);

            // Redirect to Stripe Customer Portal
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                // Also show as toast
                setToast({ message: err.message, type: 'error' });
            }
        } finally {
            setPortalLoading(false);
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString || dateString.trim() === '') {
            return 'Sem data de renovação';
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Sem data de renovação';
        }
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const calculatePercentage = (used: number, limit: number): number => {
        if (limit === 0) return 0;
        return Math.round((used / limit) * 100);
    };

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('pt-BR').format(num);
    };

    const requestsPercentage = usage ? calculatePercentage(usage.requests.used, usage.requests.limit) : 0;
    const webhooksPercentage = usage ? calculatePercentage(usage.webhooks.used, usage.webhooks.limit) : 0;

    return (
        <>
            {toast && (
                <div className={`mb-6 p-4 rounded-md ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`} role="alert">
                    {toast.message}
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
                    Erro ao carregar faturamento: {error}
                </div>
            )}

            {upgradeError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
                    Erro ao criar sessão de checkout: {upgradeError}
                </div>
            )}

            {loading ? (
                <p className="text-gray-500">Carregando informações de faturamento...</p>
            ) : usage ? (
                <>
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Plano Atual</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500">Plano:</span>
                                    <span className={`text-lg font-semibold ${
                                        usage.plan === 'pro' ? 'text-green-700' : 'text-gray-900'
                                    }`}>
                                        {usage.plan === 'pro' ? 'Pro' : 'Free'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    <span>Fim do período:</span>
                                    <span> {formatDate(usage.period_end)}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                    <span className="text-sm font-medium text-gray-500">Upgrade para:</span>
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-medium rounded-full text-sm">
                                        Pro
                                    </span>
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={upgradeLoading || usage.plan === 'pro'}
                                        aria-label={usage.plan === 'pro' ? 'Fazer Upgrade para Pro' : undefined}
                                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {upgradeLoading ? 'Redirecionando...' : usage.plan === 'pro' ? 'Já é Pro' : 'Fazer Upgrade para Pro'}
                                    </button>
                                    {usage.plan === 'pro' && (
                                        <button
                                            onClick={handleManageSubscription}
                                            disabled={portalLoading}
                                            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                        >
                                            {portalLoading ? 'Redirecionando...' : 'Gerenciar Assinatura'}
                                        </button>
                                    )}
                                </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Requests Usage */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Requisições</h3>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-gray-500">Usado</span>
                                <span className="font-medium text-gray-900">
                                    {formatNumber(usage.requests.used)} / {formatNumber(usage.requests.limit)}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    role="progressbar"
                                    aria-label="Requisições"
                                    aria-valuenow={requestsPercentage}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                    style={{ width: `${requestsPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Webhooks Usage */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Webhooks</h3>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-gray-500">Usado</span>
                                <span className="font-medium text-gray-900">
                                    {formatNumber(usage.webhooks.used)} / {formatNumber(usage.webhooks.limit)}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    role="progressbar"
                                    aria-label="Webhooks"
                                    aria-valuenow={webhooksPercentage}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                    style={{ width: `${webhooksPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-gray-500">Nenhuma informação de faturamento disponível.</p>
            )}
        </>
    );
}