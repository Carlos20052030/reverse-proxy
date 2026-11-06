import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const clearErrors = () => {
        setPasswordError('');
        setConfirmError('');
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        // Client-side validation
        if (!password || password.length < 8) {
            setPasswordError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setConfirmError('As senhas não coincidem.');
            return;
        }

        if (!token) {
            setToast({ message: 'Token inválido ou ausente.', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = data.message || 'Erro ao redefinir senha. Tente novamente.';

                if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('inválido') || errorMessage.toLowerCase().includes('expirado')) {
                    setToast({ message: 'Link inválido ou expirado. Solicite um novo.', type: 'error' });
                } else if (errorMessage.toLowerCase().includes('senha') || errorMessage.toLowerCase().includes('password')) {
                    setPasswordError(errorMessage);
                } else {
                    setToast({ message: errorMessage, type: 'error' });
                }
                return;
            }

            setToast({ message: 'Senha redefinida com sucesso! Redirecionando...', type: 'success' });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
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

    // Check if token is missing
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Link Inválido
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Este link de recuperação é inválido ou expirou.
                    </p>
                    <div className="mt-6">
                        <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Solicitar novo link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                        Nova Senha
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Digite sua nova senha abaixo
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="password" required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                                    passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nova Senha"
                                value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                            />
                            {passwordError && (
                                <p className="text-red-600 text-sm mt-1 ml-1">{passwordError}</p>
                            )}
                        </div>
                        <div>
                            <input
                                type="password" required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                                    confirmError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Confirmar Nova Senha"
                                value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(''); }}
                            />
                            {confirmError && (
                                <p className="text-red-600 text-sm mt-1 ml-1">{confirmError}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Voltar para o login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}