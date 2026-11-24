import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { clearToken, getToken, saveToken } from '../services/authToken';

const AuthContext = createContext(null);

// Logged-in user + login/register/logout (POST /api/auth/...). See API.md.
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(() => Boolean(getToken())); // validating a saved token

    // A saved token may have expired (1h by default): confirm it with GET /api/auth/me
    useEffect(() => {
        if (!getToken()) return undefined;
        const controller = new AbortController();
        api.get('/api/auth/me', { signal: controller.signal })
            .then((res) => setUser(res.data.user))
            .catch((err) => {
                if (controller.signal.aborted) return;
                if (err.response?.status === 401) clearToken();
                else console.warn('Could not restore the session:', getErrorMessage(err));
            })
            .finally(() => { if (!controller.signal.aborted) setChecking(false); });
        return () => controller.abort();
    }, []);

    const login = useCallback(async ({ username, password, remember }) => {
        const res = await api.post('/api/auth/login', { username, password });
        saveToken(res.data.token, remember);
        setUser(res.data.user);
        return res.data.user;
    }, []);

    const register = useCallback(async ({ username, email, password, phone }) => {
        const res = await api.post('/api/auth/register', { username, email, password, phone: phone || undefined });
        saveToken(res.data.token, true);
        setUser(res.data.user);
        return res.data.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (err) {
            // The token is removed below anyway, so the user is signed out on this device
            console.warn('Logout request failed:', getErrorMessage(err));
        }
        clearToken();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, checking, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
    return context;
}
