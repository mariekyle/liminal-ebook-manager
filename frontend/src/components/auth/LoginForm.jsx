import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { NotificationContext } from '../../context/NotificationContext';
import authService from '../../services/auth';
import Button from '../common/Button';
import Loading from '../common/Loading';
import '../../styles/auth.css';

const LoginForm = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(AppContext);
    const { showNotification } = useContext(NotificationContext);
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
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
            const response = await authService.login(formData);
            
            if (response.success) {
                setUser(response.data.user);
                showNotification('Login successful!', 'success');
                navigate('/library');
            } else {
                showNotification(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            showNotification(error.message || 'Login failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="auth-form-container">
            <div className="auth-form-card">
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Sign in to your account</p>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="Enter your email"
                            disabled={isLoading}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>
                    
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            <span className="checkmark"></span>
                            Remember me
                        </label>
                    </div>
                    
                    <Button
                        type="submit"
                        className="auth-button primary"
                        disabled={isLoading}
                        fullWidth
                    >
                        {isLoading ? <Loading size="small" /> : 'Sign In'}
                    </Button>
                </form>
                
                <div className="auth-links">
                    <a href="/forgot-password" className="link">Forgot password?</a>
                    <span className="divider">•</span>
                    <a href="/register" className="link">Create account</a>
                </div>
            </div>
        </div>
    );
};

export default LoginForm; 