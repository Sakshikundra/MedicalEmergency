import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { authAPI } from '../lib/api';
import useAuth from '../lib/useAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login({ email, password });

            if (response.success) {
                login(response.data.token, response.data.user);
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = async (quickEmail, quickPassword) => {
        setEmail(quickEmail);
        setPassword(quickPassword);
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login({ email: quickEmail, password: quickPassword });

            if (response.success) {
                login(response.data.token, response.data.user);
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Login - MEDIX</title>
            </Head>

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block">
                            <h1 className="text-3xl font-bold text-primary-700">MEDIX</h1>
                        </Link>
                        <p className="mt-2 text-gray-600">Sign in to access your medical records</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-2xl shadow-card p-8">
                        <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="label">
                                    <FiMail className="inline mr-2" />
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="label">
                                    <FiLock className="inline mr-2" />
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner w-5 h-5"></div>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <Link href="/register" className="text-primary-600 font-medium hover:text-primary-700">
                                    Create Pulse ID
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Hospital Access Link */}
                    <div className="mt-6 text-center">
                        <Link href="/hospital/scan" className="text-sm text-gray-600 hover:text-primary-600">
                            Hospital Staff? Scan Patient QR Code →
                        </Link>
                    </div>

                    {/* Dev Mode Quick Login */}
                    <div className="mt-8 border-t pt-4">
                        <p className="text-xs text-gray-500 text-center mb-3 font-semibold uppercase tracking-wider">Dev Mode: Quick 1-Click Login</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('demo.patient@medix.com', 'password123')}
                                className="px-2 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium text-xs rounded transition-colors text-center shadow-sm"
                            >
                                👤 Demo Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('hospital@medix.com', 'password123')}
                                className="px-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded transition-colors text-center shadow-sm"
                            >
                                🏥 Hospital Staff
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin@medix.com', 'password123')}
                                className="px-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-xs rounded transition-colors text-center shadow-sm"
                            >
                                ⚡ Admin User
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
