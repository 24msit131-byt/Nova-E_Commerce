import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const colors = {
        primary: '#A68A64',
        bgPage: '#F2EBDD',
        bgCard: '#FAF7F2',
        textMain: '#4A4036',
        textSecondary: '#756A5E',
        accent: '#E0D8CC'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await api.post('/user/forgot-password', { email });
            toast.success(response.data?.message || 'If an account exists, a reset link has been sent.');
            setEmail('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to process request right now.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: colors.bgPage }}>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
                    Forgot your password?
                </h2>
                <p className="mt-3 text-center text-sm" style={{ color: colors.textSecondary }}>
                    Enter your email and we will send you a reset link.
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    className="py-10 px-6 shadow-2xl border sm:rounded-3xl sm:px-12"
                    style={{ backgroundColor: colors.bgCard, borderColor: colors.accent }}
                >
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.textSecondary }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="appearance-none block w-full px-4 py-4 border rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none transition-all text-sm"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: colors.accent,
                                    color: colors.textMain
                                }}
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white transition-all active:scale-[0.98] uppercase tracking-widest disabled:opacity-70"
                            style={{
                                backgroundColor: colors.primary,
                                boxShadow: '0 10px 20px rgba(166, 138, 100, 0.2)'
                            }}
                        >
                            {submitting ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: colors.textSecondary }}>
                        Remembered your password?{' '}
                        <Link to="/login" className="font-bold hover:underline" style={{ color: colors.primary }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
