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
            navigate('/dashboard');
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        const joinProject = async () => {
            try {
                await axiosInstance.post('/api/projects/join/', { room_code: code });
                alert('Successfully joined project!');
                navigate('/dashboard');
            } catch (err) {
                console.error("Failed to join project", err);
                alert(err.response?.data?.error || 'Failed to join project.');
                navigate('/dashboard');
            }
        };

        joinProject();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-dark-bg text-white">
            <p>Joining project...</p>
        </div>
    );
};

export default JoinPage;