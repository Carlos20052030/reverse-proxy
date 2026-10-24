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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        // Fetch real bookmarks from the backend
        fetch('https://api.nuntix.com.br/bookmarks', {
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
                // Backend might return an array directly or an object with { bookmarks: [...] }
                setBookmarks(data.bookmarks || data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
                <h1>Nuntix Dashboard</h1>
                <button onClick={handleLogout} style={{ padding: '0.5rem', cursor: 'pointer' }}>
                    Logout
                </button>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <h2>My Bookmarks</h2>

                {loading && <p>Loading data from server...</p>}
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}

                {!loading && !error && bookmarks.length === 0 && (
                    <p>No bookmarks found. (Create one via API or add it to the interface).</p>
                )}

                <ul>
                    {bookmarks.map((bm) => (
                        <li key={bm.id} style={{ marginBottom: '10px' }}>
                            <strong>{bm.title || 'Untitled'}</strong> - <a href={bm.url} target="_blank" rel="noreferrer">{bm.url}</a>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}