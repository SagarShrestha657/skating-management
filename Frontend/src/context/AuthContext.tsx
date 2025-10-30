import React, { createContext, useState, useContext, useEffect,type ReactNode } from 'react';
import { login as apiLogin } from '../services/api';

export type UserRole = 'admin' | 'employee' | null;

// Helper to decode JWT payload (for client-side role display only)
// IMPORTANT: This is for UI purposes. The backend MUST verify the token's signature for actual authorization.
const decodeJwt = (token: string | null): UserRole => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.role || null;
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};

interface AuthContextType {
    role: UserRole;
    isAuthenticated: boolean;
    login: (credentials: { username: string; password: string }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authToken, setAuthToken] = useState<string | null>(() => {
        return localStorage.getItem('authToken');
    });
    const [role, setRole] = useState<UserRole>(decodeJwt(authToken)); // Derive role from token

    useEffect(() => {
        if (authToken) {
            localStorage.setItem('authToken', authToken);
            setRole(decodeJwt(authToken)); // Update role when token changes
        } else {
            localStorage.removeItem('authToken');
            setRole(null);
        }
    }, [authToken]);

    const login = async (credentials: { username: string; password: string }) => {
        const { token } = await apiLogin(credentials);
        setAuthToken(token);
    };

    const logout = () => {
        setAuthToken(null);
    };

    const isAuthenticated = !!role;

    return (
        <AuthContext.Provider value={{ role, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
