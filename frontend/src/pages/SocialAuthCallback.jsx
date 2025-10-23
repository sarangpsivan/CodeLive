import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const SocialAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUserAndTokens } = useContext(AuthContext);

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
            setUserAndTokens(accessToken, refreshToken);
            navigate('/dashboard');
        } else {
            console.error("Social login failed: No tokens found in URL.");
            navigate('/login');
        }
    }, []); 

    return (
        <div className="flex items-center justify-center min-h-screen bg-dark-bg text-white">
            <p>Finalizing login...</p>
        </div>
    );
};

export default SocialAuthCallback;