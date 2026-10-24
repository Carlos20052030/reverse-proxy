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

    // Novos estados para o formulário
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Função que busca os bookmarks (isolada para podermos reutilizar)
    const fetchBookmarks = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        fetch('/bookmarks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/';
                    }
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

    useEffect(() => {
        fetchBookmarks();
    }, []);

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

            if (!response.ok) {
                throw new Error('Failed to create bookmark');
            }

            // Limpa o formulário e atualiza a lista
            setNewTitle('');
            setNewUrl('');
            fetchBookmarks(); // Recarrega a lista do banco de dados
        } catch (err) {
            alert("Error creating bookmark.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h1>Nuntix Dashboard</h1>
                <button onClick={handleLogout} style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Logout
                </button>
            </header>

            {/* Formulário de Adicionar */}
            <section style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #dee2e6' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Add New Bookmark</h2>
                <form onSubmit={handleAddBookmark} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        style={{ flex: '1 1 200px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <input
                        type="url"
                        placeholder="https://..."
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        required
                        style={{ flex: '2 1 300px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ padding: '0.5rem 1.5rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Bookmark'}
                    </button>
                </form>
            </section>

            <main>
                <h2>My Bookmarks</h2>

                {loading && <p>Loading data from server...</p>}
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}

                {!loading && !error && bookmarks.length === 0 && (
                    <p>No bookmarks found. Add one above!</p>
                )}

                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {bookmarks.map((bm) => (
                        <li key={bm.id} style={{ marginBottom: '10px', padding: '1rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white' }}>
                            <strong>{bm.title || 'Untitled'}</strong>
                            <br />
                            <a href={bm.url} target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>{bm.url}</a>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}