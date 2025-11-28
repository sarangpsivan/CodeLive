import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const authTokens = localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null;

        if (authTokens?.access) {
            const user = jwtDecode(authTokens.access);
            const isExpired = Date.now() >= user.exp * 1000;

            if (!isExpired) {
                config.headers.Authorization = `Bearer ${authTokens.access}`;
            } else {
                console.warn("Access token expired before request, attempting refresh via interceptor.");
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const authTokens = localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null;

        if (error.response?.status === 401 && originalRequest.url !== `${baseURL}/api/token/refresh/` && !originalRequest._retry) {
            originalRequest._retry = true; 

            if (authTokens?.refresh) {
                try {
                    console.log("Attempting to refresh token...");
                    const refreshResponse = await axios.post(`${baseURL}/api/token/refresh/`, {
                        refresh: authTokens.refresh,
                    });

                    const newTokens = refreshResponse.data;
                    localStorage.setItem('authTokens', JSON.stringify(newTokens));

                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;

                    console.log("Token refreshed successfully. Retrying original request.");
                    return axiosInstance(originalRequest);

                } catch (refreshError) {
                    console.error("Token refresh failed:", refreshError);
                    localStorage.removeItem('authTokens');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                console.error("No refresh token available. Redirecting to login.");
                localStorage.removeItem('authTokens');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;