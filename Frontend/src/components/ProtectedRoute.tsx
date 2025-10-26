import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext.tsx';

interface ProtectedRouteProps {
    allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { role } = useAuth();

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;