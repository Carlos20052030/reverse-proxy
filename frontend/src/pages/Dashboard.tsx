import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api, { safeJson } from '../lib/api';

interface UsageData {
    plan: 'free' | 'pro';
    subscription_ends_at: string | null;
    requests: { used: number; limit: number };
    webhooks: { used: number; limit: number };
}

interface DashboardMetrics {
    requestsUsed: number;
    requestsLimit: number;
    requestsPercentage: number;
    webhooksUsed: number;
    webhooksLimit: number;
    webhooksPercentage: number;
    plan: 'free' | 'pro';
    subscriptionEndsAt: string | null;
}

interface Toast {
    message: string;
    type: 'success' | 'error';
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<Toast | null>(null);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);

    // Check for new API key in sessionStorage on mount
    useEffect(() => {
        const storedKey = sessionStorage.getItem('new_api_key');
        if (storedKey) {
            setNewApiKey(storedKey);
            setShowApiKeyModal(true);
        }
    }, []);

    // Set navigate for global 401 redirect
    api.setNavigate(navigate);

    const closeApiKeyModal = () => {
        setShowApiKeyModal(false);
        setNewApiKey(null);
        sessionStorage.removeItem('new_api_key');
    };

    const copyApiKey = async () => {
        if (!newApiKey) return;
        try {
            await navigator.clipboard.writeText(newApiKey);
            setToast({ message: 'Chave copiada para a área de transferência!', type: 'success' });
        } catch {
            setToast({ message: 'Erro ao copiar a chave.', type: 'error' });
        }
    };

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchMetrics = async () => {
        try {
            setError('');
            const res = await api.get('/api/billing/usage');

            if (!res.ok) {
                let errorMessage = `Error ${res.status}: ${res.statusText}`;
                try {
                    const errorData = await safeJson<{ message?: string }>(res);
                    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                        errorMessage = String(errorData.message);
                    }
                } catch {
                    // Use status text if JSON parsing fails
                }
                throw new Error(errorMessage);
            }

            const data = await safeJson<UsageData>(res);

            // Calculate percentages
            const requestsPercentage = data.requests.limit > 0
                ? Math.round((data.requests.used / data.requests.limit) * 100)
                : 0;

            const webhooksPercentage = data.webhooks.limit > 0
                ? Math.round((data.webhooks.used / data.webhooks.limit) * 100)
                : 0;

            setMetrics({
                requestsUsed: data.requests.used,
                requestsLimit: data.requests.limit,
                requestsPercentage,
                webhooksUsed: data.webhooks.used,
                webhooksLimit: data.webhooks.limit,
                webhooksPercentage,
                plan: data.plan,
                subscriptionEndsAt: data.subscription_ends_at,
            });
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('pt-BR').format(num);
    };

    const formatDate = (dateString: string | null): string => {
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

    const getPlanLimitText = (plan: 'free' | 'pro'): string => {
        if (plan === 'pro') {
            return '1.000.000 req/mês incluídos';
        }
        return '10.000 req/mês incluídos';
    };

    return (
        <>
            <Helmet>
                <title>Dashboard — Nuntix</title>
                <meta name="description" content="Painel do seu API Gateway e Webhook Dispatcher" />
            </Helmet>

            {/* New API Key Modal */}
            {showApiKeyModal && newApiKey && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="api-key-modal-title">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                        <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-200">
                            <h3 id="api-key-modal-title" className="text-lg font-semibold text-slate-900 mb-2">
                                Sua API Key foi gerada!
                            </h3>
                            <p className="text-slate-600 mb-4 text-sm">
                                Você não poderá ver esta chave novamente. Copie-a agora.
                            </p>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    readOnly
                                    value={newApiKey}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    aria-label="Sua nova API Key"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={copyApiKey}
                                    className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copiar Chave
                                </button>
                                <button
                                    onClick={closeApiKeyModal}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 transition-colors"
                                >
                                    Entendi, Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
                    toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`} role="alert">
                    {toast.message}
                </div>
            )}

            <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Bem-vindo ao seu API Gateway
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gerencie suas APIs, monitore webhooks e controle o uso do seu plano.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
                        Erro ao carregar métricas: {error}
                    </div>
                )}

                {loading ? (
                    <div data-testid="loading-skeleton" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : metrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Requests Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Requisições</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                        {formatNumber(metrics.requestsUsed)} / {formatNumber(metrics.requestsLimit)}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                role="progressbar"
                                                aria-label="Requisições usadas"
                                                aria-valuenow={metrics.requestsPercentage}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                                                style={{ width: `${metrics.requestsPercentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {metrics.requestsPercentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* API Status Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status da API</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">Operacional</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Todas as rotas respondendo</p>
                                </div>
                            </div>
                        </div>

                        {/* Plan Quota Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    metrics.plan === 'pro'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                        : 'bg-amber-100 dark:bg-amber-900/30'
                                }`}>
                                    <svg className={`w-6 h-6 ${
                                        metrics.plan === 'pro'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-amber-600 dark:text-amber-400'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Quotas do Plano</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                        {metrics.plan === 'pro' ? 'Pro' : 'Free'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                role="progressbar"
                                                aria-label="Webhooks usados"
                                                aria-valuenow={metrics.webhooksPercentage}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                                                style={{ width: `${metrics.webhooksPercentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {metrics.webhooksPercentage}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {formatNumber(metrics.webhooksUsed)} / {formatNumber(metrics.webhooksLimit)} webhooks • {getPlanLimitText(metrics.plan)}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        Renova em: {formatDate(metrics.subscriptionEndsAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500">Nenhuma métrica disponível.</p>
                )}

                {/* Quick Links Grid */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Ações Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link
                            to="/api-keys"
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                        >
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Gerenciar API Keys</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Crie, revogue e monitore chaves de acesso às suas APIs</p>
                        </Link>

                        <Link
                            to="/webhooks"
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                        >
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Ver Histórico de Webhooks</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Monitore entregas, retries e debugue payloads</p>
                        </Link>

                        <Link
                            to="/billing"
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                        >
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                {metrics?.plan === 'pro' ? 'Gerenciar Assinatura' : 'Fazer Upgrade para Pro'}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                {metrics?.plan === 'pro'
                                    ? 'Acesse o portal do cliente Stripe para gerenciar sua assinatura'
                                    : 'Aumente limites, ganhe webhooks ilimitados e SLA 99.9%'}
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}