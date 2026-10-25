import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import './App.css';

function App() {
    const isAuthenticated = !!localStorage.getItem('token');

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
                <Route path="/api-keys" element={isAuthenticated ? <ApiKeys /> : <Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;