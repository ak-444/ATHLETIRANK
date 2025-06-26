import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../style/RegisterAndLogin.css'
import universityLogo from '../assets/Arellano_University_logo.png';

const Login = ({ setCurrentView }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData);
            alert('Login successful!');
            // Redirect or update UI as needed
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                <div className="auth-header">
                    
                    <div className="logo">
                        <img 
                            src={universityLogo} 
                            alt="Arellano University Logo" 
                            className="logo-image"
                        />
                    </div>

                    <h1 className="brand-name">Arellano University</h1>
                    <p className="brand-subtitle">ATHLETIRANK</p>
                </div>

                <div className="auth-tabs">

                    <button className="tab-btn active" onClick={() => setCurrentView('login')}>
                        Login
                    </button>

                    <button className="tab-btn" onClick={() => setCurrentView('register')}>
                        Register
                    </button>
                </div>

                <div className="auth-form-container">
                    <h2 className="form-title">Welcome Back</h2>
                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email:</label>

                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password:</label>

                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                    </form>

                </div>
            </div>
        </div>
    );
};

export default Login;