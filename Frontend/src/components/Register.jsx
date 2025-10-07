import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../style/RegisterAndLogin.css'
import { Link } from "react-router-dom";
import universityLogo from '../assets/Arellano_University_logo.png'; 

const Register = ({ setCurrentView }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'staff',
        universityId: null 
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    
    const { register } = useAuth();

    // Validate password strength
    const validatePasswordStrength = (password) => {
        return {
            hasMinLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Update password strength indicators when password changes
        if (name === 'password') {
            setPasswordStrength(validatePasswordStrength(value));
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleRoleSelect = (role) => {
        setFormData({
            ...formData,
            role: role
        });
    };

    // Handle ID image upload
    const handleIdUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload a valid image file (JPG, JPEG, or PNG)');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            setFormData({
                ...formData,
                universityId: file
            });
            
            setError(''); // Clear any previous errors
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
  
        setError('');
        setSuccess('');

        console.log('Submitting form:', {
            ...formData,
            universityId: formData.universityId ? formData.universityId.name : 'No file'
        });

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Strong password validation
        const strength = validatePasswordStrength(formData.password);
        if (!strength.hasMinLength) {
            setError('Password must be at least 8 characters long');
            return;
        }
        if (!strength.hasUppercase) {
            setError('Password must contain at least one uppercase letter');
            return;
        }
        if (!strength.hasLowercase) {
            setError('Password must contain at least one lowercase letter');
            return;
        }
        if (!strength.hasNumber) {
            setError('Password must contain at least one number');
            return;
        }
        if (!strength.hasSpecialChar) {
            setError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
            return;
        }

        // Check if ID is uploaded
        if (!formData.universityId) {
            setError('Please upload your university ID');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            setSuccess('Registration successful! Your account is pending approval. You can login once approved.');
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'staff',
                universityId: null
            });
            setPasswordStrength({
                hasMinLength: false,
                hasUppercase: false,
                hasLowercase: false,
                hasNumber: false,
                hasSpecialChar: false
            });
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
                    <p className="brand-description">Basketball & Volleyball Tournament System</p>
                </div>

                
                <div className="auth-tabs">
                    <button 
                        className="tab-btn"
                        onClick={() => setCurrentView('login')}
                    >
                        Login
                    </button>
                    <button 
                        className="tab-btn active"
                        onClick={() => setCurrentView('register')}
                    >
                        Register
                    </button>
                </div>

                
                <div className="auth-form-container">
                    <h2 className="form-title">Create Account</h2>
                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="username"
                                className="form-input"
                                placeholder="Enter your full name"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            {/* Password Strength Indicators */}
                            {formData.password && (
                                <div className="password-requirements">
                                    <p className="requirements-title">Password must contain:</p>
                                    <ul className="requirements-list">
                                        <li className={passwordStrength.hasMinLength ? 'valid' : 'invalid'}>
                                            {passwordStrength.hasMinLength ? '✓' : '✗'} At least 8 characters
                                        </li>
                                        <li className={passwordStrength.hasUppercase ? 'valid' : 'invalid'}>
                                            {passwordStrength.hasUppercase ? '✓' : '✗'} One uppercase letter
                                        </li>
                                        <li className={passwordStrength.hasLowercase ? 'valid' : 'invalid'}>
                                            {passwordStrength.hasLowercase ? '✓' : '✗'} One lowercase letter
                                        </li>
                                        <li className={passwordStrength.hasNumber ? 'valid' : 'invalid'}>
                                            {passwordStrength.hasNumber ? '✓' : '✗'} One number
                                        </li>
                                        <li className={passwordStrength.hasSpecialChar ? 'valid' : 'invalid'}>
                                            {passwordStrength.hasSpecialChar ? '✓' : '✗'} One special character (!@#$%^&*)
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Role</label>
                            <div className="role-selector">
                                <button
                                    type="button"
                                    className={`role-btn ${formData.role === 'admin' ? 'active' : ''}`}
                                    onClick={() => handleRoleSelect('admin')}
                                >
                                    Admin
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${formData.role === 'staff' ? 'active' : ''}`}
                                    onClick={() => handleRoleSelect('staff')}
                                >
                                    Staff
                                </button>
                            </div>
                        </div>

                        {/* ID Upload Section */}
                        <div className="form-group">
                            <label className="form-label">University ID</label>
                            <div className="id-upload-container">
                                <input
                                    type="file"
                                    id="universityId"
                                    name="universityId"
                                    accept="image/*"
                                    onChange={handleIdUpload}
                                    className="file-input"
                                    required
                                />
                                <label htmlFor="universityId" className="file-label">
                                    {formData.universityId ? 'Change ID Image' : 'Upload University ID'}
                                </label>
                                <p className="file-help-text">
                                    Upload a clear photo of your university ID (JPG, PNG, max 5MB)
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                    <Link 
                        to="/" 
                        className="back-to-home-btn"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;