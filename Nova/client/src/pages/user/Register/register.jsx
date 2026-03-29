import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { isGoogleAuthEnabled } from '../../../utils/googleAuthConfig.js';
import api from '../../../services/api.js';

const Register = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        agreeToTerms: false
    });

    // Decisions based on the established Nova Theme
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        bgLeft: '#2C2621',      // Deep Brown (Visual Anchor)
        bgRight: '#FAF7F2',     // Warm Cream
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
            const response = await api.post('/user/register', formData);
            if (response.data.status === 'success') {
                const token = response.data.token;
                const userData = response.data.data.user;

                login(userData, token);
                navigate('/');
            }
        } catch (error) {
            console.error("Registration Error:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post('/user/google-login', {
                credential: credentialResponse.credential
            });

            if (response.data.status === 'success') {
                const token = response.data.token;
                const userData = response.data.data.user;

                login(userData, token);
                navigate('/');
            }
        } catch (error) {
            console.error("Google Login Error:", error.response?.data || error.message);
            toast.error('Google Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side: Brand Story (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 items-center justify-center p-16 text-white relative overflow-hidden" style={{ backgroundColor: colors.bgLeft }}>
                {/* Subtle Background Pattern or Glow */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: colors.primary }}></div>
                </div>

                <div className="max-w-md space-y-10 relative z-10">
                    <div className="flex items-center space-x-3 group">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center rotate-6 group-hover:rotate-0 transition-transform duration-500 shadow-xl" style={{ backgroundColor: colors.primary }}>
                            <span className="text-white font-serif italic text-2xl font-black">N</span>
                        </div>
                        <span className="text-3xl font-bold tracking-tighter uppercase">Nova</span>
                    </div>

                    <h2 className="text-5xl font-bold leading-[1.1] tracking-tight">
                        Transforming houses into <span className="italic font-serif" style={{ color: colors.primary }}>pure sanctuaries.</span>
                    </h2>

                    <p className="text-lg opacity-80 leading-relaxed">
                        Join our community of over 10,000+ homes choosing sustainable, effective, and aesthetic care every day.
                    </p>

                    {/* Refined Testimonial */}
                    <div className="pt-10 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <p className="italic opacity-90 text-lg">"Nova didn't just clean my home; it elevated my entire living experience. The scents are divine and the results are unmatched."</p>
                        <div className="mt-6 flex items-center space-x-4">
                            <div className="h-1 w-12" style={{ backgroundColor: colors.primary }}></div>
                            <p className="font-bold text-sm uppercase tracking-widest">Sarah J., Lifestyle Curator</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16" style={{ backgroundColor: colors.bgRight }}>
                <div className="max-w-md w-full space-y-10">
                    <div className="text-center lg:text-left">
                        <h2 className="text-4xl font-black tracking-tighter uppercase" style={{ color: colors.textMain }}>Create Account</h2>
                        <p className="mt-3 text-[15px] font-medium" style={{ color: colors.textSecondary }}>
                            Already a member of the collective?{' '}
                            <Link to="/login" className="font-bold transition-colors hover:underline" style={{ color: colors.primary }}>
                                Sign in here
                            </Link>
                        </p>
                    </div>

                    <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.textSecondary }}>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    className="block w-full px-5 py-4 border rounded-2xl shadow-sm focus:outline-none transition-all text-sm"
                                    style={{ backgroundColor: '#FFFFFF', borderColor: colors.accent, color: colors.textMain }}
                                    placeholder="e.g. Rahul Prajapati"
                                    autoComplete="name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.textSecondary }}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="block w-full px-5 py-4 border rounded-2xl shadow-sm focus:outline-none transition-all text-sm"
                                    style={{ backgroundColor: '#FFFFFF', borderColor: colors.accent, color: colors.textMain }}
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.textSecondary }}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="block w-full px-5 py-4 border rounded-2xl shadow-sm focus:outline-none transition-all text-sm"
                                    style={{ backgroundColor: '#FFFFFF', borderColor: colors.accent, color: colors.textMain }}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                required
                                className="mt-1 h-4 w-4 rounded border-gray-300 focus:ring-0 cursor-pointer"
                                style={{ color: colors.primary }}
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                            />
                            <label className="ml-3 block text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                                I agree to the <a href="#" className="font-bold hover:underline" style={{ color: colors.textMain }}>Terms of Service</a> and <a href="#" className="font-bold hover:underline" style={{ color: colors.textMain }}>Privacy Policy</a>.
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white transition-all active:scale-[0.98] shadow-lg uppercase tracking-widest"
                            style={{
                                backgroundColor: colors.primary,
                                boxShadow: `0 10px 20px rgba(166, 138, 100, 0.2)`
                            }}
                        >
                            Begin Journey
                        </button>

                        {/* Social Sign Up Divider */}
                        <div className="relative mt-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t" style={{ borderColor: colors.accent }}></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
                                <span className="px-4 font-bold" style={{ backgroundColor: colors.bgRight, color: colors.textSecondary }}>Or Discover with</span>
                            </div>
                        </div>

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
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;