import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrashAlt, FaPlus, FaMinus, FaChevronRight,
    FaShoppingBag, FaTruck, FaTag, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import { useCart } from '../../../context/CartContext';
import api from '../../../services/api';
import Footer from '../../../components/Footer';

const Cart = () => {
    const {
        cartItems,
        cartTotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart
    } = useCart();
    const navigate = useNavigate();

    // Nova Brand Palette
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        pageBg: '#e9e4dc',      // Warm Cream
        sectionBg: '#F2EBDD',   // Grounded Beige
        deepBg: '#2C2621',      // Deep Grounded Brown
        textMain: '#4A4036',    // Dark Brown
        textSecondary: '#756A5E', // Medium Brown
        accent: '#D6C9B5',      // Light Beige Borders
        success: '#5B8C5A'      // Soft Sage Green
    };

    // --- Promo Code States (Logic preserved) ---
    const [promoInput, setPromoInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState("");
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [relatedError, setRelatedError] = useState("");
    const [addingRelatedId, setAddingRelatedId] = useState(null);

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
    

    // --- Delivery & Calculation Logic (Logic preserved) ---
    const subtotal = cartTotal;
    const freeDeliveryThreshold = 1000;
    const amountNeeded = freeDeliveryThreshold - subtotal;
    const progressPercentage = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);

    const shipping = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : 50;
    const discount = appliedPromo ? Math.min(appliedPromo.discount, subtotal) : 0;
    const gst = subtotal > 0 ? (subtotal * 0.18) : 0;
    const total = subtotal + shipping + gst - discount;

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

    const handleQuantityChange = (productId, currentQty, delta) => {
        const newQty = currentQty + delta;
        if (newQty >= 1) updateQuantity(productId, newQty);
    };

    const goToProductDetails = (productId) => {
        if (!productId) return;
        navigate(`/product/${productId}`);
    };

    useEffect(() => {
        let isMounted = true;

        const fetchRelatedProducts = async () => {
            if (cartItems.length === 0) {
                setRelatedProducts([]);
                setRelatedError("");
                setRelatedLoading(false);
                return;
            }

            setRelatedLoading(true);
            setRelatedError("");

            try {
                const inCartIds = new Set(
                    cartItems
                        .map((item) => item.product?._id)
                        .filter(Boolean)
                );

                const relatedRequests = [...inCartIds].map((productId) =>
                    api.get(`/products/related/${productId}`).catch(() => null)
                );

                const responses = await Promise.all(relatedRequests);
                const seen = new Set(inCartIds);
                const mergedRelated = [];

                responses.forEach((response) => {
                    const items = response?.data?.data || [];
                    items.forEach((product) => {
                        if (!product?._id || seen.has(product._id)) return;
                        seen.add(product._id);
                        mergedRelated.push(product);
                    });
                });

                if (mergedRelated.length > 0) {
                    if (isMounted) {
                        setRelatedProducts(mergedRelated.slice(0, 8));
                    }
                    return;
                }

                // Fallback: if related endpoint returns none, suggest same-category products.
                const { data } = await api.get('/products');
                const cartCategories = new Set(
                    cartItems
                        .map((item) => item.product?.category?.toLowerCase())
                        .filter(Boolean)
                );

                const fallbackProducts = (data?.data || [])
                    .filter((product) => {
                        const productId = product?._id;
                        const productCategory = product?.category?.toLowerCase();
                        return productId && !inCartIds.has(productId) && cartCategories.has(productCategory);
                    })
                    .slice(0, 8);

                if (isMounted) {
                    setRelatedProducts(fallbackProducts);
                }
            } catch (err) {
                if (isMounted) {
                    setRelatedError('Could not load recommendations right now.');
                    setRelatedProducts([]);
                }
            } finally {
                if (isMounted) {
                    setRelatedLoading(false);
                }
            }
        };

        fetchRelatedProducts();

        return () => {
            isMounted = false;
        };
    }, [cartItems]);

    const handleAddRelatedToCart = async (productId) => {
        if (!productId) return;
        try {
            setAddingRelatedId(productId);
            await addToCart(productId, 1);
        } catch (err) {
            console.error('Failed to add related product:', err);
        } finally {
            setAddingRelatedId(null);
        }
    };

    // --- Promo Logic Handler ---
    const applyPromoCode = async () => {
        setPromoError("");
        if (promoInput.trim() === "") {
            setPromoError("Please enter a code.");
            return;
        }

        try {
            const { data } = await api.post('/promos/validate', { 
                code: promoInput,
                subtotal 
            });

            if (data.success) {
                const promo = {
                    code: data.code,
                    discount: data.discountAmount,
                    discountType: data.discountType,
                    discountValue: data.discountValue,
                    discountDisplay: data.discountDisplay
                };
                setAppliedPromo(promo);
                localStorage.setItem('appliedPromo', JSON.stringify(promo));
                setPromoInput("");
            }
        } catch (err) {
            setPromoError(err.response?.data?.message || "Invalid or expired code.");
            setAppliedPromo(null);
            localStorage.removeItem('appliedPromo');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-28 pb-20 w-full flex items-center justify-center" style={{ backgroundColor: colors.pageBg }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-0 w-full overflow-x-hidden" style={{ backgroundColor: colors.pageBg }}>

            {/* 1. Header Area - High Impact Brand Color */}
            <div className="w-full px-6 md:px-10 py-16 text-white mb-12 relative overflow-hidden" style={{ backgroundColor: colors.deepBg }}>
                <div className="absolute top-0 right-0 w-80 h-80 opacity-10 blur-3xl rounded-full" style={{ backgroundColor: colors.primary }}></div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase relative z-10">Your Sanctuary <span style={{ color: colors.primary }}>Bag</span></h1>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.3em] opacity-60 relative z-10">Review your curation before secure checkout.</p>
            </div>

            <div className="w-full px-6 md:px-10 lg:px-16 max-w-[1500px] mx-auto pb-20">
                {cartItems.length > 0 ? (
                    <div className="space-y-14">
                        <div className="flex flex-col lg:flex-row gap-12">

                        {/* 1. PRODUCT LIST SECTION */}
                        <div className="flex-1 space-y-8">
                            <div className="border-b pb-4" style={{ borderColor: colors.accent }}>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Collection Details</span>
                            </div>

                            {cartItems.map((item) => (
                                <div key={item._id} className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b group" style={{ borderColor: 'rgba(214, 201, 181, 0.4)' }}>
                                    <button
                                        type="button"
                                        onClick={() => goToProductDetails(item.product?._id)}
                                        className="h-32 w-32 rounded-3xl overflow-hidden flex-shrink-0 border bg-white shadow-sm cursor-pointer"
                                        style={{ borderColor: colors.accent }}
                                        aria-label={`View details for ${item.product?.name || 'product'}`}
                                    >
                                        <img src={item.product?.images?.[0] || 'https://via.placeholder.com/200'} alt={item.product?.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </button>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: colors.primary }}>{item.product?.category}</p>
                                        <h3 className="text-lg font-bold tracking-tight" style={{ color: colors.textMain }}>{item.product?.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-sm font-bold opacity-40" style={{ color: colors.textSecondary }}>₹{item.product?.price}</p>
                                            {typeof item.product?.stock === 'number' && (
                                                item.product.stock > 0 ? (
                                                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: item.product.stock <= 5 ? '#eab308' : colors.success }}>
                                                        {item.product.stock <= 5 ? `Only ${item.product.stock} left in stock` : 'In Stock'}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Out of Stock</p>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Tactile Quantity pill */}
                                    <div className="flex items-center rounded-2xl p-1 shadow-inner border bg-slate-50" style={{ borderColor: colors.accent }}>
                                        <button onClick={() => handleQuantityChange(item.product?._id, item.quantity, -1)} className="p-3 rounded-xl hover:bg-white transition-all active:scale-90 flex items-center justify-center disabled:opacity-50" style={{ color: colors.primary }} disabled={item.quantity <= 1}><FaMinus size={10} /></button>
                                        <span className="px-4 text-base font-black" style={{ color: colors.textMain }}>{item.quantity}</span>
                                        <button onClick={() => handleQuantityChange(item.product?._id, item.quantity, 1)} className="p-3 rounded-xl hover:bg-white transition-all active:scale-90 flex items-center justify-center disabled:opacity-50" style={{ color: colors.primary }} disabled={typeof item.product?.stock === 'number' && item.quantity >= item.product.stock}><FaPlus size={10} /></button>
                                    </div>

                                    <div className="text-right min-w-[120px]">
                                        <p className="text-xl font-black" style={{ color: colors.textMain }}>₹{(item.product?.price || 0) * item.quantity}</p>
                                        <button onClick={() => removeFromCart(item.product?._id)} className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-300 hover:text-red-500 transition-colors flex items-center justify-end gap-2 ml-auto">
                                            <FaTrashAlt size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                            {/* 2. ORDER SUMMARY ASIDE */}
                            <aside className="w-full lg:w-[400px]">
                                <div className="sticky top-32 space-y-6">

                                    {/* Delivery Progress Bar - Brand Styled */}
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border" style={{ borderColor: colors.accent }}>
                                        <div className="flex items-center gap-3 mb-5">
                                            <FaTruck style={{ color: progressPercentage >= 100 ? colors.success : colors.primary }} />
                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMain }}>{progressPercentage >= 100 ? 'Complimentary Delivery Unlocked' : 'Shipping Progress'}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} className="h-full" style={{ backgroundColor: progressPercentage >= 100 ? colors.success : colors.primary }} />
                                        </div>
                                        <p className="mt-4 text-[11px] font-medium text-center" style={{ color: colors.textSecondary }}>
                                            {progressPercentage < 100 ? `Add ₹${amountNeeded.toFixed(0)} more for FREE shipping!` : "Your curation ships complimentary."}
                                        </p>
                                    </div>

                                    {/* PROMO CODE SECTION - Brand Styled */}
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border" style={{ borderColor: colors.accent }}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <FaTag style={{ color: colors.primary }} />
                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMain }}>Boutique Access Code</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={promoInput}
                                                onChange={(e) => setPromoInput(e.target.value)}
                                                placeholder="NOVA10"
                                                className="flex-1 border rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest focus:outline-none"
                                                style={{ backgroundColor: colors.pageBg, borderColor: colors.accent, color: colors.textMain }}
                                            />
                                            <button
                                                onClick={applyPromoCode}
                                                className="px-6 py-3 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md"
                                                style={{ backgroundColor: colors.textMain }}
                                            >
                                                Apply
                                            </button>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {promoError && (
                                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[10px] font-bold text-red-400 flex items-center gap-2">
                                                    <FaTimesCircle /> {promoError}
                                                </motion.p>
                                            )}
                                            {appliedPromo && (
                                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-5 p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: colors.pageBg, border: `1px solid ${colors.accent}` }}>
                                                    <div className="flex items-center gap-2">
                                                        <FaCheckCircle style={{ color: colors.success }} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.success }}>{appliedPromo.code} Active</span>
                                                    </div>
                                                    <button onClick={() => {
                                                        setAppliedPromo(null);
                                                        localStorage.removeItem('appliedPromo');
                                                    }} className="text-[9px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity">Remove</button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Main Summary Card - High Impact Deep BG */}
                                    <div className="p-10 rounded-[3rem] shadow-2xl border text-white" style={{ backgroundColor: colors.deepBg, borderColor: colors.accent }}>
                                        <h2 className="text-xl font-black uppercase tracking-tighter mb-10">Curation <span style={{ color: colors.primary }}>Summary</span></h2>
                                        <div className="space-y-5">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                                                <span>Subtotal</span>
                                                <span>₹{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                                                <span>Shipping</span>
                                                <span style={{ color: shipping === 0 ? colors.success : 'inherit' }}>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                                                <span>Est. GST (18%)</span>
                                                <span>₹{gst.toFixed(2)}</span>
                                            </div>

                                            {appliedPromo && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between text-xs font-bold uppercase tracking-widest" style={{ color: colors.primary }}>
                                                    <span>Promo Discount</span>
                                                    <span>- ₹{appliedPromo.discount.toFixed(2)}</span>
                                                </motion.div>
                                            )}

                                            <hr className="opacity-10 my-6" />
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-black uppercase tracking-widest">Total Investment</span>
                                                <span className="text-3xl font-black" style={{ color: colors.primary }}>₹{total.toFixed(0)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-12">
                                            <button
                                                onClick={() => navigate('/checkout')}
                                                className="w-full py-6 rounded-full font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-lg flex items-center justify-center group text-white"
                                                style={{ backgroundColor: colors.primary }}
                                            >
                                                <span>Secure Checkout</span>
                                                <FaChevronRight className="ml-4 text-[8px] group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* Related Products */}                            
                        <section className="pt-2">
                            <div className="flex items-center justify-between mb-7 border-b pb-4" style={{ borderColor: colors.accent }}>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Recommendations</span>
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2" style={{ color: colors.textMain }}>
                                        Related Picks For You
                                    </h2>
                                </div>
                                <Link to="/products" className="text-[10px] font-black uppercase tracking-widest hover:opacity-100 opacity-70" style={{ color: colors.primary }}>
                                    View All
                                </Link>
                            </div>

                            {relatedLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map((skeleton) => (
                                        <div key={skeleton} className="h-[340px] rounded-[2rem] border animate-pulse bg-white" style={{ borderColor: colors.accent }}></div>
                                    ))}
                                </div>
                            ) : relatedError ? (
                                <div className="p-6 rounded-2xl border text-sm font-bold" style={{ borderColor: colors.accent, color: colors.textSecondary }}>
                                    {relatedError}
                                </div>
                            ) : relatedProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {relatedProducts.map((product) => (
                                        <div key={product._id} className="group bg-white rounded-[2rem] overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300" style={{ borderColor: colors.accent }}>
                                            <button
                                                type="button"
                                                onClick={() => goToProductDetails(product._id)}
                                                className="w-full aspect-square overflow-hidden"
                                                aria-label={`View details for ${product.name || 'product'}`}
                                            >
                                                <img
                                                    src={product.images?.[0] || 'https://via.placeholder.com/200'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            </button>

                                            <div className="p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: colors.primary }}>
                                                    {product.category || 'Care'}
                                                </p>
                                                <h3 className="text-base font-bold line-clamp-1" style={{ color: colors.textMain }}>
                                                    {product.name}
                                                </h3>
                                                <div className="mt-3">
                                                    {typeof product.stock === 'number' && (
                                                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: product.stock <= 0 ? '#ef4444' : (product.stock <= 5 ? '#eab308' : '#5B8C5A') }}>
                                                            {product.stock <= 0 ? 'Out of Stock' : (product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In Stock')}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between gap-3 mt-1">
                                                        <p className="text-lg font-black" style={{ color: colors.textMain }}>₹{product.price}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddRelatedToCart(product._id)}
                                                            disabled={addingRelatedId === product._id || product.stock <= 0}
                                                            className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                                            style={{ backgroundColor: product.stock <= 0 ? '#d1d5db' : colors.primary, color: product.stock <= 0 ? '#9ca3af' : 'white' }}
                                                        >
                                                            {addingRelatedId === product._id ? 'Adding...' : (product.stock <= 0 ? 'Out' : 'Add')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 rounded-[2rem] border bg-white text-center" style={{ borderColor: colors.accent }}>
                                    <p className="text-sm font-bold opacity-70" style={{ color: colors.textSecondary }}>
                                        Add more items to your cart to unlock personalized picks.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                ) : (
                    /* EMPTY CART STATE - Boutique Design */
                    <div className="w-full py-40 flex flex-col items-center justify-center">
                        <div className="h-28 w-28 rounded-[2.5rem] flex items-center justify-center mb-8 border-2 shadow-inner" style={{ backgroundColor: colors.sectionBg, borderColor: colors.accent }}>
                            <FaShoppingBag className="text-4xl opacity-20" style={{ color: colors.textMain }} />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Your bag is empty</h2>
                        <p className="mt-3 text-sm font-medium opacity-60" style={{ color: colors.textSecondary }}>Begin your home care journey through our collection.</p>
                        <Link to="/products" className="mt-10 px-14 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 text-white" style={{ backgroundColor: colors.primary }}>Explore Collection</Link>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Cart;