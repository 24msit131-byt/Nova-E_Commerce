import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { isGoogleAuthEnabled } from '../../../utils/googleAuthConfig.js';
import api from '../../../services/api.js';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const colors = {
        primary: '#A68A64',     // Earthy Gold
        bgPage: '#F2EBDD',      // Hero Beige
        bgCard: '#FAF7F2',      // Warm Cream
        textMain: '#4A4036',    // Dark Brown
        textSecondary: '#756A5E', // Medium Brown
        accent: '#E0D8CC'       // Light Beige
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const normalizedEmail = formData.email.trim().toLowerCase();

            const response = await api.post('/user/login', {
                email: normalizedEmail,
                password: formData.password
            });

            if (response.data.status === 'success') {
                const { role } = response.data.data.user;
                const token = response.data.token;
                const userData = response.data.data.user;

                login(userData, token);

                if (role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error("Login Error:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post('/user/google-login', {
                credential: credentialResponse.credential
            });

            if (response.data.status === 'success') {
                const { role } = response.data.data.user;
                const token = response.data.token;
                const userData = response.data.data.user;

                login(userData, token);

                if (role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error("Google Login Error:", error.response?.data || error.message);
            toast.error('Google Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: colors.bgPage }}>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Brand Logo - Nova Style */}
                <div className="flex justify-center">
                    <Link to="/" className="relative h-14 w-14 flex items-center justify-center group">
                        <div
                            className="absolute inset-0 rounded-2xl rotate-6 group-hover:rotate-0 transition-transform duration-500 shadow-lg"
                            style={{ backgroundColor: colors.primary }}
                        ></div>
                        <span className="relative text-white font-serif italic text-2xl font-black">N</span>
                    </Link>
                </div>

                <h2 className="mt-8 text-center text-3xl font-extrabold tracking-tight" style={{ color: colors.textMain }}>
                    Welcome back to <span className="uppercase">Nova</span>
                </h2>
                <p className="mt-3 text-center text-sm" style={{ color: colors.textSecondary }}>
                    Or{' '}
                    <Link to="/register" className="font-bold hover:underline" style={{ color: colors.primary }}>
                        begin your home care journey for free
                    </Link>
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    className="py-10 px-6 shadow-2xl border sm:rounded-3xl sm:px-12"
                    style={{ backgroundColor: colors.bgCard, borderColor: colors.accent }}
                >
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.textSecondary }}>
                                Email Address
                            </label>
                            <div className="mt-1">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full px-4 py-4 border rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none transition-all text-sm"
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        borderColor: colors.accent,
                                        color: colors.textMain
                                    }}
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.textSecondary }}>
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-4 py-4 border rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none transition-all text-sm"
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        borderColor: colors.accent,
                                        color: colors.textMain
                                    }}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    name="rememberMe"
                                    type="checkbox"
                                    className="h-4 w-4 focus:ring-0 border-gray-300 rounded cursor-pointer"
                                    style={{ color: colors.primary }}
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <label className="ml-2 block text-sm cursor-pointer font-medium" style={{ color: colors.textSecondary }}>
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-bold hover:underline" style={{ color: colors.primary }}>
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white transition-all active:scale-[0.98] uppercase tracking-widest"
                                style={{
                                    backgroundColor: colors.primary,
                                    boxShadow: `0 10px 20px rgba(166, 138, 100, 0.2)`
                                }}
                            >
                                Sign In
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t" style={{ borderColor: colors.accent }}></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-tighter">
                                <span className="px-4 font-bold" style={{ backgroundColor: colors.bgCard, color: colors.textSecondary }}>
                                    Quiet Luxury Access
                                </span>
                            </div>
                        </div>

                        {/* Social Login Button */}
                        <div className="mt-8 flex justify-center">
                            {isGoogleAuthEnabled ? (
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => {
                                        console.log('Login Failed');
                                        toast.error('Google Login Failed');
                                    }}
                                    type="standard"
                                    theme="outline"
                                    size="large"
                                    text="signin_with"
                                    shape="pill"
                                    logo_alignment="left"
                                    locale="en"
                                    width={360}
                                />
                            ) : (
                                <p className="text-xs font-medium text-center" style={{ color: colors.textSecondary }}>
                                    Google Sign-In is temporarily unavailable for this app origin.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;