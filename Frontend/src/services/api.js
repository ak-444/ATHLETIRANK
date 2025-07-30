import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Your backend URL
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to include auth token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to your actual login route
            window.location.href = '/Register&Login';
        }
        return Promise.reject(error);
    }
);

export default API;