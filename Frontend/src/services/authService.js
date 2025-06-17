import API from './api';

class AuthService {
    // Test connection to backend
    async testConnection() {
        try {
            const response = await API.get('/test');
            return response.data;
        } catch (error) {
            throw new Error('Backend connection failed: ' + error.message);
        }
    }

    // Register new user
    async register(userData) {
        try {
            const response = await API.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await API.post('/auth/login', credentials);
            const { token, user } = response.data;
            
            // Store token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Check if user is logged in
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
}

export default new AuthService();