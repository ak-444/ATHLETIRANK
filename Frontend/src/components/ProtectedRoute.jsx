import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredRole, children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    console.log('ProtectedRoute Debug:', { 
        loading,
        isAuthenticated: isAuthenticated(),
        user,
        userRole: user?.role,
        requiredRole,
        localStorage_token: localStorage.getItem('token') ? 'exists' : 'missing',
        localStorage_user: localStorage.getItem('user') ? 'exists' : 'missing'
    });

    if (loading) {
        console.log('ProtectedRoute: Still loading...');
        return <div>Loading...</div>;
    }

    if (!isAuthenticated()) {
        console.log('ProtectedRoute: User not authenticated, redirecting to login');
        return <Navigate to="/Register&Login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        console.log(`ProtectedRoute: User role ${user?.role} doesn't match required role ${requiredRole}`);
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('ProtectedRoute: Access granted');
    return children ? children : <Outlet />;
};

export default ProtectedRoute;