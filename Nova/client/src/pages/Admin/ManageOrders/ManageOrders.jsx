import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaShippingFast, FaCheckCircle, FaFilter, FaArrowRight, FaClock, FaTimes, FaDownload, FaCalendarAlt, FaBoxOpen, FaExchangeAlt } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';

const ManageOrders = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportFilters, setReportFilters] = useState({
        category: 'All',
        lowStock: false,
        startDate: '',
        endDate: '',
        search: ''
    });
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await api.get('/orders/admin');
                if (response.data.success) {
                    setOrders(response.data.data);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to load orders. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleDownloadCSV = async () => {
        try {
            setDownloading(true);
            const response = await api.get('/reports/orders', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'orders_report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading CSV:', err);
            setError('Failed to download report. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Updated status styling to match the organic theme
    const getStatusInfo = (order) => {
        const s = order.status || 'Processing';
        switch (s) {
            case 'Placed': return { label: 'Placed', class: 'bg-blue-50 text-blue-600 border border-blue-100', icon: <FaClock className="mr-1" /> };
            case 'Pending': return { label: 'Pending', class: 'bg-amber-50 text-amber-600 border border-amber-100', icon: <FaClock className="mr-1" /> };
            case 'Processing': return { label: 'Processing', class: 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#A68A64]', icon: <FaClock className="mr-1 animate-spin-slow" /> };
            case 'Packed': return { label: 'Packed', class: 'bg-indigo-50 text-indigo-600 border border-indigo-100', icon: <FaShippingFast className="mr-1" /> };
            case 'Shipped': return { label: 'Shipped', class: 'bg-[#E0D8CC] text-[#4A4036]', icon: <FaShippingFast className="mr-1" /> };
            case 'Delivered': return { label: 'Delivered', class: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="mr-1" /> };
            case 'Cancelled': return { label: 'Cancelled', class: 'bg-red-50 text-red-600 border border-red-100', icon: <FaTimes className="mr-1" /> };
            case 'Return Request': return { label: 'Return Req', class: 'bg-orange-50 text-orange-600 border border-orange-100', icon: <FaClock className="mr-1" /> };
            case 'Return Approved': return { label: 'Ret Approved', class: 'bg-blue-50 text-blue-600 border border-blue-100', icon: <FaCheckCircle className="mr-1" /> };
            case 'Return Rejected': return { label: 'Ret Rejected', class: 'bg-red-50 text-red-600 border border-red-100', icon: <FaTimes className="mr-1" /> };
            case 'Returned': return { label: 'Returned', class: 'bg-gray-100 text-gray-700 border border-gray-200', icon: <FaExchangeAlt className="mr-1" /> };
            default: return { label: s, class: 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#A68A64]', icon: <FaClock className="mr-1" /> };
        }
    };

    const getProgressStage = (order) => {
        const fulfillmentStatus = order.status || 'Processing';
        const returnStatus = order.returnRequest?.status;

        if (returnStatus === 'Rejected' || fulfillmentStatus === 'Return Rejected') {
            return { label: 'Return Rejected', class: 'text-red-600' };
        }

        if (returnStatus === 'Completed' || fulfillmentStatus === 'Returned') {
            return { label: 'Returned', class: 'text-gray-700' };
        }

        if (returnStatus === 'Approved' || fulfillmentStatus === 'Return Approved') {
            return { label: 'Return Approved', class: 'text-blue-600' };
        }

        if (returnStatus === 'Requested' || fulfillmentStatus === 'Return Request') {
            return { label: 'Return Request', class: 'text-orange-600' };
        }

        if (fulfillmentStatus === 'Cancelled') {
            return { label: 'Cancelled', class: 'text-red-600' };
        }

        return { label: fulfillmentStatus, class: 'text-[#A68A64]' };
    };

    const getDisplayStatusInfo = (order) => {
        const stage = getProgressStage(order).label;

        switch (stage) {
            case 'Placed': return { label: 'Placed', class: 'bg-blue-50 text-blue-600 border border-blue-100', icon: <FaClock className="mr-1" /> };
            case 'Pending': return { label: 'Pending', class: 'bg-amber-50 text-amber-600 border border-amber-100', icon: <FaClock className="mr-1" /> };
            case 'Processing': return { label: 'Processing', class: 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#A68A64]', icon: <FaClock className="mr-1 animate-spin-slow" /> };
            case 'Packed': return { label: 'Packed', class: 'bg-indigo-50 text-indigo-600 border border-indigo-100', icon: <FaShippingFast className="mr-1" /> };
            case 'Shipped': return { label: 'Shipped', class: 'bg-[#E0D8CC] text-[#4A4036]', icon: <FaShippingFast className="mr-1" /> };
            case 'Delivered': return { label: 'Delivered', class: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="mr-1" /> };
            case 'Cancelled': return { label: 'Cancelled', class: 'bg-red-50 text-red-600 border border-red-100', icon: <FaTimes className="mr-1" /> };
            case 'Return Request': return { label: 'Return Request', class: 'bg-orange-50 text-orange-600 border border-orange-100', icon: <FaClock className="mr-1" /> };
            case 'Return Approved': return { label: 'Return Approved', class: 'bg-blue-50 text-blue-600 border border-blue-100', icon: <FaCheckCircle className="mr-1" /> };
            case 'Return Rejected': return { label: 'Return Rejected', class: 'bg-red-50 text-red-600 border border-red-100', icon: <FaTimes className="mr-1" /> };
            case 'Returned': return { label: 'Returned', class: 'bg-gray-100 text-gray-700 border border-gray-200', icon: <FaExchangeAlt className="mr-1" /> };
            default: return { label: stage, class: 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#A68A64]', icon: <FaClock className="mr-1" /> };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
                <AdminSidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64]"></div>
                </main>
            </div>
        );
    }

    const stats = [
        { label: 'Total number of placed order', value: orders.length, icon: <FaBoxOpen />, color: 'bg-[#A68A64]' },
        { label: 'Total under pending order', value: orders.filter(o => o.status === 'Pending').length, icon: <FaClock />, color: 'bg-[#4A4036]' },
        { label: 'Under proccessing order', value: orders.filter(o => o.status === 'Processing').length, icon: <FaClock />, color: 'bg-[#A68A64]' },
        { label: 'Total packed order', value: orders.filter(o => o.status === 'Packed').length, icon: <FaShippingFast />, color: 'bg-[#4A4036]' },
        { label: 'Total shiped order', value: orders.filter(o => o.status === 'Shipped').length, icon: <FaShippingFast />, color: 'bg-[#A68A64]' },
        { label: 'Total delevard order', value: orders.filter(o => o.status === 'Delivered').length, icon: <FaCheckCircle />, color: 'bg-[#4A4036]' },
        { label: 'Total number of cancel order', value: orders.filter(o => o.status === 'Cancelled').length, icon: <FaTimes />, color: 'bg-[#A68A64]' },
        { label: 'Total number of return order', value: orders.filter(o => ['Return Request', 'Return Approved', 'Returned'].includes(o.status)).length, icon: <FaExchangeAlt />, color: 'bg-[#4A4036]' },
    ];

    return (
        <div className="h-screen bg-[#FAF7F2] flex font-sans overflow-hidden">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-[#4A4036] tracking-tight uppercase">Order Logistics</h1>
                        <p className="text-[#A68A64] text-sm font-medium mt-1 uppercase tracking-widest">Nova Dashboard / Management</p>
                    </div>
                    <div className="flex items-center bg-white px-6 py-4 rounded-xl border border-[#E0D8CC] shadow-sm">
                        <span className="text-[10px] font-black text-[#A68A64] uppercase tracking-widest mr-4">Live Status</span>
                        <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-[#A68A64] rounded-full animate-pulse"></span>
                            <span className="text-sm font-bold text-[#4A4036]">{orders.length} Total Orders</span>
                        </div>
                    </div>
                </header>

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

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                        {error}
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E0D8CC] mb-8 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 group">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#E0D8CC] group-focus-within:text-[#A68A64] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Customer Name..."
                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-4 pl-14 pr-6 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center space-x-2 px-6 py-4 bg-[#4A4036] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
                        <FaFilter /> <span>Status Filter</span>
                    </button>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-[#E0D8CC] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F5F5F5]">
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Order ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Customer</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Total Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0D8CC]">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => {
                                        const statusInfo = getDisplayStatusInfo(order);
                                        return (
                                            <tr key={order._id} className="hover:bg-[#FAF7F2] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-bold text-[#4A4036]">
                                                        #{order._id.substring(order._id.length - 8).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#4A4036]">{order.user?.fullName || 'Guest'}</span>
                                                        <span className="text-[10px] text-[#A68A64] font-medium">{order.orderItems?.length || 0} Items Purchased</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-medium text-[#4A4036]/70">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-8 py-6 text-sm font-bold text-[#4A4036]">
                                                    ₹{order.totalPrice.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center w-fit space-x-2 ${statusInfo.class}`}>
                                                        {statusInfo.icon}
                                                        <span>{statusInfo.label}</span>
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button
                                                        onClick={() => navigate(`/admin/order-details/${order._id}`)}
                                                        className="flex items-center space-x-2 text-[10px] font-black text-[#A68A64] uppercase tracking-widest hover:text-[#4A4036] transition-colors group/btn"
                                                    >
                                                        <span>View Order</span>
                                                        <FaArrowRight className="text-[8px] group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-10 text-center text-[#A68A64]">
                                            No orders found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Summary Info */}
                    <div className="p-8 border-t border-[#E0D8CC] bg-[#F5F5F5]/50 flex justify-between items-center">
                        <p className="text-[11px] font-bold text-[#A68A64] uppercase tracking-widest">
                            Showing {filteredOrders.length} of {orders.length} transactions
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleDownloadCSV}
                                disabled={downloading}
                                className="flex items-center space-x-2 text-[11px] font-black text-[#A68A64] uppercase tracking-widest hover:text-[#4A4036] transition-colors underline decoration-dotted disabled:opacity-50"
                            >
                                <FaDownload />
                                <span>{downloading ? 'Generating Report...' : 'Download Orders Report'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* CSV Report Filter Modal */}
                {isReportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A4036]/20 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl border border-[#E0D8CC] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-[#E0D8CC] flex justify-between items-center bg-[#FAF7F2]">
                                <div>
                                    <h2 className="text-xl font-bold text-[#4A4036] uppercase tracking-tight">Inventory Report</h2>
                                    <p className="text-[10px] font-black text-[#A68A64] uppercase tracking-widest mt-1">Select filters for CSV export</p>
                                </div>
                                <button
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="p-2 hover:bg-[#E0D8CC]/30 rounded-full transition-colors text-[#A68A64]"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Search Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">Product Search</label>
                                    <div className="relative group">
                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E0D8CC] group-focus-within:text-[#A68A64] transition-colors" />
                                        <input
                                            type="text"
                                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
                                            placeholder="Product name..."
                                            value={reportFilters.search}
                                            onChange={(e) => setReportFilters({ ...reportFilters, search: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">Category</label>
                                    <div className="relative group">
                                        <FaBoxOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E0D8CC] group-focus-within:text-[#A68A64] transition-colors" />
                                        <select
                                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all appearance-none text-[#4A4036]"
                                            value={reportFilters.category}
                                            onChange={(e) => setReportFilters({ ...reportFilters, category: e.target.value })}
                                        >
                                            <option value="All">All Categories</option>
                                            <option value="Organic">Organic</option>
                                            <option value="Sustainable">Sustainable</option>
                                            <option value="Handmade">Handmade</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
                                            value={reportFilters.startDate}
                                            onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] block">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
                                            value={reportFilters.endDate}
                                            onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Low Stock Toggle */}
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={reportFilters.lowStock}
                                            onChange={(e) => setReportFilters({ ...reportFilters, lowStock: e.target.checked })}
                                        />
                                        <div className={`w-10 h-5 rounded-full transition-colors ${reportFilters.lowStock ? 'bg-[#A68A64]' : 'bg-[#E0D8CC]'}`}></div>
                                        <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${reportFilters.lowStock ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <span className="ml-3 text-[10px] font-black text-[#A68A64] uppercase tracking-widest group-hover:text-[#4A4036] transition-colors">Only Low Stock Products (&lt; 20)</span>
                                </label>
                            </div>

                            <div className="p-8 bg-[#FAF7F2] border-t border-[#E0D8CC]">
                                <button
                                    onClick={handleDownloadCSV}
                                    disabled={downloading}
                                    className="w-full flex items-center justify-center space-x-3 py-4 bg-[#4A4036] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:opacity-95 transition-all disabled:opacity-50"
                                >
                                    {downloading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <FaDownload />
                                            <span>Generate & Download Report</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManageOrders;