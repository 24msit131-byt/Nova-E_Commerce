import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaTruck, FaCreditCard, FaLock, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { useCart } from '../../../context/CartContext.jsx';
import api from '../../../services/api.js';
import Footer from '../../../components/Footer.jsx';
import { toast } from 'react-toastify';

const Checkout = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { cartItems, cartTotal, clearCart } = useCart();

    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('profile');
    const [shippingDetails, setShippingDetails] = useState({
        fullName: '',
        phoneNumber: '',
        addressLine: '',
        pincode: '',
        taluka: '',
        district: '',
        city: '',
        state: ''
    });

    const normalizeStoredPromo = (promo) => {
        if (!promo?.code || typeof promo.discount !== 'number') {
            return null;
        }

        return {
            code: promo.code,
            discount: promo.discount,
            discountType: promo.discountType || null,
            discountValue: typeof promo.discountValue === 'number' ? promo.discountValue : null,
            discountDisplay: promo.discountDisplay || null
        };
    };

    const colors = {
        primary: '#A68A64',
        pageBg: '#FAF7F2',
        sectionBg: '#F2EBDD',
        deepBg: '#2C2621',
        textMain: '#4A4036',
        textSecondary: '#756A5E',
        accent: '#D6C9B5'
    };

    useEffect(() => {
        const loadRazorpay = () => {
            if (window.Razorpay) {
                setRazorpayScriptLoaded(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => setRazorpayScriptLoaded(true);
            script.onerror = () => {
                setRazorpayScriptLoaded(false);
                toast.error('Unable to load Razorpay checkout script');
            };
            document.body.appendChild(script);
        };

        loadRazorpay();
    }, []);

    useEffect(() => {
        const savedPromo = localStorage.getItem('appliedPromo');

        if (!savedPromo) return;

        try {
            const parsedPromo = JSON.parse(savedPromo);
            const normalizedPromo = normalizeStoredPromo(parsedPromo);
            if (normalizedPromo) setAppliedPromo(normalizedPromo);
        } catch (error) {
            localStorage.removeItem('appliedPromo');
        }
    }, []);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!user) return;

            if (user.role === 'admin') {
                setShippingDetails((prev) => ({ ...prev, fullName: user.fullName || '', phoneNumber: user.phoneNumber || '' }));
                return;
            }

            try {
                const response = await api.get('/user/me');

                if (response.data.status === 'success') {
                    const fullUserData = response.data?.data?.user;

                    if (!fullUserData) {
                        setShippingDetails((prev) => ({ ...prev, fullName: user.fullName || '', phoneNumber: user.phoneNumber || '' }));
                        return;
                    }

                    const addresses = Array.isArray(fullUserData.addresses) ? fullUserData.addresses : [];
                    const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0] || null;

                    setSavedAddresses(addresses);

                    if (defaultAddress) {
                        setSelectedAddressId(String(defaultAddress._id || 'profile'));
                        setShippingDetails((prev) => ({
                            ...prev,
                            fullName: fullUserData.fullName || '',
                            phoneNumber: fullUserData.phoneNumber || '',
                            addressLine: defaultAddress.addressLine || fullUserData.addressLine || '',
                            pincode: defaultAddress.pincode || fullUserData.pincode || '',
                            taluka: defaultAddress.taluka || fullUserData.taluka || '',
                            district: defaultAddress.district || fullUserData.district || '',
                            city: defaultAddress.city || fullUserData.city || '',
                            state: defaultAddress.state || fullUserData.state || ''
                        }));
                        return;
                    }

                    setShippingDetails((prev) => ({
                        ...prev,
                        fullName: fullUserData.fullName || '',
                        phoneNumber: fullUserData.phoneNumber || '',
                        addressLine: fullUserData.addressLine || '',
                        pincode: fullUserData.pincode || '',
                        taluka: fullUserData.taluka || '',
                        district: fullUserData.district || '',
                        city: fullUserData.city || '',
                        state: fullUserData.state || ''
                    }));
                    setSelectedAddressId('profile');
                }
            } catch (error) {
                console.error('Error fetching full user details:', error.response?.data || error.message);
                setShippingDetails((prev) => ({ ...prev, fullName: user.fullName || '', phoneNumber: user.phoneNumber || '' }));
            }
        };

        fetchUserDetails();
    }, [user]);

    const subtotal = cartTotal;
    const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : 50;
    const gst = subtotal > 0 ? subtotal * 0.18 : 0;
    const promoDiscount = appliedPromo ? Math.min(appliedPromo.discount, subtotal) : 0;
    const total = subtotal + shipping + gst - promoDiscount;

    const handleShippingChange = (e) => {
        const { name, value } = e.target;
        setShippingDetails((prev) => ({ ...prev, [name]: value }));
        setSelectedAddressId('profile');
    };

    const useSavedAddress = (address) => {
        if (!address) return;

        setSelectedAddressId(String(address._id || 'profile'));
        setShippingDetails((prev) => ({
            ...prev,
            addressLine: address.addressLine || '',
            pincode: address.pincode || '',
            state: address.state || '',
            district: address.district || '',
            taluka: address.taluka || '',
            city: address.city || ''
        }));
    };

    const buildOrderPayload = (selectedPaymentMethod) => ({
        orderItems: cartItems.map((item) => ({
            name: item.product?.name,
            qty: item.quantity,
            image: item.product?.images?.[0] || '',
            price: item.product?.price,
            product: item.product?._id
        })),
        promoCode: appliedPromo?.code || '',
        promoDiscount,
        shippingAddress: {
            address: shippingDetails.addressLine,
            city: shippingDetails.city || shippingDetails.district,
            postalCode: shippingDetails.pincode,
            country: 'India'
        },
        paymentMethod: selectedPaymentMethod,
        taxPrice: gst,
        shippingPrice: shipping,
        totalPrice: total
    });

    const cancelPendingRazorpayOrder = async (orderId) => {
        if (!orderId) return;

        try {
            await api.post('/orders/razorpay/cancel', { orderId });
        } catch (error) {
            console.error('Failed to cancel pending Razorpay order:', error.response?.data || error.message);
        }
    };

    const startRazorpayCheckout = async () => {
        const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

        if (!keyId) {
            throw new Error('Razorpay public key is missing in client .env');
        }

        if (!razorpayScriptLoaded || !window.Razorpay) {
            throw new Error('Razorpay checkout is not ready yet');
        }

        const response = await api.post('/orders/razorpay/create', buildOrderPayload('Razorpay'));
        const createdOrder = response.data?.data?.order;
        const razorpayOrder = response.data?.data?.razorpayOrder;
        const orderId = createdOrder?._id;

        if (!createdOrder || !razorpayOrder || !orderId) {
            throw new Error('Unable to initialize Razorpay payment');
        }

        const options = {
            key: keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'Nova',
            description: 'Secure payment for your Nova order',
            order_id: razorpayOrder.id,
            prefill: {
                name: shippingDetails.fullName || user?.fullName || '',
                email: user?.email || '',
                contact: user?.phoneNumber || ''
            },
            notes: {
                orderId
            },
            theme: {
                color: colors.primary
            },
            handler: async (paymentResponse) => {
                try {
                    await api.post('/orders/razorpay/verify', {
                        orderId,
                        razorpay_order_id: paymentResponse.razorpay_order_id,
                        razorpay_payment_id: paymentResponse.razorpay_payment_id,
                        razorpay_signature: paymentResponse.razorpay_signature
                    });

                    await clearCart();
                    localStorage.removeItem('appliedPromo');
                    toast.success('Payment successful and order confirmed!');
                    navigate('/');
                } catch (error) {
                    console.error('Razorpay verification failed:', error.response?.data || error.message);
                    toast.error(error.response?.data?.message || 'Payment was captured but verification failed.');
                    await cancelPendingRazorpayOrder(orderId);
                } finally {
                    setIsProcessing(false);
                }
            },
            modal: {
                ondismiss: async () => {
                    await cancelPendingRazorpayOrder(orderId);
                    setIsProcessing(false);
                }
            }
        };

        const razorpay = new window.Razorpay(options);

        razorpay.on('payment.failed', async (response) => {
            console.error('Razorpay payment failed:', response.error);
            await cancelPendingRazorpayOrder(orderId);
            setIsProcessing(false);
            toast.error(response.error?.description || 'Payment failed. Please try again.');
        });

        razorpay.open();
    };

    const completeCodOrder = async () => {
        const response = await api.post('/orders', buildOrderPayload('Cash on Delivery'));

        if (response.data.success) {
            await clearCart();
            localStorage.removeItem('appliedPromo');
            toast.success('Order placed successfully!');
            navigate('/');
        }
    };

    const handlePlaceOrder = async () => {
        if (!paymentMethod || cartItems.length === 0) return;
        setIsProcessing(true);

        try {
            if (paymentMethod === 'razorpay') {
                await startRazorpayCheckout();
                return;
            }

            await completeCodOrder();
        } catch (error) {
            console.error('Error placing order:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
            setIsProcessing(false);
        } finally {
            if (paymentMethod !== 'razorpay') {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-0 w-full overflow-x-hidden" style={{ backgroundColor: colors.pageBg }}>
            <div className="w-full px-6 md:px-10 lg:px-16 py-12 mb-12 flex flex-col md:flex-row items-center justify-between border-b" style={{ backgroundColor: 'white', borderColor: colors.accent }}>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none" style={{ color: colors.textMain }}>Secure Checkout</h1>
                    <div className="flex items-center space-x-3 mt-4 text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                        <Link to="/cart" className="hover:text-[#A68A64] transition-colors">Your Bag</Link>
                        <FaChevronRight size={8} className="opacity-30" />
                        <span style={{ color: colors.primary }}>Final Curation</span>
                    </div>
                </div>
                <div className="mt-8 md:mt-0 flex items-center space-x-4 bg-green-50 px-6 py-4 rounded-3xl border border-green-100">
                    <FaLock size={14} className="text-green-600" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-green-700">SSL Secure Fulfillment</span>
                </div>
            </div>

            <div className="w-full px-6 md:px-10 lg:px-16 max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-16 pb-32">
                <div className="flex-[1.5] space-y-20">
                    <section>
                        <div className="flex items-center space-x-4 mb-12">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ backgroundColor: colors.deepBg }}>1</div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Shipping Logistics</h2>
                        </div>

                        <div className="mb-10 rounded-[2.5rem] border p-6 md:p-8" style={{ borderColor: colors.accent, backgroundColor: 'white' }}>
                            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Saved Addresses</p>
                                    <h3 className="mt-2 text-xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Choose a delivery address</h3>
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                                    Manage the list in your profile.
                                </p>
                            </div>

                            {savedAddresses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {savedAddresses.map((address, index) => {
                                        const isSelected = String(selectedAddressId) === String(address._id);

                                        return (
                                            <button
                                                key={address._id}
                                                type="button"
                                                onClick={() => useSavedAddress(address)}
                                                className={`text-left rounded-[1.75rem] border p-5 transition-all ${isSelected ? 'shadow-lg' : 'hover:shadow-md'}`}
                                                style={{
                                                    borderColor: isSelected ? colors.primary : colors.accent,
                                                    backgroundColor: isSelected ? colors.pageBg : 'white'
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <div>
                                                        <p className="font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>
                                                            {address.label || `Address ${index + 1}`}
                                                        </p>
                                                        {address.isDefault && (
                                                            <span className="mt-2 inline-flex px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: colors.primary }}>
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1 text-sm font-medium" style={{ color: colors.textSecondary }}>
                                                    <p>{address.addressLine}</p>
                                                    <p>{address.taluka}{address.taluka && address.district ? ', ' : ''}{address.district}</p>
                                                    <p>{address.city}{address.city && address.state ? ', ' : ''}{address.state} - {address.pincode}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-[1.75rem] border border-dashed p-6 text-sm font-medium" style={{ borderColor: colors.accent, color: colors.textSecondary }}>
                                    No saved addresses yet. Use the form below or add addresses from your profile.
                                </div>
                            )}
                        </div>

                        <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Full Legal Name</label>
                                <input name="fullName" value={shippingDetails.fullName} onChange={handleShippingChange} type="text" className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} placeholder="Rahul Prajapati" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Phone Number</label>
                                <input name="phoneNumber" value={shippingDetails.phoneNumber} onChange={handleShippingChange} type="text" className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} placeholder="1234567890" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Street Address / Landmark</label>
                                <input name="addressLine" value={shippingDetails.addressLine} onChange={handleShippingChange} type="text" className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} placeholder="123, Luxury Residency..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Pincode</label>
                                <input name="pincode" value={shippingDetails.pincode} onChange={handleShippingChange} type="text" className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} placeholder="380054" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Taluka / Sector</label>
                                <input name="taluka" value={shippingDetails.taluka} onChange={handleShippingChange} type="text" className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} placeholder="Ghatlodia" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>District</label>
                                <input name="district" value={shippingDetails.district} onChange={handleShippingChange} type="text" className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} placeholder="Ahmedabad" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Town / City</label>
                                <input name="city" value={shippingDetails.city} onChange={handleShippingChange} type="text" className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} placeholder="Ahmedabad" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>State</label>
                                <div className="relative">
                                    <select name="state" value={shippingDetails.state} onChange={handleShippingChange} className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent appearance-none cursor-pointer" style={{ borderColor: colors.accent, color: colors.textMain }}>
                                        <option value="" disabled>Select state</option>
                                        <option value="Gujarat">Gujarat</option>
                                        <option value="Maharashtra">Maharashtra</option>
                                        <option value="Rajasthan">Rajasthan</option>
                                    </select>
                                    <FaChevronDown className="absolute right-2 bottom-5 pointer-events-none text-xs opacity-30" />
                                </div>
                            </div>
                        </form>
                    </section>

                    <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-sm border" style={{ borderColor: colors.accent }}>
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b" style={{ borderColor: 'rgba(214, 201, 181, 0.3)' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ backgroundColor: colors.primary }}>2</div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Payment Method</h2>
                        </div>

                        <div className="space-y-5">
                            <label className={`block border-2 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 ${paymentMethod === 'razorpay' ? 'shadow-2xl' : 'hover:shadow-lg'}`} style={{ borderColor: paymentMethod === 'razorpay' ? colors.primary : colors.accent, backgroundColor: paymentMethod === 'razorpay' ? colors.pageBg : 'white' }}>
                                <div className="flex items-start">
                                    <div className="mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all" style={{ borderColor: paymentMethod === 'razorpay' ? colors.primary : colors.accent }}>
                                        {paymentMethod === 'razorpay' && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.primary }}></div>}
                                    </div>
                                    <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="hidden" />
                                    <div className="ml-6 flex-1">
                                        <div className="flex items-center justify-between mb-3 gap-4">
                                            <span className="font-black text-xl uppercase tracking-tighter" style={{ color: colors.textMain }}>Razorpay Secure Gateway</span>
                                            <FaCreditCard className="text-2xl opacity-30" style={{ color: colors.textMain }} />
                                        </div>
                                        <p className="text-sm font-medium opacity-60" style={{ color: colors.textSecondary }}>Supports UPI, cards, netbanking, wallets, and more through Razorpay.</p>
                                        {paymentMethod === 'razorpay' && (
                                            <div className="mt-8 pt-8 border-t border-dashed overflow-hidden" style={{ borderColor: colors.accent }}>
                                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                    {['UPI', 'Cards', 'Netbanking', 'Wallets'].map((method) => (
                                                        <div key={method} className="px-4 py-3 bg-white border rounded-2xl text-[10px] font-black uppercase tracking-widest text-center" style={{ borderColor: colors.accent, color: colors.textSecondary }}>
                                                            {method}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-6 text-sm font-medium opacity-60" style={{ color: colors.textSecondary }}>You will be redirected to Razorpay's secure payment window after confirming the order.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </label>

                            <label className={`block border-2 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 ${paymentMethod === 'cod' ? 'shadow-2xl' : 'hover:shadow-lg'}`} style={{ borderColor: paymentMethod === 'cod' ? colors.primary : colors.accent, backgroundColor: paymentMethod === 'cod' ? colors.pageBg : 'white' }}>
                                <div className="flex items-start">
                                    <div className="mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all" style={{ borderColor: paymentMethod === 'cod' ? colors.primary : colors.accent }}>
                                        {paymentMethod === 'cod' && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.primary }}></div>}
                                    </div>
                                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                                    <div className="ml-6 flex-1">
                                        <span className="font-black text-xl uppercase tracking-tighter" style={{ color: colors.textMain }}>Collection on Delivery</span>
                                        <p className="text-sm font-medium opacity-60 mt-2" style={{ color: colors.textSecondary }}>Fulfill payment upon arrival of your sanctuary curation.</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <aside className="w-full lg:w-[450px]">
                    <div className="sticky top-32 space-y-8">
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border flex flex-col" style={{ borderColor: colors.accent }}>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-10" style={{ color: colors.textMain }}>Order Summary</h2>

                            <div className="space-y-5 mb-10">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                                    <span>Items ({cartItems.length})</span>
                                    <span style={{ color: colors.textMain }}>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                                    <span>Logistics</span>
                                    <span style={{ color: shipping === 0 ? '#007600' : colors.textMain }}>
                                        {shipping === 0 ? 'COMPLIMENTARY' : `₹${shipping.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                                    <span>Est. Taxation (18%)</span>
                                    <span style={{ color: colors.textMain }}>₹{gst.toFixed(2)}</span>
                                </div>
                                {appliedPromo && (
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: colors.primary }}>
                                        <span>Promo Discount</span>
                                        <span>- ₹{promoDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-8 border-t border-dashed flex justify-between items-end" style={{ borderColor: colors.accent }}>
                                    <span className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: colors.textMain }}>Total Due</span>
                                    <span className="text-4xl font-black tracking-tighter" style={{ color: colors.primary }}>₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="rounded-[2rem] p-6 mb-10 shadow-inner" style={{ backgroundColor: colors.pageBg }}>
                                <h3 className="font-black text-[10px] uppercase tracking-widest mb-5 opacity-40">Bag Preview</h3>
                                <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {cartItems.map((item) => (
                                        <div key={item._id} className="flex items-center justify-between text-[11px] font-bold">
                                            <span className="truncate w-40 uppercase tracking-wider" style={{ color: colors.textMain }}>{item.product?.name}</span>
                                            <span className="px-3 py-1 rounded-full bg-white shadow-sm border" style={{ borderColor: colors.accent, color: colors.primary }}>x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={isProcessing || !paymentMethod}
                                className={`w-full py-6 rounded-full font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 flex items-center justify-center group ${!paymentMethod ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'text-white'}`}
                                style={{ backgroundColor: paymentMethod ? colors.primary : undefined, boxShadow: paymentMethod ? '0 15px 30px rgba(166, 138, 100, 0.3)' : 'none' }}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center">
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-4"></div>
                                        Securing Order...
                                    </span>
                                ) : (
                                    <>
                                        <span>{paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 'Confirm Order'}</span>
                                        <FaChevronRight className="ml-4 text-[8px] group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="mt-8 flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] opacity-30">
                                <FaShieldAlt size={12} />
                                <span>Verified Payment Infrastructure</span>
                            </div>
                        </div>

                        <div className="px-8 text-[10px] font-medium leading-relaxed opacity-50 text-center" style={{ color: colors.textSecondary }}>
                            By confirming your selection, you agree to the <span className="font-black" style={{ color: colors.primary }}>Nova Sanctuary</span> privacy manifesto and conditions of use.
                        </div>
                    </div>
                </aside>
            </div>
            <Footer />
        </div>
    );
};

export default Checkout;