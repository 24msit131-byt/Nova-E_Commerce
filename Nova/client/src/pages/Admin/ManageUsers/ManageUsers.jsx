import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaUserTag, FaTrashAlt, FaEnvelope, FaShieldAlt, FaCircle, FaTimes, FaDownload, FaUserShield, FaUserFriends } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ManageUsers = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFilters, setExportFilters] = useState({
        role: 'all',
        status: 'Active',
        startDate: '',
        endDate: ''
    });
    const [downloading, setDownloading] = useState(false);

    const fetchUsers = async (term = '') => {
        try {
            setIsLoading(true);
            setError('');

            const response = await api.get('/user/admin/users', {
                params: { search: term },
            });

            const payload = response.data?.data || {};
            setUsers(payload.users || []);
            setTotalUsers(payload.totalUsers || 0);
            setTotalAdmins(payload.totalAdmins || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load user directory.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleExportCSV = async () => {
        try {
            setDownloading(true);
            const params = new URLSearchParams();
            if (exportFilters.role !== 'all') params.append('role', exportFilters.role);
            if (exportFilters.status !== 'All') params.append('status', exportFilters.status);
            if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
            if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);

            const response = await api.get(`/reports/users?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_registry.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setIsExportModalOpen(false);
        } catch (err) {
            console.error('Error exporting CSV:', err);
            toast.error('Failed to export registry. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const formatJoinedDate = (dateValue) => {
        if (!dateValue) return '—';
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    const toggleRole = async (user) => {
        try {
            setActionLoadingId(user.id);
            const nextRole = user.role === 'Admin' ? 'user' : 'admin';

            await api.patch(`/user/admin/users/${user.id}/role`, {
                role: nextRole,
            });

            await fetchUsers(searchTerm);
            toast.success(`Access level updated to ${nextRole.toUpperCase()}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to update permissions.');
        } finally {
            setActionLoadingId('');
        }
    };

    const deleteUser = async (userId) => {
        const shouldDelete = window.confirm('Revoke access and delete this user account permanently?');
        if (!shouldDelete) return;

        try {
            setActionLoadingId(userId);
            await api.delete(`/user/admin/users/${userId}`);
            await fetchUsers(searchTerm);
            toast.success('User account removed permanently.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to remove user.');
        } finally {
            setActionLoadingId('');
        }
    };

    const emptyStateMessage = useMemo(() => {
        if (isLoading) return 'Synchronizing user data...';
        if (error) return error;
        if (users.length === 0) return 'No members found in the directory.';
        return '';
    }, [isLoading, error, users.length]);

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex w-full overflow-x-hidden font-sans">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-[#4A4036] tracking-tighter uppercase">User Directory</h1>
                        <p className="text-[#A68A64] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Community Oversight & Access Control</p>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-[#A68A64] uppercase tracking-widest">Active Members</p>
                            <p className="text-2xl font-bold text-[#4A4036]">{totalUsers}</p>
                        </div>
                        <div className="h-10 w-px bg-[#E0D8CC]"></div>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="bg-[#4A4036] text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#A68A64] transition-all shadow-md"
                        >
                            Export Registry
                        </button>
                    </div>
                </header>

                {/* Export Registry Modal */}
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A4036]/20 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl border border-[#E0D8CC] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-[#E0D8CC] flex justify-between items-center bg-[#FAF7F2]">
                                <div>
                                    <h2 className="text-xl font-bold text-[#4A4036] uppercase tracking-tight">Export Registry</h2>
                                    <p className="text-[10px] font-black text-[#A68A64] uppercase tracking-widest mt-1">Configure user data export</p>
                                </div>
                                <button
                                    onClick={() => setIsExportModalOpen(false)}
                                    className="p-2 hover:bg-[#E0D8CC]/30 rounded-full transition-colors text-[#A68A64]"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Role Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">Member Role</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['all', 'user', 'admin'].map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => setExportFilters({ ...exportFilters, role })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${exportFilters.role === role
                                                    ? 'bg-[#4A4036] text-white border-[#4A4036]'
                                                    : 'bg-[#F5F5F5] text-[#A68A64] border-transparent hover:border-[#E0D8CC]'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">Account Status</label>
                                    <div className="relative group">
                                        <FaCircle className={`absolute left-4 top-1/2 -translate-y-1/2 text-[8px] ${exportFilters.status === 'Active' ? 'text-green-600' : 'text-[#E0D8CC]'}`} />
                                        <select
                                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all appearance-none text-[#4A4036]"
                                            value={exportFilters.status}
                                            onChange={(e) => setExportFilters({ ...exportFilters, status: e.target.value })}
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Active">Active Only</option>
                                            <option value="Archive">Archived Only</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">Joined From</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
                                            value={exportFilters.startDate}
                                            onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">Joined To</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
                                            value={exportFilters.endDate}
                                            onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E0D8CC]/50">
                                    <div className="flex items-start space-x-3">
                                        <FaUserShield className="text-[#A68A64] mt-1" />
                                        <p className="text-[9px] font-medium text-[#4A4036]/70 leading-relaxed uppercase tracking-wider">
                                            The report will include full database details: contact info, full address, and registration timestamps.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-[#FAF7F2] border-t border-[#E0D8CC]">
                                <button
                                    onClick={handleExportCSV}
                                    disabled={downloading}
                                    className="w-full flex items-center justify-center space-x-3 py-4 bg-[#4A4036] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:opacity-95 transition-all disabled:opacity-50"
                                >
                                    {downloading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <FaDownload />
                                            <span>Generate CSV Report</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search & Stats Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 relative group">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#E0D8CC] group-focus-within:text-[#A68A64] transition-colors" />
                        <input
                            type="text"
                            placeholder="Find by name, email or administrative role..."
                            className="w-full bg-white border border-[#E0D8CC] rounded-2xl py-4 pl-14 pr-6 text-sm outline-none shadow-sm focus:border-[#A68A64] transition-all text-[#4A4036]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        className="bg-[#A68A64] rounded-2xl p-4 flex items-center justify-between text-white shadow-lg hover:bg-[#4A4036] transition-all w-full"
                        onClick={() => navigate('/admin/admins')}
                    >
                        <div className="flex items-center space-x-3">
                            <FaShieldAlt className="text-[#FAF7F2]/60" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Staff Admins</span>
                        </div>
                        <span className="text-xl font-bold">{totalAdmins}</span>
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#E0D8CC] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F5F5F5]">
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">User Profile</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Access Level</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Registration</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Authority</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0D8CC]/40">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-[#FAF7F2]/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 bg-[#FAF7F2] border border-[#E0D8CC] rounded-full flex items-center justify-center text-[#A68A64] font-bold text-xs group-hover:bg-[#4A4036] group-hover:text-white transition-all">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#4A4036]">{user.name}</span>
                                                    <span className="text-[11px] text-[#A68A64] font-bold flex items-center uppercase tracking-tighter">
                                                        <FaEnvelope className="mr-1 text-[9px]" /> {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${user.role === 'Admin' ? 'text-[#A68A64]' : 'text-[#4A4036]/50'}`}>
                                                <FaUserTag className="text-[14px]" />
                                                <span>{user.role}</span>
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-[#4A4036]/70 uppercase">{formatJoinedDate(user.joined)}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2">
                                                <FaCircle className={`text-[7px] ${user.status === 'Active' ? 'text-green-600' :
                                                    user.status === 'Away' ? 'text-amber-500' : 'text-[#E0D8CC]'
                                                    }`} />
                                                <span className="text-[9px] font-black text-[#4A4036] uppercase tracking-widest">{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className="p-2 text-[#E0D8CC] hover:text-[#A68A64] transition-colors disabled:opacity-40"
                                                    title="Modify Role"
                                                    disabled={actionLoadingId === user.id}
                                                    onClick={() => toggleRole(user)}
                                                >
                                                    <FaShieldAlt size={14} />
                                                </button>
                                                <button
                                                    className="p-2 text-[#E0D8CC] hover:text-red-600 transition-colors disabled:opacity-40"
                                                    title="Remove Account"
                                                    disabled={actionLoadingId === user.id}
                                                    onClick={() => deleteUser(user.id)}
                                                >
                                                    <FaTrashAlt size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {emptyStateMessage && (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">
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

export default ManageUsers;