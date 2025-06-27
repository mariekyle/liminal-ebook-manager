import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { NotificationContext } from '../../context/NotificationContext';
import authService from '../../services/auth';
import Button from '../common/Button';
import Loading from '../common/Loading';
import '../../styles/auth.css';

const RegisterForm = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(AppContext);
    const { showNotification } = useContext(NotificationContext);
    
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        displayName: ''
    });
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        // Username validation
        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }
        
        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one number';
        }
        
        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        // Name validation
        if (formData.firstName && formData.firstName.length > 100) {
            newErrors.firstName = 'First name is too long';
        }
        
        if (formData.lastName && formData.lastName.length > 100) {
            newErrors.lastName = 'Last name is too long';
        }
        
        if (formData.displayName && formData.displayName.length > 100) {
            newErrors.displayName = 'Display name is too long';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            const userData = {
                email: formData.email,
                username: formData.username,
                password: formData.password,
                first_name: formData.firstName || undefined,
                last_name: formData.lastName || undefined,
                display_name: formData.displayName || undefined
            };
            
            const response = await authService.register(userData);
            
            if (response.success) {
                setUser(response.data.user);
                showNotification('Registration successful! Welcome to Liminal eBook Manager.', 'success');
                navigate('/library');
            } else {
                showNotification(response.message || 'Registration failed', 'error');
            }
        } catch (error) {
            showNotification(error.message || 'Registration failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="auth-form-container">
            <div className="auth-form-card">
                <h2>Create Account</h2>
                <p className="auth-subtitle">Join Liminal eBook Manager</p>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={errors.firstName ? 'error' : ''}
                                placeholder="First name (optional)"
                                disabled={isLoading}
                            />
                            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={errors.lastName ? 'error' : ''}
                                placeholder="Last name (optional)"
                                disabled={isLoading}
                            />
                            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="displayName">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            className={errors.displayName ? 'error' : ''}
                            placeholder="Display name (optional)"
                            disabled={isLoading}
                        />
                        {errors.displayName && <span className="error-message">{errors.displayName}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="Enter your email"
                            disabled={isLoading}
                            required
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="username">Username *</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={errors.username ? 'error' : ''}
                            placeholder="Choose a username"
                            disabled={isLoading}
                            required
                        />
                        {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Create a password"
                            disabled={isLoading}
                            required
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                        <div className="password-requirements">
                            <small>Password must be at least 8 characters with uppercase, lowercase, and number</small>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password *</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? 'error' : ''}
                            placeholder="Confirm your password"
                            disabled={isLoading}
                            required
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                    
                    <Button
                        type="submit"
                        className="auth-button primary"
                        disabled={isLoading}
                        fullWidth
                    >
                        {isLoading ? <Loading size="small" /> : 'Create Account'}
                    </Button>
                </form>
                
                <div className="auth-links">
                    <span>Already have an account?</span>
                    <a href="/login" className="link">Sign in</a>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm; 