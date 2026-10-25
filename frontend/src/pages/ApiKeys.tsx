import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface APIKey {
    id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    revoked_at: string | null;
}

export default function ApiKeys() {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [name, setName] = useState('');
    const [newRawKey, setNewRawKey] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchKeys = () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        fetch('/api-keys', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setKeys(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchKeys(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            if (!res.ok) throw new Error('Failed to create key');

            const data = await res.json();
            setNewRawKey(data.raw_key);
            setName('');
            fetchKeys();
        } catch (err) {
            alert("Error creating API Key");
        }
    };

    const handleRevoke = async (id: string) => {
        if (!window.confirm("Are you sure? Applications using this key will stop working immediately.")) return;
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api-keys/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to revoke');
            fetchKeys();
        } catch (err) {
            alert("Error revoking key");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex space-x-4 items-center">
                            <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 font-medium">Dashboard</Link>
                            <span className="text-gray-300">/</span>
                            <h1 className="text-xl font-bold text-gray-900">API Keys</h1>
                        </div>
                        <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-800">Sair</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                )}

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
            </main>
        </div>
    );
}