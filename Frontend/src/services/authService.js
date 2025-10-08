import api from './api';

const API_URL = '/api/auth';

// 🔹 Login
export const login = async (credentials) => {
  try {
    const response = await api.post(`${API_URL}/login`, credentials);

    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// 🔹 Register
export const register = async (userData) => {
  try {
    const formData = new FormData();
    formData.append('username', userData.username);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('role', userData.role);

    if (userData.universityId) {
      formData.append('universityId', userData.universityId);
    }

    const response = await api.postFormData(`${API_URL}/register`, formData);
    return response;
  } catch (error) {
    throw error;
  }
};

// 🔹 Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 🔹 Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
