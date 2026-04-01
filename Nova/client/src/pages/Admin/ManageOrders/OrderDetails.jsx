import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    FaArrowLeft, FaPrint, FaTruck, FaUser, FaCreditCard,
    FaBox, FaMapMarkerAlt, FaCheckCircle, FaClock, FaMobileAlt, FaStickyNote, FaShippingFast, FaExchangeAlt
} from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("Processing");
    const [trackingID, setTrackingID] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [returnAdminNote, setReturnAdminNote] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingDetails, setUpdatingDetails] = useState(false);
    const [updatingReturn, setUpdatingReturn] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                if (data.success) {
                    setOrder(data.data);
                    setStatus(data.data.status || "Processing");
                    setTrackingID(data.data.trackingId || "");
                    setAdminNote(data.data.adminNotes || "");
                    setReturnAdminNote(data.data.returnRequest?.adminNote || "");
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        try {
            setUpdatingStatus(true);
            const { data } = await api.patch(`/orders/${id}/status`, { status: newStatus });
            if (data.success) {
                setStatus(newStatus);
                toast.success(`Order status updated to ${newStatus}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleUpdateDetails = async () => {
        try {
            setUpdatingDetails(true);
            const { data } = await api.patch(`/orders/${id}/details`, {
                trackingId: trackingID,
                adminNotes: adminNote
            });
            if (data.success) toast.success("Logistics updated");
        } catch (error) {
            console.error("Error updating details:", error);
        } finally {
            setUpdatingDetails(false);
        }
    };

    const handleReturnRequestUpdate = async (newStatus) => {
        try {
            setUpdatingReturn(true);
            const { data } = await api.patch(`/orders/${id}/return-request`, {
                status: newStatus,
                adminNote: returnAdminNote
            });

            if (data.success) {
                setOrder(data.data);
                toast.success(`Return request ${newStatus.toLowerCase()}`);
            }
        } catch (error) {
            console.error("Error updating return request:", error);
            toast.error(error.response?.data?.message || 'Failed to update return request');
        } finally {
            setUpdatingReturn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#A68A64]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex w-full overflow-x-hidden font-sans">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center space-x-6">
                        <Link to="/admin/orders" className="h-12 w-12 bg-white border border-[#E0D8CC] rounded-xl flex items-center justify-center text-[#A68A64] hover:bg-[#FAF7F2] transition-all shadow-sm">
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-bold text-[#4A4036] tracking-tighter uppercase">Order #{order._id.slice(-6)}</h1>
                                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-[#E0D8CC] text-[#4A4036]'}`}>
                                    {status}
                                </span>
                            </div>
                            <p className="text-[#A68A64] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Master Reference: NV-ORD-{order._id.slice(-4)}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 px-6 py-4 bg-white text-[#4A4036] border border-[#E0D8CC] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#F5F5F5] transition-all">
                            <FaPrint /> <span>Print Invoice</span>
                        </button>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updatingStatus}
                            className="bg-[#4A4036] text-white px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-[#A68A64] transition-all shadow-lg disabled:opacity-50"
                        >
                            <option value="Processing">Processing</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Logistics & Inventory */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Order Timeline */}
                        <div className="bg-white rounded-3xl border border-[#E0D8CC] p-10 shadow-sm">
                            <h3 className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] mb-12">Fulfillment Progression</h3>
                            <div className="flex justify-between relative px-4">
                                <div className="absolute top-4 left-0 w-full h-0.5 bg-[#FAF7F2] z-0"></div>
                                {[
                                    { label: "Placed", done: true },
                                    { label: "Processing", done: status !== "Cancelled" },
                                    { label: "Shipped", done: status === "Shipped" || status === "Delivered" },
                                    { label: "Delivered", done: status === "Delivered" }
                                ].map((step, i) => (
                                    <div key={i} className="relative z-10 flex flex-col items-center">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${step.done ? 'bg-[#A68A64] text-white' : 'bg-[#F5F5F5] text-[#E0D8CC]'}`}>
                                            <FaCheckCircle size={12} />
                                        </div>
                                        <p className="text-[10px] font-bold text-[#4A4036] uppercase mt-4">{step.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="bg-white rounded-3xl shadow-sm border border-[#E0D8CC] p-10">
                            <h3 className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] mb-8 flex items-center">
                                <FaBox className="mr-3" /> Items in this Order
                            </h3>
                            <div className="space-y-6">
                                {order.orderItems.map((item) => (
                                    <div key={item._id} className="flex items-center justify-between pb-6 border-b border-[#FAF7F2] last:border-0 last:pb-0">
                                        <div className="flex items-center space-x-6">
                                            <div className="h-20 w-20 bg-[#F5F5F5] rounded-xl overflow-hidden border border-[#E0D8CC]">
                                                <img src={item.image} alt={item.name} className="h-full w-full object-cover grayscale-[20%] hover:grayscale-0 transition-all" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[#4A4036]">{item.name}</h4>
                                                <p className="text-[10px] text-[#A68A64] font-bold uppercase mt-1 tracking-tighter">SKU: NV-PRD-{item.product.slice(-4)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#4A4036]">₹{item.price * item.qty}</p>
                                            <p className="text-[10px] font-bold text-[#A68A64] uppercase mt-1">Units: {item.qty}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Internal Notes */}
                        <div className="bg-[#F5F5F5] rounded-3xl border border-[#E0D8CC] p-10">
                            <h3 className="text-[10px] font-black text-[#4A4036] uppercase tracking-[0.2em] mb-4 flex items-center">
                                <FaStickyNote className="mr-2 text-[#A68A64]" /> Team Communications
                            </h3>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add private shipping instructions or order context..."
                                className="w-full bg-white border border-[#E0D8CC] rounded-xl p-5 text-xs font-medium text-[#4A4036] outline-none focus:ring-2 focus:ring-[#A68A64]/20 transition-all resize-none shadow-inner"
                                rows="3"
                            ></textarea>
                            <button
                                onClick={handleUpdateDetails}
                                disabled={updatingDetails}
                                className="mt-4 px-8 py-3 bg-[#4A4036] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A68A64] transition-all disabled:opacity-50"
                            >
                                Update Notes
                            </button>
                        </div>

                        {/* Return Request */}
                        <div className="bg-white rounded-3xl border border-[#E0D8CC] p-8 shadow-sm">
                            <h3 className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em] mb-6 flex items-center">
                                <FaExchangeAlt className="mr-2" /> Return Request
                            </h3>

                            {order.returnRequest?.status && order.returnRequest.status !== 'None' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 bg-[#FAF7F2] border border-[#E0D8CC] rounded-xl p-4">
                                        <span className="text-xs font-black uppercase tracking-widest text-[#4A4036]">Status</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#A68A64]">
                                            {order.returnRequest.status}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-[#A68A64] uppercase tracking-widest">Customer Reason</p>
                                        <p className="text-xs font-medium text-[#4A4036] leading-relaxed bg-[#FAF7F2] border border-[#E0D8CC] rounded-xl p-4">
                                            {order.returnRequest.reason || 'No reason provided'}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-[#A68A64] uppercase tracking-widest">Admin Note</label>
                                        <textarea
                                            value={returnAdminNote}
                                            onChange={(e) => setReturnAdminNote(e.target.value)}
                                            placeholder="Add review note for return request..."
                                            className="w-full bg-white border border-[#E0D8CC] rounded-xl p-4 text-xs font-medium text-[#4A4036] outline-none focus:ring-2 focus:ring-[#A68A64]/20 transition-all resize-none shadow-inner"
                                            rows="3"
                                        />
                                    </div>

                                    {order.returnRequest.status === 'Requested' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <button
                                                onClick={() => handleReturnRequestUpdate('Approved')}
                                                disabled={updatingReturn}
                                                className="py-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReturnRequestUpdate('Rejected')}
                                                disabled={updatingReturn}
                                                className="py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleReturnRequestUpdate('Completed')}
                                                disabled={updatingReturn}
                                                className="py-3 bg-[#4A4036] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A68A64] transition-all disabled:opacity-50"
                                            >
                                                Mark Completed
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs font-medium text-[#4A4036] leading-relaxed">
                                    No return request has been submitted for this order.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Customer & Billing */}
                    <div className="space-y-8">
                        {/* Logistics */}
                        <div className="bg-white rounded-3xl shadow-sm border border-[#E0D8CC] p-8">
                            <h3 className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em] mb-6 flex items-center">
                                <FaShippingFast className="mr-2" /> Logistics Detail
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-[#A68A64] uppercase tracking-widest">Tracking Number</label>
                                    <input
                                        type="text" value={trackingID} onChange={(e) => setTrackingID(e.target.value)}
                                        placeholder="Enter AWB Number"
                                        className="w-full py-2 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-xs font-bold text-[#4A4036]"
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateDetails}
                                    className="w-full py-4 bg-[#F5F5F5] text-[#4A4036] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#4A4036] hover:text-white transition-all"
                                >
                                    Sync Tracking
                                </button>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="bg-white rounded-3xl shadow-sm border border-[#E0D8CC] p-8">
                            <h3 className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em] mb-6 flex items-center">
                                <FaUser className="mr-2" /> Customer Profile
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-bold text-[#4A4036]">{order.user?.fullName || 'Guest'}</p>
                                    <p className="text-xs text-[#A68A64] font-bold mt-1 uppercase tracking-tighter">{order.user?.email}</p>
                                </div>
                                <div className="pt-4 border-t border-[#FAF7F2] flex items-start space-x-3">
                                    <FaMapMarkerAlt className="text-[#E0D8CC] mt-1" />
                                    <p className="text-xs text-[#4A4036] leading-relaxed font-medium">
                                        {order.shippingAddress.address}, {order.shippingAddress.city}<br />
                                        {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-[#E0D8CC] shadow-sm relative overflow-hidden">
                            <h3 className="text-[9px] font-black text-[#4A4036] uppercase tracking-[0.2em] mb-6 flex items-center">
                                <FaCreditCard className="mr-2 text-[#A68A64]" /> Payment Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-[#E0D8CC]">
                                    <div className="flex items-center text-[10px] font-black text-[#A68A64] uppercase tracking-widest">
                                        <FaMobileAlt className="mr-2" /> {order.paymentMethod}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${order.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                                        {order.isPaid ? 'Completed' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-[#A68A64]">
                                    <span>Subtotal</span>
                                    <span className="text-[#4A4036]">₹{order.totalPrice - order.taxPrice - order.shippingPrice}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-[#A68A64]">
                                    <span>Shipping</span>
                                    <span className="text-[#4A4036]">₹{order.shippingPrice}</span>
                                </div>
                                <div className="pt-4 border-t-2 border-white flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-[0.1em] text-[#A68A64]">Gross Total</span>
                                    <span className="text-2xl font-bold text-[#4A4036]">₹{order.totalPrice}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderDetail;