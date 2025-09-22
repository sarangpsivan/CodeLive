// src/utils/PublicRoute.jsx
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PublicRoute = () => {
    const { user } = useContext(AuthContext);
    // If a user is logged in, redirect them away from public pages
    return user ? <Navigate to="/dashboard" /> : <Outlet />;
};

export default PublicRoute;