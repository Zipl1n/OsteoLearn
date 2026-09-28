import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
    id: number;
    name: string;
    email: string;
    lgpd_consent: boolean;
    lgpd_consent_version: string;
    lgpd_consent_at: string;
    date_joined: string;
}

interface AuthResponse2FA {
    requires2FA: boolean;
    email: string;
    message?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthResponse2FA>;
    register: (name: string, email: string, password: string, lgpdConsent: boolean) => Promise<AuthResponse2FA>;
    verify2FA: (email: string, code: string) => Promise<void>;
    resend2FA: (email: string) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<string>;
    confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<string>;
    logout: () => Promise<void>;
    exportMyData: () => Promise<void>;
    deleteMyAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStoredData() {
            const params = new URLSearchParams(window.location.search);
            const urlToken = params.get('token');
            const urlRefresh = params.get('refresh');

            if (urlToken) {
                console.log('Token JWT recebido do Google com sucesso!');
                localStorage.setItem('@OsteoLearn:token', urlToken);
                if (urlRefresh) localStorage.setItem('@OsteoLearn:refresh', urlRefresh);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            const storedToken = localStorage.getItem('@OsteoLearn:token');
            if (storedToken) {
                try {
                    const response = await api.get('auth/me/');
                    console.log('Usuário logado:', response.data);
                    setUser(response.data);
                } catch (err) {
                    console.error('Erro ao validar token com auth/me/:', err);
                    localStorage.removeItem('@OsteoLearn:token');
                    localStorage.removeItem('@OsteoLearn:refresh');
                }
            }
            setLoading(false);
        }
        loadStoredData();
    }, []);

    const login = async (email: string, password: string): Promise<AuthResponse2FA> => {
        const response = await api.post('auth/login/', { email, password });
        return {
            requires2FA: response.data.requires_2fa,
            email: response.data.email,
            message: response.data.message,
        };
    };

    const register = async (name: string, email: string, password: string, lgpdConsent: boolean): Promise<AuthResponse2FA> => {
        const response = await api.post('auth/register/', {
            name,
            email,
            password,
            lgpd_consent: lgpdConsent,
        });
        return {
            requires2FA: response.data.requires_2fa,
            email: response.data.email,
            message: response.data.message,
        };
    };

    const verify2FA = async (email: string, code: string) => {
        const response = await api.post('auth/2fa/verify/', { email, code });
        const { access, refresh } = response.data.tokens;
        const userData = response.data.user;

        localStorage.setItem('@OsteoLearn:token', access);
        localStorage.setItem('@OsteoLearn:refresh', refresh);
        setUser(userData);
    };

    const resend2FA = async (email: string) => {
        await api.post('auth/2fa/resend/', { email });
    };

    const requestPasswordReset = async (email: string): Promise<string> => {
        const response = await api.post('auth/password/reset/request/', { email });
        return response.data.message;
    };


    const confirmPasswordReset = async (email: string, code: string, newPassword: string): Promise<string> => {
        const response = await api.post('auth/password/reset/confirm/', {
            email,
            code,
            new_password: newPassword,
        });
        return response.data.message;
    };

    const logout = async () => {
        try {
            await api.post('auth/logout/');
        } catch {

        }
        localStorage.removeItem('@OsteoLearn:token');
        localStorage.removeItem('@OsteoLearn:refresh');
        setUser(null);
    };

    const exportMyData = async () => {
        const response = await api.get('auth/lgpd/export/');
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `osteolearn_dados_lgpd_${user?.name.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const deleteMyAccount = async () => {
        try {
            await api.delete('auth/me/delete/');
        } catch (err) {
            console.error('Erro ao excluir conta:', err);
        } finally {
            localStorage.removeItem('@OsteoLearn:token');
            localStorage.removeItem('@OsteoLearn:refresh');
            setUser(null);
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            verify2FA,
            resend2FA,
            requestPasswordReset,
            confirmPasswordReset,
            logout,
            exportMyData,
            deleteMyAccount,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);