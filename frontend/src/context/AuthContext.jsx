import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance'; // Use our configured instance

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    const [user, setUser] = useState(() =>
        localStorage.getItem('authTokens') ? jwtDecode(localStorage.getItem('authTokens')) : null
    );
    // Keep loading state to prevent rendering before auth status is confirmed
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const loginUser = async (email, password) => {
        try {
            // THE FIX: The backend expects a 'username' field, not 'email'.
            // We pass the email variable as the value for the 'username' key.
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
        // Remove auth header
        delete axiosInstance.defaults.headers.common['Authorization'];
        navigate('/login');
    };
    
    // Function for social auth callback
    const setUserAndTokens = (accessToken, refreshToken) => {
        const tokens = { access: accessToken, refresh: refreshToken };
        setAuthTokens(tokens);
        const decodedUser = jwtDecode(accessToken);
        setUser(decodedUser);
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        // Set default header
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    };
    
    // Simplified useEffect: Just check local storage on initial load
    useEffect(() => {
        const storedTokens = localStorage.getItem('authTokens');
        if (storedTokens) {
            const parsedTokens = JSON.parse(storedTokens);
            try {
                const decodedUser = jwtDecode(parsedTokens.access);
                // Basic check if token seems expired (interceptor handles actual refresh)
                if (Date.now() < decodedUser.exp * 1000) {
                    setUser(decodedUser);
                    setAuthTokens(parsedTokens);
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.access}`;
                } else {
                    // If token seems expired, let interceptor handle it on the first API call
                    console.log("Token likely expired on load, interceptor will handle refresh.");
                }
            } catch (e) {
                console.error("Error decoding token on load:", e);
                // Invalid token, clear storage
                localStorage.removeItem('authTokens');
            }
        }
        setLoading(false); // Auth status determined (or no token found)
    }, []);

    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        setUserAndTokens,
        // Expose setAuthTokens and setUser if needed by interceptor/other parts
        setAuthTokensDirectly: setAuthTokens, 
        setUserDirectly: setUser,
    };

    // Render children only after loading is complete
    return (
        <AuthContext.Provider value={contextData}>
            {!loading ? children : <div>Loading...</div> /* Or a spinner component */}
        </AuthContext.Provider>
    );
};