import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface UserSession {
    _id?: string;
    name: string;
    hours: number;
    quantity: number;
    price?: number;
    startTime?: Date | string;
    endTime?: Date | string;
    totalAmount?: number;
    createdAt?: Date;
    status?: 'active' | 'completed';
}

// This interface now matches the structure returned by the backend analytics endpoint.
export interface AnalyticsData {
    todaySales: number;
    monthSales: number;
    weeklySales: { date: string; sales: number }[];
    recentTransactions: UserSession[]; // Using UserSession for type safety
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the authorization token
// This MUST be defined before any functions that use the apiClient
apiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Interceptor to handle API responses and errors globally
apiClient.interceptors.response.use(
    response => response.data, // Return the data property of the response
    error => {
        console.error('API Error:', error.response?.data?.message || error.message);

        // If the error is 401 Unauthorized, log the user out
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/'; // Redirect to login
        }

        return Promise.reject(error.response?.data || error);
    }
);

export const login = async (password: string): Promise<{ token: string }> => {
    return apiClient.post(`/auth/login`, { password });
};

export const getActiveSessions = async (): Promise<{ sessions: UserSession[] }> => {
    return apiClient.get('/sessions/active');
};

export const createSession = async (sessionData: { name: string; hours: number; quantity: number, totalAmount: number }): Promise<{ data: { session: UserSession } }> => {
    return apiClient.post('/sessions', sessionData);
};

export const deleteSession = async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete(`/sessions/${id}`);
};

export const getAnalyticsKpis = async (): Promise<{ data: { todaySales: number, monthSales: number } }> => {
    return apiClient.get('/sessions/analytics/kpis');
};

export const getAnalyticsTransactions = async (params?: { startDate?: string, endDate?: string }): Promise<{ data: { recentTransactions: UserSession[] } }> => {
    return apiClient.get('/sessions/analytics/transactions', { params });
};

export const getWeeklySales = async (date: Date): Promise<{ data: { weeklySales: { name: string; sales: number }[] } }> => {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return apiClient.get(`/sessions/analytics/weekly?date=${formattedDate}`);
};

export const subscribeToPushNotifications = async (subscription: PushSubscription) => {
    return apiClient.post('/notifications/subscribe', subscription);
};