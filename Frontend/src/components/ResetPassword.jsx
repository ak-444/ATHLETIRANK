import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../style/RegisterAndLogin.css';
import universityLogo from '../assets/Arellano_University_logo.png';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [tokenValid, setTokenValid] = useState(null);

    // Verify token on component mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                setMessage('Invalid or missing reset token');
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/auth/verify-reset-token?token=${token}`);
                const data = await response.json();
                
                if (data.valid) {
                    setTokenValid(true);
                } else {
                    setTokenValid(false);
                    setMessage(data.message || 'Invalid or expired reset token');
                }
            } catch (error) {
                console.error('Token verification error:', error);
                setTokenValid(false);
                setMessage('Error verifying reset token');
            }
        };

        verifyToken();
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setMessage('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/Register&Login');
                }, 3000);
            } else {
                setMessage(data.message || 'Failed to reset password');
            }
        } catch (error) {
            setMessage('Error resetting password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === null) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-container">
                    <div className="reset-password-card">
                        <div className="reset-password-header">
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
                        <div className="reset-password-form-container">
                            <h2 className="reset-password-title">Verifying Reset Link...</h2>
                            <div className="loading-spinner">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="reset-password-header">
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

                    <div className="reset-password-form-container">
                        <h2 className="reset-password-title">Reset Your Password</h2>
                        
                        {message && (
                            <div className={`message ${message.includes('successfully') ? 'success-message' : 'error-message'}`}>
                                {message}
                            </div>
                        )}
                        
                        {tokenValid ? (
                            <form className="reset-password-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">New Password:</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter new password"
                                        required
                                        minLength="8"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm Password:</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                        required
                                        minLength="8"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="reset-password-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Resetting Password...' : 'Reset Password'}
                                </button>
                            </form>
                        ) : (
                            <div className="error-message">
                                <p>This reset link is invalid or has expired.</p>
                                <button 
                                    onClick={() => navigate('/Register&Login')}
                                    className="reset-password-btn"
                                    style={{ marginTop: '1rem' }}
                                >
                                    Back to Login
                                </button>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => navigate('/Register&Login')}
                            className="back-to-home-btn"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;