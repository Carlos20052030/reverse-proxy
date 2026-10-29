import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { safeJson } from '../lib/api';

interface Bookmark {
    id: string;
    title: string;
    url: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Set navigate for global 401 redirect
    api.setNavigate(navigate);

    const fetchBookmarks = async () => {
        try {
            const res = await api.get('/bookmarks');
            const data = await safeJson<{ bookmarks?: Bookmark[] } | Bookmark[]>(res);
            const bookmarks = Array.isArray(data) ? data : (data.bookmarks || []);
            setBookmarks(bookmarks);
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookmarks(); }, []);

    const handleAddBookmark = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await api.post('/bookmarks', { title: newTitle, url: newUrl });
            if (!response.ok) {
                const errorData = await safeJson(response);
                throw new Error(typeof errorData === 'object' && errorData && 'message' in errorData ? String(errorData.message) : 'Failed to create bookmark');
            }

            setNewTitle('');
            setNewUrl('');
            fetchBookmarks();
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                alert("Error creating bookmark.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this bookmark?")) return;
        try {
            const response = await api.delete(`/bookmarks/${id}`);
            if (!response.ok) {
                const errorData = await safeJson(response);
                throw new Error(typeof errorData === 'object' && errorData && 'message' in errorData ? String(errorData.message) : 'Failed to delete');
            }
            setBookmarks(bookmarks.filter(bm => bm.id !== id));
        } catch (err) {
            if (err instanceof Error && err.message !== 'Unauthorized - redirected to login') {
                alert("Error deleting bookmark.");
            }
        }
    };

    return (
        <>
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Novo Bookmark</h2>
                    <form onSubmit={handleAddBookmark} className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text" placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                            type="url" placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required
                            className="flex-[2] px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                            {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                        </button>
                    </form>
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mb-4">Meus Bookmarks</h2>

                {loading && <p className="text-gray-500">Carregando dados...</p>}
                {error && <p className="text-red-500">Erro: {error}</p>}

                <div className="grid gap-4">
                    {bookmarks.map((bm) => (
                        <div key={bm.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg">{bm.title || 'Sem título'}</h3>
                                <a href={bm.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm break-all">
                                    {bm.url}
                                </a>
                            </div>
                            <button onClick={() => handleDelete(bm.id)} className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-md hover:bg-red-100 transition-colors ml-4">
                                Excluir
                            </button>
                        </div>
                    ))}
                    {!loading && bookmarks.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Nenhum bookmark encontrado.</p>
                    )}
                </div>
        </>
    );
}