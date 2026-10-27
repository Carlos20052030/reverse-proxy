import { useEffect, useState } from 'react';

interface Bookmark {
    id: string;
    title: string;
    url: string;
}

export default function Dashboard() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBookmarks = () => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/'; return; }

        fetch('/bookmarks', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/'; }
                    throw new Error('Failed to fetch bookmarks');
                }
                return res.json();
            })
            .then(data => {
                setBookmarks(data.bookmarks || data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => { fetchBookmarks(); }, []);

    const handleAddBookmark = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTitle, url: newUrl }),
            });

            if (!response.ok) throw new Error('Failed to create bookmark');

            setNewTitle('');
            setNewUrl('');
            fetchBookmarks();
        } catch (err) {
            alert("Error creating bookmark.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this bookmark?")) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/bookmarks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete');
            setBookmarks(bookmarks.filter(bm => bm.id !== id));
        } catch (err) {
            alert("Error deleting bookmark.");
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