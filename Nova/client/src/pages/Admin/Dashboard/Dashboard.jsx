import React, { useState, useEffect } from 'react';
import { FaBox, FaUsers, FaShoppingCart, FaRupeeSign } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activeUsers: 0,
        totalProducts: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsRes, ordersRes] = await Promise.all([
                    api.get('/reports/stats'),
                    api.get('/reports/recent-orders')
                ]);

                if (statsRes.data.success) {
                    setStatsData(statsRes.data.data);
                }
                if (ordersRes.data.success) {
                    setRecentOrders(ordersRes.data.data);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Updated stats with the Earthy Gold theme
    const stats = [
        { label: 'Total Revenue', value: String(statsData.totalRevenue).startsWith('₹') ? statsData.totalRevenue : `₹${statsData.totalRevenue}`, icon: <FaRupeeSign />, color: 'bg-[#A68A64]' },
        { label: 'Total Orders', value: statsData.totalOrders, icon: <FaShoppingCart />, color: 'bg-[#4A4036]' },
        { label: 'Active Users', value: statsData.activeUsers, icon: <FaUsers />, color: 'bg-[#A68A64]' },
        { label: 'Products', value: statsData.totalProducts, icon: <FaBox />, color: 'bg-[#4A4036]' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex">
                <AdminSidebar />
                <main className="flex-1 p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64]"></div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
            <AdminSidebar />
            <main className="flex-1 p-8 md:p-12">
                {/* Header Section */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-[#4A4036] uppercase tracking-tight">Admin Dashboard</h1>
                    <p className="text-[#A68A64] font-medium tracking-wide uppercase text-xs mt-1">Overview & Business Analytics</p>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                        {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0D8CC] flex items-center hover:shadow-md transition-shadow">
                            <div className={`${stat.color} p-4 rounded-xl text-white mr-5 shadow-inner`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] text-[#A68A64] font-black uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-bold text-[#4A4036]">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity Table */}
                <div className="bg-white rounded-[8px] shadow-sm border border-[#E0D8CC] overflow-hidden">
                    <div className="p-8 border-b border-[#FAF7F2] flex justify-between items-center bg-[#F5F5F5]/30">
                        <h2 className="text-lg font-bold text-[#4A4036] uppercase tracking-tighter">Recent Orders</h2>
                        <button className="text-[#A68A64] font-black uppercase tracking-widest text-[10px] hover:text-[#4A4036] transition-colors border-b border-[#A68A64]">
                            View All Transactions
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FAF7F2] text-[#A68A64] text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Order ID</th>
                                    <th className="px-8 py-5">Customer</th>
                                    <th className="px-8 py-5">Product</th>
                                    <th className="px-8 py-5">Amount</th>
                                    <th className="px-8 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0D8CC]/50">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                                            <td className="px-8 py-6 font-bold text-[#4A4036] text-sm">
                                                #{order._id.substring(order._id.length - 8).toUpperCase()}
                                            </td>
                                            <td className="px-8 py-6 text-[#4A4036]/80 text-sm font-medium">
                                                {order.user?.fullName || 'Guest'}
                                            </td>
                                            <td className="px-8 py-6 text-[#4A4036]/80 text-sm">
                                                <span className="font-semibold">{order.orderItems?.[0]?.name || 'Unknown'}</span>
                                                {order.orderItems?.length > 1 && (
                                                    <span className="text-[#A68A64] text-[10px] ml-1">
                                                        +{order.orderItems.length - 1} others
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-[#4A4036] font-bold">
                                                ₹{order.totalPrice.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.isDelivered ? 'bg-green-100 text-green-800' :
                                                    order.isPaid ? 'bg-[#E0D8CC] text-[#4A4036]' : 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#A68A64]'
                                                    }`}>
                                                    {order.isDelivered ? 'Delivered' : order.isPaid ? 'Paid' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-16 text-center text-[#A68A64] font-medium italic">
                                            No recent activity to report.
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

export default AdminDashboard;