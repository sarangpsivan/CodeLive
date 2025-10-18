import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const baseURL = 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Adds the current access token to outgoing requests
axiosInstance.interceptors.request.use(
    (config) => {
        const authTokens = localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null;

        if (authTokens?.access) {
            // Check if token is expired before sending
            const user = jwtDecode(authTokens.access);
            const isExpired = Date.now() >= user.exp * 1000;

            // If expired, we rely on the response interceptor to refresh
            if (!isExpired) {
                config.headers.Authorization = `Bearer ${authTokens.access}`;
            } else {
                console.warn("Access token expired before request, attempting refresh via interceptor.");
                // Let the request proceed; the response interceptor will handle the 401
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handles token refresh on 401 errors
axiosInstance.interceptors.response.use(
    // If response is successful, just return it
    (response) => response,
    // If response is an error (like 401)
    async (error) => {
        const originalRequest = error.config;
        const authTokens = localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null;

        // Check if it's a 401 error, not a refresh token failure, and we haven't already retried
        if (error.response?.status === 401 && originalRequest.url !== `${baseURL}/api/token/refresh/` && !originalRequest._retry) {
            originalRequest._retry = true; // Mark that we've retried this request

            if (authTokens?.refresh) {
                try {
                    console.log("Attempting to refresh token...");
                    const refreshResponse = await axios.post(`${baseURL}/api/token/refresh/`, {
                        refresh: authTokens.refresh,
                    });

                    const newTokens = refreshResponse.data;
                    localStorage.setItem('authTokens', JSON.stringify(newTokens));

                    // Update the header for the original request and any future requests
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;

                    console.log("Token refreshed successfully. Retrying original request.");
                    // Retry the original request with the new token
                    return axiosInstance(originalRequest);

                } catch (refreshError) {
                    console.error("Token refresh failed:", refreshError);
                    // Clear tokens and redirect to login
                    localStorage.removeItem('authTokens');
                    window.location.href = '/login'; // Force redirect
                    return Promise.reject(refreshError);
                }
            } else {
                console.error("No refresh token available. Redirecting to login.");
                localStorage.removeItem('authTokens');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        // For other errors, just pass them along
        return Promise.reject(error);
    }
);

export default axiosInstance;