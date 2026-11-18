import { Outlet, Link, useNavigate } from 'react-router-dom';

export function Layout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            >
                                Dashboard
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <Link
                                to="/api-keys"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md transition-colors dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                            >
                                Gerenciar API Keys
                            </Link>
                            <Link
                                to="/webhooks"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md transition-colors dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                            >
                                Gerenciar Webhooks
                            </Link>
                            <Link
                                to="/billing"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md transition-colors dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                            >
                                Faturamento
                            </Link>
                            <Link
                                to="/docs"
                                className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                            >
                                Documentação
                            </Link>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}

export function AuthLayout() {
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) {
        return <Outlet />;
    }

    return <Layout />;
}