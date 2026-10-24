import { useState } from 'react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/auth/login', {
                method: 'POST', // <--- ESSA LINHA É OBRIGATÓRIA
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Invalid email or password');
            }

            const data = await response.json();
            const token = data.access_token || data.token;

            if (token) {
                localStorage.setItem('token', token);
                window.location.href = '/dashboard';
            } else {
                alert('Token not found in response.');
            }
        } catch (err) {
            alert("Login failed. Check if the backend is running and CORS is configured.");
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', marginTop: '10vh' }}>
            <h1>Nuntix Login</h1>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.5rem' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '0.5rem' }}
                />
                <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
                    Login
                </button>
            </form>
        </div>
    );
}