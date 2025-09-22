import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    const [user, setUser] = useState(() =>
        localStorage.getItem('authTokens') ? jwtDecode(localStorage.getItem('authTokens')) : null
    );
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const baseURL = 'http://localhost:8000';

    const loginUser = async (username, password) => {
        try {
            const response = await axios.post(`${baseURL}/api/token/`, { username, password });
            const data = response.data;
            if (response.status === 200) {
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                localStorage.setItem('authTokens', JSON.stringify(data));
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Login failed!", error);
            alert('Login failed. Please check your username and password.');
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    };
    
    // New function to handle setting state after social login
    const setUserAndTokens = (accessToken, refreshToken) => {
        const tokens = { access: accessToken, refresh: refreshToken };
        setAuthTokens(tokens);
        setUser(jwtDecode(accessToken));
        localStorage.setItem('authTokens', JSON.stringify(tokens));
    };
    
    useEffect(() => {
        const updateToken = async () => {
            if (!authTokens) {
                setLoading(false);
                return;
            }
            try {
                const response = await axios.post(`${baseURL}/api/token/refresh/`, {
                    refresh: authTokens.refresh
                });
                const data = response.data;
                if (response.status === 200) {
                    setAuthTokens(data);
                    setUser(jwtDecode(data.access));
                    localStorage.setItem('authTokens', JSON.stringify(data));
                } else {
                    logoutUser();
                }
            } catch (error) {
                logoutUser();
            }

            if (loading) {
                setLoading(false);
            }
        };

        if (loading) {
            updateToken();
        }

        const fourMinutes = 1000 * 60 * 4;
        const interval = setInterval(updateToken, fourMinutes);
        return () => clearInterval(interval);

    }, [authTokens, loading]);

    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        setUserAndTokens, // Export the new function
    };

    return <AuthContext.Provider value={contextData}>{!loading && children}</AuthContext.Provider>;
};