import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const clearErrors = () => {
        setEmailError('');
        setPasswordError('');
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = data.message || 'Erro ao cadastrar. Tente novamente.';

                // Check for specific field errors
                if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('e-mail') || errorMessage.toLowerCase().includes('cadastrad')) {
                    setEmailError(errorMessage);
                } else if (errorMessage.toLowerCase().includes('senha') || errorMessage.toLowerCase().includes('password')) {
                    setPasswordError(errorMessage);
                } else {
                    setToast({ message: errorMessage, type: 'error' });
                }
                return;
            }

            const token = data.access_token || data.token;

            if (token) {
                localStorage.setItem('token', token);
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                setToast({ message: 'Conta criada com sucesso!', type: 'success' });

                // Small delay to show success toast before redirect
                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);
            }
        } catch (err) {
            setToast({ message: 'Erro de conexão. Tente novamente.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
                    toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`} role="alert">
                    {toast.message}
                </div>
            )}
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Crie sua conta
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Comece a usar o Nuntix hoje
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email" required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                                    emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Email address"
                                value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                            />
                            {emailError && (
                                <p className="text-red-600 text-sm mt-1 ml-1">{emailError}</p>
                            )}
                        </div>
                        <div>
                            <input
                                type="password" required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                                    passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Password"
                                value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                            />
                            {passwordError && (
                                <p className="text-red-600 text-sm mt-1 ml-1">{passwordError}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Já tem uma conta? Faça login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}