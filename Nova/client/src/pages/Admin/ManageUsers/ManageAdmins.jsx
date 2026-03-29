import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaUserShield, FaTrashAlt, FaEnvelope, FaShieldAlt, FaCircle, FaUserMinus } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ManageAdmins = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [admins, setAdmins] = useState([]);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState('');

    const fetchAdmins = async (term = '') => {
        try {
            setIsLoading(true);
            setError('');

            const response = await api.get('/user/admin/users', {
                params: { search: term, role: 'admin' },
            });

            const payload = response.data?.data || {};
            const allUsers = payload.users || [];
            const filteredAdmins = allUsers.filter(user => user.role.toLowerCase() === 'admin');
            
            setAdmins(filteredAdmins);
            setTotalAdmins(payload.totalAdmins || filteredAdmins.length);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load administrative records.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchAdmins(searchTerm);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const formatJoinedDate = (dateValue) => {
        if (!dateValue) return '—';
        const date = new Date(dateValue);
        return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(date);
    };

    const revokeAdminAccess = async (user) => {
        const confirmRevoke = window.confirm(`CRITICAL: Revoke Admin rights for ${user.name}? This will immediately demote them to a standard user.`);
        if (!confirmRevoke) return;

        try {
            setActionLoadingId(user.id);
            await api.patch(`/user/admin/users/${user.id}/role`, { role: 'user' });
            await fetchAdmins(searchTerm);
            toast.success(`Access revoked for ${user.name}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to revoke access.');
        } finally {
            setActionLoadingId('');
        }
    };

    const deleteAdmin = async (userId) => {
        const shouldDelete = window.confirm('SECURITY ALERT: Permanently delete this Admin account? This action cannot be undone.');
        if (!shouldDelete) return;

        try {
            setActionLoadingId(userId);
            await api.delete(`/user/admin/users/${userId}`);
            await fetchAdmins(searchTerm);
            toast.success('Administrator account removed.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to remove administrative account.');
        } finally {
            setActionLoadingId('');
        }
    };

    const emptyStateMessage = useMemo(() => {
        if (isLoading) return 'Verifying security clearances...';
        if (error) return error;
        if (admins.length === 0) return 'No administrative accounts identified.';
        return '';
    }, [isLoading, error, admins.length]);

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex w-full overflow-x-hidden font-sans">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16">
                
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-[#4A4036] tracking-tighter uppercase">Privileged Access</h1>
                        <p className="text-[#A68A64] text-[10px] font-black uppercase tracking-[0.2em] mt-1">System Security & Personnel Oversight</p>
                    </div>
                    <div className="bg-white px-8 py-5 rounded-2xl border border-[#E0D8CC] shadow-sm flex items-center space-x-8">
                        <div className="flex flex-col border-r border-[#FAF7F2] pr-8">
                            <span className="text-[9px] font-black text-[#A68A64] uppercase tracking-widest">Verified Admins</span>
                            <span className="text-3xl font-bold text-[#4A4036]">{totalAdmins}</span>
                        </div>
                        <FaShieldAlt className="text-[#A68A64] text-3xl" />
                    </div>
                </header>

                {/* Search Bar */}
                <div className="relative group mb-10">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-[#E0D8CC] group-focus-within:text-[#A68A64] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search privileged accounts by name or email..."
                        className="w-full bg-white border border-[#E0D8CC] rounded-2xl py-5 pl-16 pr-6 text-sm outline-none shadow-sm focus:border-[#A68A64] transition-all text-[#4A4036] font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Admins Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#E0D8CC] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F5F5F5]">
                                    <th className="px-8 py-6 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Personnel</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Access Level</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Assignment Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Security Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0D8CC]/40">
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-[#FAF7F2]/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-5">
                                                <div className="h-11 w-11 bg-[#4A4036] rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shadow-[#4A4036]/20">
                                                    {admin.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#4A4036]">{admin.name}</span>
                                                    <span className="text-[11px] text-[#A68A64] font-bold flex items-center uppercase tracking-tighter">
                                                        <FaEnvelope className="mr-2 text-[9px]" /> {admin.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2 text-[#A68A64]">
                                                <FaUserShield className="text-base" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">System Controller</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-[#4A4036]/70 uppercase">
                                            {formatJoinedDate(admin.joined)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2">
                                                <FaCircle className="text-[7px] text-green-600 animate-pulse" />
                                                <span className="text-[9px] font-black text-[#4A4036] uppercase tracking-widest">Authorized</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className="h-10 w-10 bg-[#FAF7F2] text-[#A68A64] border border-[#E0D8CC] rounded-xl flex items-center justify-center hover:bg-[#A68A64] hover:text-white transition-all disabled:opacity-30"
                                                    title="Revoke Admin Rights"
                                                    disabled={actionLoadingId === admin.id}
                                                    onClick={() => revokeAdminAccess(admin)}
                                                >
                                                    <FaUserMinus size={14} />
                                                </button>
                                                <button
                                                    className="h-10 w-10 bg-[#FAF7F2] text-[#E0D8CC] border border-[#E0D8CC] rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all disabled:opacity-30"
                                                    title="Permanently Delete Account"
                                                    disabled={actionLoadingId === admin.id}
                                                    onClick={() => deleteAdmin(admin.id)}
                                                >
                                                    <FaTrashAlt size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {emptyStateMessage && (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-24 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#A68A64] italic">
                                            {emptyStateMessage}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManageAdmins;