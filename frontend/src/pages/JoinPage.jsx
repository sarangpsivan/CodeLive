// src/pages/JoinPage.jsx
import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';

const JoinPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const code = searchParams.get('code');

        if (!code) {
            // If there's no code, just go to the dashboard
            navigate('/dashboard');
            return;
        }

        if (!user) {
            // If user is not logged in, redirect to login.
            // A more advanced version could save the code and use it after login.
            navigate('/login');
            return;
        }

        // If user is logged in and there is a code, try to join the project
        const joinProject = async () => {
            try {
                await axiosInstance.post('/api/projects/join/', { room_code: code });
                alert('Successfully joined project!');
                navigate('/dashboard'); // Redirect to dashboard to see the new project
            } catch (err) {
                console.error("Failed to join project", err);
                alert(err.response?.data?.error || 'Failed to join project.');
                navigate('/dashboard'); // Redirect anyway
            }
        };

        joinProject();
    }, []); // This effect runs only once when the page loads

    return (
        <div className="flex items-center justify-center min-h-screen bg-dark-bg text-white">
            <p>Joining project...</p>
        </div>
    );
};

export default JoinPage;