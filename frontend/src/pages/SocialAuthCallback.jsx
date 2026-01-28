import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Terminal } from 'lucide-react';

const SocialAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUserAndTokens } = useContext(AuthContext);

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
            setUserAndTokens(accessToken, refreshToken);
            // Small delay for visual effect
            setTimeout(() => navigate('/dashboard'), 1500);
        } else {
            console.error("Social login failed: No tokens found");
            navigate('/login');
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] text-white font-sans">
            <div className="relative">
                <div className="absolute inset-0 bg-[var(--primary-purple)] blur-2xl opacity-20 rounded-full animate-pulse"></div>
                <div className="relative p-6 glass-card rounded-2xl border border-white/10 flex flex-col items-center">
                    <Terminal className="w-10 h-10 text-[var(--primary-purple)] mb-4 animate-bounce" />
                    <h2 className="text-xl font-bold font-display mb-2">Authenticating</h2>
                    <p className="text-sm text-gray-400">Setting up your secure session...</p>

                    <div className="mt-6 flex gap-1">
                        <div className="w-2 h-2 bg-[var(--primary-purple)] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-[var(--primary-purple)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[var(--primary-purple)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialAuthCallback;