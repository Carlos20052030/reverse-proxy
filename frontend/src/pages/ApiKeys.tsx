import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { safeJson } from '../lib/api';

interface APIKey {
    id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    revoked_at: string | null;
}

interface Toast {
    message: string;
    type: 'success' | 'error';
}

export default function ApiKeys() {
    const navigate = useNavigate();
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [name, setName] = useState('');
    const [newRawKey, setNewRawKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<Toast | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [keyIdToRevoke, setKeyIdToRevoke] = useState<string | null>(null);
    const [revoking, setRevoking] = useState(false);

    // Set navigate for global 401 redirect
    api.setNavigate(navigate);

    const fetchKeys = async () => {
        try {
            // Using explicit /api prefix since api.ts no longer prepends base URL
            const res = await api.get('/api/api-keys');
            const data = await safeJson<APIKey[]>(res);
            setKeys(Array.isArray(data) ? data : []);
        } catch (err) {
            // 401 errors are handled globally by the API client
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKeys(); }, []);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Using explicit /api prefix since api.ts no longer prepends base URL
            const res = await api.post('/api/api-keys', { name });

            if (!res.ok) {
                const errorData = await safeJson(res);
                throw new Error(typeof errorData === 'object' && errorData && 'message' in errorData ? String(errorData.message) : 'Erro ao criar chave');
            }

            const data = await safeJson<{ raw_key: string }>(res);
            setNewRawKey(data.raw_key);
            setName('');
            fetchKeys();
            setToast({ message: 'Chave criada com sucesso.', type: 'success' });
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                setToast({ message: err.message || 'Erro ao criar chave de API', type: 'error' });
            }
        }
    };

    const handleRevoke = (id: string) => {
        setKeyIdToRevoke(id);
        setShowConfirmModal(true);
    };

    const handleConfirmRevoke = async () => {
        if (!keyIdToRevoke) return;

        setRevoking(true);
        setShowConfirmModal(false);

        try {
            const res = await api.delete(`/api/api-keys/${keyIdToRevoke}`);
            if (!res.ok) {
                const errorData = await safeJson(res);
                throw new Error(typeof errorData === 'object' && errorData && 'message' in errorData ? String(errorData.message) : 'Erro ao revogar');
            }
            fetchKeys();
            setToast({ message: 'Chave revogada com sucesso.', type: 'success' });
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                setToast({ message: err.message || 'Erro ao revogar chave', type: 'error' });
            }
        } finally {
            setRevoking(false);
            setKeyIdToRevoke(null);
        }
    };

    const handleCancelRevoke = () => {
        setShowConfirmModal(false);
        setKeyIdToRevoke(null);
    };

    return (
        <div>
            {toast && (
                <div className={`mb-6 p-4 rounded-md ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`} role="alert">
                    {toast.message}
                </div>
            )}

            {showConfirmModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                        <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar revogação</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja revogar esta chave? Aplicações usando esta chave pararão de funcionar imediatamente.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleCancelRevoke}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmRevoke}
                                    disabled={revoking}
                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {revoking ? 'Revogando...' : 'Revogar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {newRawKey && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded-md">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">API Key criada com sucesso!</h3>
                            <div className="mt-2 text-sm text-green-700">
                                <p>Copie esta chave agora. Ela <strong>não será mostrada novamente</strong>.</p>
                                <code className="block mt-2 p-2 bg-green-100 rounded text-gray-800 font-mono break-all">
                                    {newRawKey}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            )

            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Gerar Nova API Key</h2>
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text" placeholder="Nome da chave (ex: Produção, Staging)" value={name} onChange={(e) => setName(e.target.value)} required
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
                        Gerar Chave
                    </button>
                </form>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Suas Chaves</h2>
            {loading ? (
                <p className="text-gray-500">Carregando...</p>
            ) : (
                <div className="grid gap-4">
                    {keys.map((k) => (
                        <div key={k.id} className={`bg-white p-5 rounded-lg shadow-sm border ${k.revoked_at ? 'border-gray-300 opacity-60' : 'border-gray-200'} flex justify-between items-center`}>
                            <div>
                                <h3 className="font-semibold text-gray-900">{k.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Prefixo: <code className="bg-gray-100 px-1 rounded">{k.key_prefix}...</code>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Criada em: {new Date(k.created_at).toLocaleString()}
                                </p>
                                {k.revoked_at && <p className="text-xs text-red-500 mt-1 font-semibold">Revogada em: {new Date(k.revoked_at).toLocaleString()}</p>}
                            </div>
                            {!k.revoked_at && (
                                <button onClick={() => handleRevoke(k.id)} className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-md hover:bg-red-100 transition-colors">
                                    Revogar
                                </button>
                            )}
                        </div>
                    ))}
                    {keys.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Nenhuma API Key encontrada.</p>
                    )}
                </div>
            )}
        </div>
    );
}