import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post(`/user/reset-password/${token}`, {
                password,
                confirmPassword
            });

            toast.success(response.data?.message || 'Password reset successful. Please sign in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reset link is invalid or expired.');
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
                    Set a new password
                </h2>
                <p className="mt-3 text-center text-sm" style={{ color: colors.textSecondary }}>
                    Choose a strong password with at least 8 characters.
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
                                New Password
                            </label>
                            <input
                                type="password"
                                minLength={8}
                                required
                                className="appearance-none block w-full px-4 py-4 border rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none transition-all text-sm"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: colors.accent,
                                    color: colors.textMain
                                }}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.textSecondary }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                minLength={8}
                                required
                                className="appearance-none block w-full px-4 py-4 border rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none transition-all text-sm"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: colors.accent,
                                    color: colors.textMain
                                }}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {submitting ? 'Updating...' : 'Reset Password'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: colors.textSecondary }}>
                        Back to{' '}
                        <Link to="/login" className="font-bold hover:underline" style={{ color: colors.primary }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
