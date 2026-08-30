import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function useAuth(redirectIfNotAuth = true) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                setLoading(false);
                if (redirectIfNotAuth) {
                    router.push('/login');
                }
                return;
            }

            try {
                setUser(JSON.parse(userData));
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                if (redirectIfNotAuth) {
                    router.push('/login');
                }
            }

            setLoading(false);
        };

        checkAuth();
    }, [router, redirectIfNotAuth]);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return { user, loading, login, logout };
}
