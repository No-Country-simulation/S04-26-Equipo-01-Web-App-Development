import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: baseURL,
    headers:{
        'Content-Type': 'application/json',
    }
});

const isSeedAdminSession = (): boolean => {
    const token = localStorage.getItem('token');
    if (token !== 'admin-token') {
        return false;
    }

    const authUser = localStorage.getItem('authUser');
    if (!authUser) {
        return false;
    }

    try {
        const parsedUser = JSON.parse(authUser) as { role?: string; email?: string };
        return parsedUser.role === 'ADMIN' && parsedUser.email === 'admin01@admin.com';
    } catch {
        return false;
    }
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const requestUrl = error.config?.url ?? '';
            const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

            if (!isAuthEndpoint && !isSeedAdminSession()) {
                localStorage.removeItem('token');
                localStorage.removeItem('authUser');

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;