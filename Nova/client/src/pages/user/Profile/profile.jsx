import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaCheckCircle, FaEdit, FaExchangeAlt, FaMapMarkedAlt, FaPlus, FaShieldAlt, FaStar, FaTimes, FaTrash } from 'react-icons/fa';
import api from '../../../services/api';
import Footer from '../../../components/Footer';

const ORDER_STEPS = ['Placed', 'Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];

const getStepState = (status) => {
  if (status === 'Cancelled') {
    return { activeStep: -1, isCancelled: true };
  }
  const normalizedStatus = ORDER_STEPS.includes(status) ? status : 'Processing';
  const finalStatus = ['Return Request', 'Return Approved', 'Return Rejected', 'Returned'].includes(status) ? 'Delivered' : normalizedStatus;
  return { activeStep: ORDER_STEPS.indexOf(finalStatus), isCancelled: false };
};

/* Order Tracker Milestone Component */
const OrderTracker = ({ status, colors }) => {
  const { isCancelled } = getStepState(status);
  const steps = [
    { label: "Placed", done: true },
    { label: "Pending", done: ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Return Approved', 'Return Rejected', 'Returned'].includes(status) },
    { label: "Processing", done: ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Return Approved', 'Return Rejected', 'Returned'].includes(status) },
    { label: "Packed", done: ['Packed', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Return Approved', 'Return Rejected', 'Returned'].includes(status) },
    { label: "Shipped", done: ['Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Return Approved', 'Return Rejected', 'Returned'].includes(status) },
    { label: "Delivered", done: ['Delivered', 'Return Request', 'Return Approved', 'Return Rejected', 'Returned'].includes(status) },
    { label: "Return Req", done: ['Return Request', 'Return Approved', 'Return Rejected', 'Returned'].includes(status) },
    { label: "Return Appr", done: ['Return Approved', 'Returned'].includes(status) },
    { label: "Return Rej", done: status === 'Return Rejected', isError: status === 'Return Rejected' }
  ];

  return (
    <div className="mt-8 bg-[#FAF7F2] rounded-[1.5rem] p-6 border border-[#D6C9B5]">
      <div className="flex justify-between items-start relative px-2">
        <div className="absolute top-3 left-0 w-full h-[2px] bg-[#E0D8CC] z-0"></div>
        {steps.map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center flex-1">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all duration-500 
                ${step.done ? (step.isError ? 'bg-red-500 text-white' : 'bg-[#A68A64] text-white') : 'bg-white text-[#E0D8CC]'}`}>
              {step.isError ? <FaTimes size={10} /> : <FaCheckCircle size={10} />}
            </div>
            <p className={`text-[7px] font-black uppercase tracking-tighter mt-3 whitespace-nowrap ${step.done ? 'text-[#4A4036] opacity-100' : 'text-[#756A5E] opacity-40'}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
      {isCancelled && (
        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-100">
          <FaTimes className="text-red-600" size={10} />
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Order has been cancelled</p>
        </div>
      )}
    </div>
  );
};

const getProductId = (product) => {
  if (!product) return null;
  if (typeof product === 'string') return product;
  return product._id || null;
};

const getProductName = (item) => {
  if (item?.name) return item.name;
  if (item?.product && typeof item.product === 'object' && item.product.name) return item.product.name;
  return 'Product';
};

const getReturnRequestState = (order) => {
  const status = order?.returnRequest?.status || 'None';

  switch (status) {
    case 'Requested':
      return { label: 'Return Requested', className: 'bg-amber-50 text-amber-700 border border-amber-100' };
    case 'Approved':
      return { label: 'Return Approved', className: 'bg-blue-50 text-blue-700 border border-blue-100' };
    case 'Rejected':
      return { label: 'Return Rejected', className: 'bg-red-50 text-red-700 border border-red-100' };
    case 'Completed':
      return { label: 'Returned', className: 'bg-green-50 text-green-700 border border-green-100' };
    default:
      return { label: 'No Return Request', className: 'bg-slate-50 text-slate-500 border border-slate-100' };
  }
};

const EMPTY_ADDRESS_FORM = {
  label: 'Home',
  addressLine: '',
  pincode: '',
  state: '',
  district: '',
  taluka: '',
  city: '',
  isDefault: false,
};

const ADDRESS_LIMIT = 4;

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const [addressState, setAddressState] = useState({ status: 'idle', message: '' });
  const [orders, setOrders] = useState([]);
  const [orderState, setOrderState] = useState({ status: 'idle', message: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState('idle');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({ ...EMPTY_ADDRESS_FORM });
  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    orderId: null,
    orderLabel: '',
    reason: '',
    status: 'idle',
    message: ''
  });

  // Review Modal State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    productId: null,
    productName: '',
    rating: 0,
    comment: '',
    status: 'idle', // idle, loading, success, error
    message: ''
  });

  // Nova Brand Palette
  const colors = {
    primary: '#A68A64',     // Earthy Gold
    pageBg: '#FAF7F2',      // Warm Cream
    sectionBg: '#F2EBDD',   // Grounded Beige
    deepBg: '#2C2621',      // Deep Grounded Brown
    textMain: '#4A4036',    // Dark Brown
    textSecondary: '#756A5E', // Medium Brown
    accent: '#D6C9B5'       // Light Beige Borders
  };

  // State for form fields (Logic preserved)
  const [userDetails, setUserDetails] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    addressLine: '',
    pincode: '',
    state: '',
    district: '',
    taluka: '',
    city: ''
  });

  const applyUserSnapshot = (user) => {
    if (!user) return;

    setUserDetails({
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      addressLine: user.addressLine || '',
      pincode: user.pincode || '',
      state: user.state || '',
      district: user.district || '',
      taluka: user.taluka || '',
      city: user.city || ''
    });

    setAddresses(Array.isArray(user.addresses) ? user.addresses : []);
  };

  const resetAddressForm = () => {
    setAddressForm({ ...EMPTY_ADDRESS_FORM });
    setEditingAddressId(null);
    setAddressMode('idle');
  };

  const startCreateAddress = () => {
    if (addresses.length >= ADDRESS_LIMIT) {
      setAddressState({
        status: 'error',
        message: `You can save up to ${ADDRESS_LIMIT} addresses.`
      });
      return;
    }

    setAddressState({ status: 'idle', message: '' });
    setAddressForm({ ...EMPTY_ADDRESS_FORM });
    setEditingAddressId(null);
    setAddressMode('create');
  };

  const startEditAddress = (address) => {
    if (!address?._id) return;

    setAddressState({ status: 'idle', message: '' });
    setAddressForm({
      label: address.label || 'Home',
      addressLine: address.addressLine || '',
      pincode: address.pincode || '',
      state: address.state || '',
      district: address.district || '',
      taluka: address.taluka || '',
      city: address.city || '',
      isDefault: Boolean(address.isDefault),
    });
    setEditingAddressId(address._id);
    setAddressMode('edit');
  };

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0] || null;
  const profileAddressPreview = defaultAddress || (userDetails.addressLine ? {
    label: 'Profile Address',
    addressLine: userDetails.addressLine,
    pincode: userDetails.pincode,
    state: userDetails.state,
    district: userDetails.district,
    taluka: userDetails.taluka,
    city: userDetails.city,
    isDefault: true,
  } : null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user/me');
        if (response.data?.data?.user) {
          applyUserSnapshot(response.data.data.user);
        }
      } catch (error) {
        console.error('Profile load error:', error.response?.data || error.message);
        setSaveState({
          status: 'error',
          message: error.response?.data?.message || 'Failed to load profile data.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const fetchOrders = async () => {
    setOrderState({ status: 'loading', message: '' });
    try {
      const response = await api.get('/orders/my');
      setOrders(response.data?.data || []);
      setOrderState({ status: 'success', message: '' });
    } catch (error) {
      console.error('Order load error:', error.response?.data || error.message);
      setOrderState({
        status: 'error',
        message: error.response?.data?.message || 'Failed to load your orders.'
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveState({ status: 'loading', message: '' });

    try {
      const response = await api.put('/user/profile', {
        fullName: userDetails.fullName,
        phoneNumber: userDetails.phoneNumber,
        addressLine: userDetails.addressLine,
        pincode: userDetails.pincode,
        state: userDetails.state,
        district: userDetails.district,
        taluka: userDetails.taluka,
        city: userDetails.city,
      });

      const user = response.data?.data?.user;
      if (user) {
        applyUserSnapshot(user);
      }

      setSaveState({ status: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error.message);
      setSaveState({
        status: 'error',
        message: error.response?.data?.message || 'Failed to update profile.'
      });
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    if (addressMode === 'idle') {
      return;
    }

    if (addressMode === 'create' && addresses.length >= ADDRESS_LIMIT) {
      setAddressState({
        status: 'error',
        message: `You can save up to ${ADDRESS_LIMIT} addresses.`
      });
      return;
    }

    setAddressState({ status: 'loading', message: '' });

    try {
      const endpoint = editingAddressId ? `/user/addresses/${editingAddressId}` : '/user/addresses';
      const method = editingAddressId ? 'patch' : 'post';
      const response = await api[method](endpoint, addressForm);
      const user = response.data?.data?.user;

      if (user) {
        applyUserSnapshot(user);
      }

      setAddressState({
        status: 'success',
        message: editingAddressId ? 'Address updated successfully.' : 'Address added successfully.'
      });
      resetAddressForm();
    } catch (error) {
      console.error('Address save error:', error.response?.data || error.message);
      setAddressState({
        status: 'error',
        message: error.response?.data?.message || 'Failed to save address.'
      });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!addressId) return;

    const confirmed = window.confirm('Delete this saved address?');
    if (!confirmed) return;

    setAddressState({ status: 'loading', message: '' });

    try {
      const response = await api.delete(`/user/addresses/${addressId}`);
      const user = response.data?.data?.user;

      if (user) {
        applyUserSnapshot(user);
      }

      if (editingAddressId === addressId) {
        resetAddressForm();
      }

      setAddressState({ status: 'success', message: 'Address deleted successfully.' });
    } catch (error) {
      console.error('Address delete error:', error.response?.data || error.message);
      setAddressState({
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete address.'
      });
    }
  };

  const handleSetDefaultAddress = async (address) => {
    if (!address?._id) return;

    setAddressState({ status: 'loading', message: '' });

    try {
      const response = await api.patch(`/user/addresses/${address._id}`, {
        label: address.label || 'Home',
        addressLine: address.addressLine || '',
        pincode: address.pincode || '',
        state: address.state || '',
        district: address.district || '',
        taluka: address.taluka || '',
        city: address.city || '',
        isDefault: true,
      });

      const user = response.data?.data?.user;
      if (user) {
        applyUserSnapshot(user);
      }

      setAddressState({ status: 'success', message: 'Default address updated.' });
    } catch (error) {
      console.error('Default address update error:', error.response?.data || error.message);
      setAddressState({
        status: 'error',
        message: error.response?.data?.message || 'Failed to update default address.'
      });
    }
  };

  const handleOpenReviewModal = (product, orderStatus) => {
    if (orderStatus !== 'Delivered') return;
    const productId = getProductId(product);
    const productName = getProductName({ product }); // Just pass in something that resolves

    setReviewModal({
      isOpen: true,
      productId: productId,
      productName: productName,
      rating: 0,
      comment: '',
      status: 'idle',
      message: ''
    });
  };

  const handleCloseReviewModal = () => {
    setReviewModal({ isOpen: false, productId: null, productName: '', rating: 0, comment: '', status: 'idle', message: '' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!reviewModal.rating) {
      setReviewModal(prev => ({ ...prev, status: 'error', message: 'Please select a rating' }));
      return;
    }

    setReviewModal(prev => ({ ...prev, status: 'loading', message: '' }));
    try {
      await api.post('/reviews', {
        productId: reviewModal.productId,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      setReviewModal(prev => ({ ...prev, status: 'success', message: 'Review submitted successfully!' }));
      // Auto close after 2 seconds
      setTimeout(() => {
        handleCloseReviewModal();
      }, 2000);
    } catch (error) {
      setReviewModal(prev => ({
        ...prev,
        status: 'error',
        message: error.response?.data?.message || 'Failed to submit review'
      }));
    }
  };

  const handleOpenReturnModal = (order) => {
    const shortOrderId = `#${order._id?.slice(-8)?.toUpperCase() || 'N/A'}`;

    setReturnModal({
      isOpen: true,
      orderId: order._id,
      orderLabel: shortOrderId,
      reason: '',
      status: 'idle',
      message: ''
    });
  };

  const handleCloseReturnModal = () => {
    setReturnModal({
      isOpen: false,
      orderId: null,
      orderLabel: '',
      reason: '',
      status: 'idle',
      message: ''
    });
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();

    if (!returnModal.reason.trim()) {
      setReturnModal(prev => ({ ...prev, status: 'error', message: 'Please share a return reason.' }));
      return;
    }

    setReturnModal(prev => ({ ...prev, status: 'loading', message: '' }));

    try {
      await api.post(`/orders/${returnModal.orderId}/return-request`, {
        reason: returnModal.reason
      });

      setReturnModal(prev => ({ ...prev, status: 'success', message: 'Return request submitted successfully.' }));
      await fetchOrders();

      setTimeout(() => {
        handleCloseReturnModal();
      }, 2000);
    } catch (error) {
      setReturnModal(prev => ({
        ...prev,
        status: 'error',
        message: error.response?.data?.message || 'Failed to submit return request.'
      }));
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-0 w-full overflow-x-hidden" style={{ backgroundColor: colors.pageBg }}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 pb-20">

        {/* 1. Header Section */}
        <div className="mb-12 border-b pb-8" style={{ borderColor: colors.accent }}>
          <h1 className="text-4xl font-black tracking-tighter uppercase" style={{ color: colors.textMain }}>Your <span style={{ color: colors.primary }}>Account</span></h1>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>Manage your sanctuary profile and order logistics.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">

          {/* 2. Sidebar Navigation */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden" style={{ borderColor: colors.accent }}>
              <div className="p-8 border-b" style={{ backgroundColor: colors.sectionBg, borderColor: colors.accent }}>
                <div className="flex items-center space-x-5">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ backgroundColor: colors.deepBg }}>
                    {userDetails.fullName.charAt(0) || 'N'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: colors.textMain }}>Welcome back,</p>
                    <p className="font-bold text-lg leading-tight" style={{ color: colors.textMain }}>{userDetails.fullName || 'Nova Member'}</p>
                  </div>
                </div>
              </div>
              <nav className="p-4 space-y-2">
                {[
                  { id: 'profile', label: 'Login & Security', icon: <FaShieldAlt /> },
                  { id: 'address', label: 'Your Addresses', icon: <FaMapMarkedAlt /> },
                  { id: 'orders', label: 'Your Orders', icon: <FaBox /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === item.id
                      ? 'shadow-inner'
                      : 'hover:bg-slate-50'
                      }`}
                    style={{
                      backgroundColor: activeTab === item.id ? colors.pageBg : 'transparent',
                      color: activeTab === item.id ? colors.primary : colors.textSecondary
                    }}
                  >
                    <span className="text-lg opacity-70">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* 3. Main Content Area */}
          <main className="flex-1">
            <div className="bg-white rounded-[10px] shadow-2xl border p-3 md:p-12" style={{ borderColor: colors.accent }}>

              {activeTab === 'profile' ? (
                <div className="animate-in fade-in duration-700">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-10 pb-4 border-b" style={{ color: colors.textMain, borderColor: 'rgba(214, 201, 181, 0.3)' }}>Edit Profile</h2>

                  <form className="space-y-10" onSubmit={handleSubmit}>
                    {saveState.status !== 'idle' && (
                      <div
                        className={`rounded-2xl border px-6 py-4 text-[11px] font-bold uppercase tracking-widest ${saveState.status === 'success'
                          ? 'border-green-100 bg-green-50 text-green-700'
                          : saveState.status === 'error'
                            ? 'border-red-100 bg-red-50 text-red-700'
                            : 'border-slate-100 bg-slate-50 text-slate-600'
                          }`}
                      >
                        {saveState.message || (saveState.status === 'loading' ? 'Securing changes...' : '')}
                      </div>
                    )}

                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Full Name</label>
                        <input
                          name="fullName"
                          type="text"
                          value={userDetails.fullName}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent disabled:opacity-50"
                          style={{ borderColor: colors.accent, color: colors.textMain }}
                          onFocus={(e) => e.target.style.borderColor = colors.primary}
                          onBlur={(e) => e.target.style.borderColor = colors.accent}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Email Address</label>
                        <input
                          type="email"
                          value={userDetails.email}
                          className="w-full py-4 border-b-2 outline-none text-base font-bold bg-transparent opacity-50 cursor-not-allowed"
                          style={{ borderColor: colors.accent, color: colors.textSecondary }}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Phone Number</label>
                        <input
                          name="phoneNumber"
                          type="tel"
                          value={userDetails.phoneNumber}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          placeholder="+91 98765 43210"
                          className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent disabled:opacity-50"
                          style={{ borderColor: colors.accent, color: colors.textMain }}
                          onFocus={(e) => e.target.style.borderColor = colors.primary}
                          onBlur={(e) => e.target.style.borderColor = colors.accent}
                        />
                      </div>
                    </div>

                    {/* save button */}
                    <div className="pt-10">
                      <button
                        type="submit"
                        disabled={isLoading || saveState.status === 'loading'}
                        className="px-16 py-6 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl transition-all active:scale-95 disabled:opacity-70"
                        style={{
                          backgroundColor: colors.primary,
                          boxShadow: `0 15px 30px rgba(166, 138, 100, 0.3)`
                        }}
                      >
                        {saveState.status === 'loading' ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>

                  <div className="mt-10 rounded-[2rem] border p-6 md:p-8 bg-[#FCFAF5]" style={{ borderColor: colors.accent }}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Default Shipping Address</h3>
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                          This is the address used as the default selection at checkout.
                        </p>
                      </div>
                      {profileAddressPreview?.label && (
                        <span className="inline-flex px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">
                          {profileAddressPreview.label}
                        </span>
                      )}
                    </div>

                    {profileAddressPreview ? (
                      <div className="space-y-1 text-sm font-medium" style={{ color: colors.textSecondary }}>
                        <p>{profileAddressPreview.addressLine}</p>
                        <p>{profileAddressPreview.taluka}{profileAddressPreview.taluka && profileAddressPreview.district ? ', ' : ''}{profileAddressPreview.district}</p>
                        <p>{profileAddressPreview.city}{profileAddressPreview.city && profileAddressPreview.state ? ', ' : ''}{profileAddressPreview.state} - {profileAddressPreview.pincode}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                        No default address is set yet. Add one from Your Addresses.
                      </p>
                    )}
                  </div>
                </div>
              ) : activeTab === 'address' ? (
                <div className="animate-in fade-in duration-700 space-y-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b" style={{ borderColor: 'rgba(214, 201, 181, 0.3)' }}>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Your Addresses</h2>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                        Add, edit, delete, or set a default address from one place.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={startCreateAddress}
                      disabled={addressMode !== 'idle' || addresses.length >= ADDRESS_LIMIT}
                      className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-lg transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: colors.primary,
                        color: 'white',
                        boxShadow: '0 15px 30px rgba(166, 138, 100, 0.3)'
                      }}
                    >
                      <FaPlus /> Add New Address
                    </button>
                  </div>

                  {addressState.status !== 'idle' && (
                    <div
                      className={`rounded-2xl border px-6 py-4 text-[11px] font-bold uppercase tracking-widest ${addressState.status === 'success'
                        ? 'border-green-100 bg-green-50 text-green-700'
                        : addressState.status === 'error'
                          ? 'border-red-100 bg-red-50 text-red-700'
                          : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                    >
                      {addressState.message || (addressState.status === 'loading' ? 'Saving address...' : '')}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      {addresses.length === 0 ? (
                        <div className="rounded-[2rem] border p-8 md:p-10 text-center" style={{ borderColor: colors.accent, backgroundColor: colors.pageBg }}>
                          <p className="text-lg font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>No saved addresses yet</p>
                          <p className="mt-3 text-sm font-medium" style={{ color: colors.textSecondary }}>
                            Click Add New Address to create your first saved address.
                          </p>
                        </div>
                      ) : (
                        addresses.map((address, index) => (
                          <div
                            key={address._id}
                            className="rounded-[2rem] border p-6 md:p-7 bg-white shadow-sm"
                            style={{ borderColor: address.isDefault ? colors.primary : colors.accent }}
                          >
                            <div className="flex items-start justify-between gap-4 mb-5">
                              <div>
                                <p className="text-lg font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>
                                  {address.label || 'Address'}
                                </p>
                                {address.isDefault && (
                                  <span className="mt-2 inline-flex px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">
                                    Default
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>
                                #{String(index + 1).padStart(2, '0')}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm font-medium" style={{ color: colors.textSecondary }}>
                              <p>{address.addressLine}</p>
                              <p>{address.taluka}{address.taluka && address.district ? ', ' : ''}{address.district}</p>
                              <p>{address.city}{address.city && address.state ? ', ' : ''}{address.state} - {address.pincode}</p>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                              {!address.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(address)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all"
                                  style={{ color: colors.primary, borderColor: colors.accent, backgroundColor: 'white' }}
                                >
                                  Make Default
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => startEditAddress(address)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all"
                                style={{ color: colors.textMain, borderColor: colors.accent, backgroundColor: colors.pageBg }}
                              >
                                <FaEdit /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(address._id)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all"
                                style={{ color: '#B42318', borderColor: '#F2C7C4', backgroundColor: '#FFF5F4' }}
                              >
                                <FaTrash /> Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div>
                      {addressMode !== 'idle' ? (
                        <form
                          onSubmit={handleAddressSubmit}
                          className="rounded-[2rem] border p-6 md:p-8 bg-[#FCFAF5] sticky top-8"
                          style={{ borderColor: colors.accent }}
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 pb-6 border-b" style={{ borderColor: 'rgba(214, 201, 181, 0.35)' }}>
                            <div>
                              <h4 className="text-xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>
                                {editingAddressId ? 'Edit Saved Address' : 'Add New Address'}
                              </h4>
                              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                                Update the address book entry that checkout will reuse.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={resetAddressForm}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all"
                              style={{ color: colors.textMain, borderColor: colors.accent, backgroundColor: 'white' }}
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Label</label>
                              <input
                                name="label"
                                type="text"
                                value={addressForm.label}
                                onChange={handleAddressInputChange}
                                className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                                placeholder="Home"
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Street Address / Landmark</label>
                              <input
                                name="addressLine"
                                type="text"
                                value={addressForm.addressLine}
                                onChange={handleAddressInputChange}
                                className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                                placeholder="Flat, House no., Landmark"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Pincode</label>
                              <input
                                name="pincode"
                                type="text"
                                maxLength="6"
                                value={addressForm.pincode}
                                onChange={handleAddressInputChange}
                                className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                                placeholder="380054"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Taluka</label>
                              <input
                                name="taluka"
                                type="text"
                                value={addressForm.taluka}
                                onChange={handleAddressInputChange}
                                className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                                placeholder="Ghatlodia"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>District</label>
                              <input
                                name="district"
                                type="text"
                                value={addressForm.district}
                                onChange={handleAddressInputChange}
                                className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                                placeholder="Ahmedabad"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Town / City</label>
                              <input
                                name="city"
                                type="text"
                                value={addressForm.city}
                                onChange={handleAddressInputChange}
                                className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                                placeholder="Ahmedabad"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>State</label>
                              <select
                                name="state"
                                value={addressForm.state}
                                onChange={handleAddressInputChange}
                                className="w-full py-4 border-b-2 outline-none text-base font-bold bg-transparent cursor-pointer"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                              >
                                <option value="">Select State</option>
                                <option value="Gujarat">Gujarat</option>
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Rajasthan">Rajasthan</option>
                              </select>
                            </div>

                            <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border px-5 py-4" style={{ borderColor: colors.accent, backgroundColor: 'white' }}>
                              <input
                                id="address-is-default"
                                name="isDefault"
                                type="checkbox"
                                checked={addressForm.isDefault}
                                onChange={handleAddressInputChange}
                                className="h-4 w-4 accent-[#A68A64]"
                              />
                              <label htmlFor="address-is-default" className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textMain }}>
                                Make this the default shipping address
                              </label>
                            </div>
                          </div>

                          <div className="pt-10 flex justify-end">
                            <button
                              type="submit"
                              className="px-12 py-5 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl transition-all active:scale-95"
                              style={{
                                backgroundColor: colors.primary,
                                boxShadow: '0 15px 30px rgba(166, 138, 100, 0.3)'
                              }}
                            >
                              {editingAddressId ? 'Update Address' : 'Save Address'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="rounded-[2rem] border p-8 md:p-10 text-center bg-[#FCFAF5] sticky top-8" style={{ borderColor: colors.accent }}>
                          <p className="text-xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Add New Address</p>
                          <p className="mt-3 text-sm font-medium" style={{ color: colors.textSecondary }}>
                            Click Add New Address to create a new address or select an existing one to edit it.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* order tracking */
                <div className="animate-in fade-in duration-700 space-y-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-2" style={{ color: colors.textMain }}>
                    Order Tracking
                  </h2>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Live fulfillment status for your placed orders.
                  </p>

                  {orderState.status === 'loading' && (
                    <div className="rounded-2xl border px-6 py-5 text-[11px] font-bold uppercase tracking-widest" style={{ borderColor: colors.accent, color: colors.textSecondary, backgroundColor: colors.pageBg }}>
                      Loading your order timeline...
                    </div>
                  )}

                  {orderState.status === 'error' && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 text-red-700 px-6 py-5 text-[11px] font-bold uppercase tracking-widest">
                      {orderState.message}
                    </div>
                  )}

                  {orderState.status !== 'loading' && orders.length === 0 && (
                    <div className="text-center py-16 flex flex-col items-center rounded-[2.5rem] border" style={{ borderColor: colors.accent, backgroundColor: colors.pageBg }}>
                      <div className="h-20 w-20 rounded-[1.5rem] flex items-center justify-center mb-6 border" style={{ backgroundColor: colors.sectionBg, borderColor: colors.accent }}>
                        <FaBox className="text-3xl opacity-30" style={{ color: colors.textMain }} />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>
                        No Orders Yet
                      </h3>
                      <p className="mt-3 text-sm font-medium opacity-70" style={{ color: colors.textSecondary }}>
                        Once you place an order, tracking updates will appear here.
                      </p>
                    </div>
                  )}

                  {orders.map((order) => {
                    const { activeStep, isCancelled } = getStepState(order.status);
                    const returnState = getReturnRequestState(order);
                    const canRequestReturn = order.status === 'Delivered' && (!order.returnRequest || ['None', 'Rejected'].includes(order.returnRequest.status));
                    const shortOrderId = `#${order._id?.slice(-8)?.toUpperCase() || 'N/A'}`;

                    return (
                      <div
                        key={order._id}
                        className="rounded-[2rem] border p-6 md:p-8"
                        style={{ borderColor: colors.accent, backgroundColor: 'white' }}
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b" style={{ borderColor: 'rgba(214, 201, 181, 0.35)' }}>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style={{ color: colors.textMain }}>
                              Order ID
                            </p>
                            <p className="text-lg font-black tracking-wider" style={{ color: colors.textMain }}>
                              {shortOrderId}
                            </p>
                            <p className="mt-2 text-xs font-bold" style={{ color: colors.textSecondary }}>
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style={{ color: colors.textMain }}>
                              Current Status
                            </p>
                            <span className={`inline-flex mt-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${isCancelled ? 'bg-red-50 text-red-700 border border-red-100' : 'text-white'}`}
                              style={isCancelled ? undefined : { backgroundColor: colors.deepBg }}
                            >
                              {order.status || 'Processing'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-8">
                          <OrderTracker status={order.status} colors={colors} />
                        </div>

                        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(214, 201, 181, 0.35)' }}>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4" style={{ color: colors.textMain }}>
                            Ordered Products
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(order.orderItems || []).map((item, index) => {
                              const productId = getProductId(item.product);
                              const productName = getProductName(item);

                              const itemContent = (
                                <>
                                  <div className="h-16 w-16 rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: colors.accent, backgroundColor: colors.pageBg }}>
                                    <img
                                      src={item.image || 'https://via.placeholder.com/200x200?text=Product'}
                                      alt={productName}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: colors.textMain }}>
                                      {productName}
                                    </p>
                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                                      Qty: {item.qty || 1}
                                    </p>
                                  </div>
                                </>
                              );

                              if (productId) {
                                return (
                                  <Link
                                    key={`${order._id}-item-${index}`}
                                    to={`/product/${productId}`}
                                    className="flex items-center gap-4 p-3 rounded-2xl border transition-all hover:shadow-md"
                                    style={{ borderColor: colors.accent, backgroundColor: colors.pageBg }}
                                  >
                                    {itemContent}

                                    {/* Review Button Logic */}
                                    {order.status === 'Delivered' && productId && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleOpenReviewModal(item.product, order.status);
                                        }}
                                        className="ml-auto flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all hover:bg-slate-50"
                                        style={{ color: colors.primary, borderColor: colors.accent }}
                                      >
                                        <FaStar /> Write Review
                                      </button>
                                    )}
                                  </Link>
                                );
                              };
                            })}
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-5" style={{ borderColor: 'rgba(214, 201, 181, 0.35)' }}>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: colors.textMain }}>Tracking ID</p>
                            <p className="mt-2 text-sm font-bold" style={{ color: colors.textMain }}>
                              {order.trackingId ? order.trackingId : 'Will be assigned after dispatch'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: colors.textMain }}>Items</p>
                            <p className="mt-2 text-sm font-bold" style={{ color: colors.textMain }}>
                              {order.orderItems?.length || 0} item(s)
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: colors.textMain }}>Total</p>
                            <p className="mt-2 text-sm font-bold" style={{ color: colors.textMain }}>
                              INR {Number(order.totalPrice || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ borderColor: 'rgba(214, 201, 181, 0.35)' }}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${returnState.className}`}>
                              {returnState.label}
                            </span>
                            {order.returnRequest?.reason && order.returnRequest.status !== 'None' && (
                              <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                                Reason: {order.returnRequest.reason}
                              </p>
                            )}
                          </div>

                          {canRequestReturn && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturnModal(order)}
                              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border"
                              style={{ color: colors.primary, borderColor: colors.accent, backgroundColor: 'white' }}
                            >
                              <FaExchangeAlt /> Request Return
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
      <Footer />

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-10 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[9px] p-8 relative shadow-2xl" style={{ border: `1px solid ${colors.accent}` }}>
            <button
              onClick={handleCloseReviewModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2" style={{ color: colors.textMain }}>Write a Review</h3>
            <p className="text-sm opacity-60 font-bold mb-6" style={{ color: colors.textSecondary }}>Share your thoughts on {reviewModal.productName || 'this item'}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {reviewModal.message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${reviewModal.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {reviewModal.message}
                </div>
              )}

              <div className="flex justify-center space-x-2 my-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewModal(prev => ({ ...prev, rating: star }))}
                    className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                    style={{ color: star <= reviewModal.rating ? colors.primary : '#E5E7EB' }}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 block" style={{ color: colors.textMain }}>Your Experience</label>
                <textarea
                  required
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="How was the fit? The quality? What did you like?"
                  className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-amber-700 transition-colors min-h-[120px] resize-none"
                  style={{ color: colors.textMain }}
                />
              </div>

              <button
                type="submit"
                disabled={reviewModal.status === 'loading' || reviewModal.status === 'success'}
                className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: colors.deepBg }}
              >
                {reviewModal.status === 'loading' ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {returnModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[24px] p-8 relative shadow-2xl border" style={{ borderColor: colors.accent }}>
            <button
              onClick={handleCloseReturnModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2" style={{ color: colors.textMain }}>Request Return</h3>
            <p className="text-sm opacity-60 font-bold mb-6" style={{ color: colors.textSecondary }}>
              Order {returnModal.orderLabel}
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-6">
              {returnModal.message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${returnModal.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {returnModal.message}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 block" style={{ color: colors.textMain }}>
                  Return Reason
                </label>
                <textarea
                  required
                  value={returnModal.reason}
                  onChange={(e) => setReturnModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Tell us why you want to return this order..."
                  className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-amber-700 transition-colors min-h-[140px] resize-none"
                  style={{ color: colors.textMain }}
                />
              </div>

              <button
                type="submit"
                disabled={returnModal.status === 'loading' || returnModal.status === 'success'}
                className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: colors.deepBg }}
              >
                {returnModal.status === 'loading' ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;