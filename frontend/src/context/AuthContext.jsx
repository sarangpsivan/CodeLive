import { createContext, useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

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

    const loginUser = async (email, password) => {
        try {
            const response = await axiosInstance.post('/api/token/', {
                username: email, 
                password: password 
            });
            
            const data = response.data;
            if (response.status === 200) {
                setAuthTokens(data);
                const decodedUser = jwtDecode(data.access);
                setUser(decodedUser);
                localStorage.setItem('authTokens', JSON.stringify(data));
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Login failed!", error);
            alert('Login failed. Please check your email and password.');
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        delete axiosInstance.defaults.headers.common['Authorization'];
        navigate('/login');
    };
    
    const setUserAndTokens = (accessToken, refreshToken) => {
        const tokens = { access: accessToken, refresh: refreshToken };
        setAuthTokens(tokens);
        const decodedUser = jwtDecode(accessToken);
        setUser(decodedUser);
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    };
    
    useEffect(() => {
        const storedTokens = localStorage.getItem('authTokens');
        if (storedTokens) {
            const parsedTokens = JSON.parse(storedTokens);
            try {
                const decodedUser = jwtDecode(parsedTokens.access);
                if (Date.now() < decodedUser.exp * 1000) {
                    setUser(decodedUser);
                    setAuthTokens(parsedTokens);
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.access}`;
                } else {
                    console.log("Token likely expired on load, interceptor will handle refresh.");
                }
            } catch (e) {
                console.error("Error decoding token on load:", e);
                localStorage.removeItem('authTokens');
            }
        }
        setLoading(false);
    }, []);

    const contextData = useMemo(() => ({
        user,
        authTokens,
        loginUser,
        logoutUser,
        setUserAndTokens,
        setAuthTokensDirectly: setAuthTokens,
        setUserDirectly: setUser,
    }), [user, authTokens]);

    return (
        <AuthContext.Provider value={contextData}>
            {!loading ? children : <div>Loading...</div>}
        </AuthContext.Provider>
    );
};