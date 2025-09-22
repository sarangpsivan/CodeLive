// src/pages/SocialAuthCallback.jsx
import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const SocialAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUserAndTokens } = useContext(AuthContext);

    useEffect(() => {
        // The headless library sends tokens as URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
            // Use the function from our AuthContext to save the tokens
            setUserAndTokens(accessToken, refreshToken);
            // Redirect to the dashboard
            navigate('/dashboard');
        } else {
            console.error("Social login failed: No tokens found in URL.");
            navigate('/login');
        }
    }, []); // Run only once on component mount

    return (
        <div className="flex items-center justify-center min-h-screen bg-dark-bg text-white">
            <p>Finalizing login...</p>
        </div>
    );
};

export default SocialAuthCallback;