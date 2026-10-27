import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Webhook {
    id: string;
    url: string;
    events: string[];
    secret: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export default function Webhooks() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newEvents, setNewEvents] = useState('push,pull_request');
    const [newSecret, setNewSecret] = useState('');
    const navigate = useNavigate();

    // Mock data for development (replace with real API call when backend is ready)
    const mockWebhooks: Webhook[] = [
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

    const fetchWebhooks = () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        // TODO: Replace with real API call when backend supports /webhooks endpoint
        // fetch('/webhooks', { headers: { 'Authorization': `Bearer ${token}` } })
        //     .then(res => res.json())
        //     .then(data => { setWebhooks(data); setLoading(false); })
        //     .catch(err => { setError(err.message); setLoading(false); });

        // Using mock data for now
        setTimeout(() => {
            setWebhooks(mockWebhooks);
            setLoading(false);
        }, 300);
    };

    useEffect(() => { fetchWebhooks(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        try {
            // TODO: Replace with real API call when backend supports POST /webhooks
            // const res = await fetch('/webhooks', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${token}`
            //     },
            //     body: JSON.stringify({
            //         url: newUrl,
            //         events: newEvents.split(',').map(e => e.trim()),
            //         secret: newSecret || undefined
            //     })
            // });
            // if (!res.ok) throw new Error('Failed to create webhook');
            // const data = await res.json();
            // setWebhooks([data, ...webhooks]);

            // Simulate API call with mock data
            await new Promise(resolve => setTimeout(resolve, 500));
            const newWebhook: Webhook = {
                id: `wh_${Date.now()}`,
                url: newUrl,
                events: newEvents.split(',').map(e => e.trim()),
                secret: newSecret ? `whsec_${newSecret.slice(0, 6)}...` : 'whsec_auto...',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setWebhooks([newWebhook, ...webhooks]);

            setShowModal(false);
            setNewUrl('');
            setNewEvents('push,pull_request');
            setNewSecret('');
        } catch (err) {
            setError('Error creating webhook. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this webhook?")) return;

        try {
            // TODO: Replace with real API call when backend supports DELETE /webhooks/:id
            // const res = await fetch(`/webhooks/${id}`, {
            //     method: 'DELETE',
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            // if (!res.ok) throw new Error('Failed to delete');
            // setWebhooks(webhooks.filter(w => w.id !== id));

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            setWebhooks(webhooks.filter(w => w.id !== id));
        } catch (err) {
            alert("Error deleting webhook.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const getStatusBadge = (status: Webhook['status']) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
        }`}>
            {status}
        </span>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex space-x-4 items-center">
                            <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 font-medium">Dashboard</Link>
                            <span className="text-gray-300">/</span>
                            <Link to="/api-keys" className="text-gray-500 hover:text-gray-900 font-medium">API Keys</Link>
                            <span className="text-gray-300">/</span>
                            <h1 className="text-xl font-bold text-gray-900">Webhooks</h1>
                        </div>
                        <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-800">Sair</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Create Webhook Button */}
                <div className="mb-8">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Novo Webhook
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
                        {error}
                    </div>
                )}

                {/* Webhooks Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200" role="table">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eventos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Carregando webhooks...
                                        </td>
                                    </tr>
                                ) : webhooks.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Nenhum webhook configurado. Clique em "Novo Webhook" para começar.
                                        </td>
                                    </tr>
                                ) : (
                                    webhooks.map((wh) => (
                                        <tr key={wh.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-mono break-all max-w-md">{wh.url}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700 flex flex-wrap gap-1">
                                                    {wh.events.map((event, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                            {event}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(wh.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(wh.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(wh.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Webhook Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
                            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl transform transition-all">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 id="modal-title" className="text-lg font-semibold text-gray-900">Criar Novo Webhook</h2>
                                </div>
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div>
                                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                                            URL do Endpoint <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            id="url"
                                            required
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            placeholder="https://api.exemplo.com/webhook"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="events" className="block text-sm font-medium text-gray-700 mb-1">
                                            Eventos (separados por vírgula) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="events"
                                            required
                                            value={newEvents}
                                            onChange={(e) => setNewEvents(e.target.value)}
                                            placeholder="push, pull_request, deployment"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Ex: push, pull_request, release, deployment
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
                                            Secret (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            id="secret"
                                            value={newSecret}
                                            onChange={(e) => setNewSecret(e.target.value)}
                                            placeholder="Deixe em branco para gerar automaticamente"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Usado para assinar o payload (HMAC-SHA256). Se vazio, será gerado um automaticamente.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {isSubmitting ? 'Criando...' : 'Criar Webhook'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}