import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { jwtDecode } from 'jwt-decode';

interface User {
    user_id: string;
    email: string;
    full_name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAdmin: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (!storedToken || storedToken.split('.').length !== 3) {
                if (storedToken) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
                setIsLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode<{ exp?: number }>(storedToken);
                if (typeof decoded.exp !== 'number' || decoded.exp * 1000 < Date.now()) {
                    throw new Error('Token expired');
                }
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsLoading(false);
                return;
            }

            setToken(storedToken);

            try {
                const response = await api.get('/api/auth/me');
                setUser(response.data);
            } catch (error) {
                const isNetworkError =
                    error instanceof TypeError ||
                    (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ERR_NETWORK');

                if (isNetworkError) {
                    // Backend not reachable yet — keep token, user can retry
                    const stored = localStorage.getItem('user');
                    if (stored) {
                        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
                    }
                } else {
                    // Auth rejected (401, invalid token, etc.) — clear session
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();

        const handleUnauthorized = () => {
            logout();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        };

        window.addEventListener('auth-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAdmin: user?.role === 'admin',
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
