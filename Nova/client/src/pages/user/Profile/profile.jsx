import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaMapMarkedAlt, FaShieldAlt, FaStar, FaTimes } from 'react-icons/fa';
import api from '../../../services/api';
import Footer from '../../../components/Footer';

const ORDER_STEPS = ['Processing', 'Packed', 'Shipped', 'Delivered'];

const getStepState = (status) => {
  if (status === 'Cancelled') {
    return {
      activeStep: -1,
      isCancelled: true
    };
  }

  const normalizedStatus = ORDER_STEPS.includes(status) ? status : 'Processing';
  return {
    activeStep: ORDER_STEPS.indexOf(normalizedStatus),
    isCancelled: false
  };
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

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const [orders, setOrders] = useState([]);
  const [orderState, setOrderState] = useState({ status: 'idle', message: '' });

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user/me');
        if (response.data?.data?.user) {
          const user = response.data.data.user;
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

  useEffect(() => {
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

              {activeTab === 'profile' || activeTab === 'address' ? (
                <div className="animate-in fade-in duration-700">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-10 pb-4 border-b" style={{ color: colors.textMain, borderColor: 'rgba(214, 201, 181, 0.3)' }}>Edit Profile & Address</h2>

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

                    {/* Address Section */}
                    <div className="pt-10 border-t" style={{ borderColor: 'rgba(214, 201, 181, 0.3)' }}>
                      <h3 className="text-xl font-black uppercase tracking-tighter mb-10 flex items-center" style={{ color: colors.textMain }}>
                        <FaMapMarkedAlt className="mr-4" style={{ color: colors.primary }} /> Shipping Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Street Address / Landmark</label>
                          <input
                            name="addressLine"
                            type="text"
                            value={userDetails.addressLine}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Flat, House no., Landmark"
                            className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent disabled:opacity-50"
                            style={{ borderColor: colors.accent, color: colors.textMain }}
                            onFocus={(e) => e.target.style.borderColor = colors.primary}
                            onBlur={(e) => e.target.style.borderColor = colors.accent}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Pincode</label>
                          <input
                            name="pincode"
                            type="text"
                            maxLength="6"
                            value={userDetails.pincode}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="380054"
                            className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent disabled:opacity-50"
                            style={{ borderColor: colors.accent, color: colors.textMain }}
                            onFocus={(e) => e.target.style.borderColor = colors.primary}
                            onBlur={(e) => e.target.style.borderColor = colors.accent}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Taluka</label>
                          <input
                            name="taluka"
                            type="text"
                            value={userDetails.taluka}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent disabled:opacity-50"
                            style={{ borderColor: colors.accent, color: colors.textMain }}
                            onFocus={(e) => e.target.style.borderColor = colors.primary}
                            onBlur={(e) => e.target.style.borderColor = colors.accent}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>District</label>
                          <input
                            name="district"
                            type="text"
                            value={userDetails.district}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent disabled:opacity-50"
                            style={{ borderColor: colors.accent, color: colors.textMain }}
                            onFocus={(e) => e.target.style.borderColor = colors.primary}
                            onBlur={(e) => e.target.style.borderColor = colors.accent}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Town/City</label>
                          <input
                            name="city"
                            type="text"
                            value={userDetails.city}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent disabled:opacity-50"
                            style={{ borderColor: colors.accent, color: colors.textMain }}
                            onFocus={(e) => e.target.style.borderColor = colors.primary}
                            onBlur={(e) => e.target.style.borderColor = colors.accent}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>State</label>
                          <select
                            name="state"
                            value={userDetails.state}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="w-full py-4 border-b-2 outline-none text-base font-bold bg-transparent cursor-pointer disabled:opacity-50"
                            style={{ borderColor: colors.accent, color: colors.textMain }}
                          >
                            <option value="">Select State</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Rajasthan">Rajasthan</option>
                          </select>
                        </div>
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {ORDER_STEPS.map((step, index) => {
                              const completed = !isCancelled && index <= activeStep;
                              return (
                                <div key={`${order._id}-${step}`} className="flex items-center gap-3">
                                  <div
                                    className="h-7 w-7 rounded-full border flex items-center justify-center text-[10px] font-black"
                                    style={{
                                      borderColor: completed ? colors.primary : colors.accent,
                                      color: completed ? 'white' : colors.textSecondary,
                                      backgroundColor: completed ? colors.primary : 'transparent'
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                  <span
                                    className="text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: completed ? colors.textMain : colors.textSecondary, opacity: completed ? 1 : 0.7 }}
                                  >
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {isCancelled && (
                            <p className="mt-5 text-xs font-bold text-red-600">
                              This order has been cancelled and will not move through further tracking steps.
                            </p>
                          )}
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
    </div>
  );
};

export default Profile;