import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PublicRoute = () => {
    const { user } = useContext(AuthContext);
    return user ? <Navigate to="/dashboard" /> : <Outlet />;
};

export default PublicRoute;