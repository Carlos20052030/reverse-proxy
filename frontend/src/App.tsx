import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import Webhooks from './pages/Webhooks';
import Billing from './pages/Billing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" /></div>}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/api-keys" element={<ApiKeys />} />
                        <Route path="/webhooks" element={<Webhooks />} />
                        <Route path="/billing" element={<Billing />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;