import { Outlet, Link, useNavigate } from 'react-router-dom';

export function Layout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Dashboard
                            </Link>
                            <span className="text-gray-300">/</span>
                            <Link
                                to="/api-keys"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md transition-colors"
                            >
                                Gerenciar API Keys
                            </Link>
                            <Link
                                to="/webhooks"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md transition-colors"
                            >
                                Gerenciar Webhooks
                            </Link>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
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