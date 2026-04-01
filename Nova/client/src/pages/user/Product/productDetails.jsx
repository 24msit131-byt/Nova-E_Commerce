import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FaStar, FaTruck, FaShieldAlt, FaSync, FaShoppingCart,
    FaBolt, FaChevronRight, FaRegCreditCard, FaStore, FaMinus, FaPlus, FaUserCircle
} from 'react-icons/fa';
import api from '../../../services/api';
import { useCart } from '../../../context/CartContext';
import Footer from '../../../components/Footer';
import { toast } from 'react-toastify';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adding, setAdding] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [visibleReviews, setVisibleReviews] = useState(3);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(true);
    const [relatedError, setRelatedError] = useState('');
    const [addingRelatedId, setAddingRelatedId] = useState(null);

    // Nova Brand Palette
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        pageBg: '#e9e4dc',      // Warm Cream
        cardBg: '#FFFFFF',      // Pure White
        textMain: '#4A4036',    // Dark Brown
        textSecondary: '#756A5E', // Medium Brown
        accent: '#D6C9B5',      // Borders
        highlight: '#B12704'    // Discount Highlight
    };

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                setReviewsLoading(true);
                setRelatedLoading(true);
                setRelatedError('');

                const [productRes, reviewsRes, relatedRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/reviews/${id}`),
                    api.get(`/products/related/${id}`)
                ]);

                setProduct(productRes.data.data);
                setReviews(reviewsRes.data.data);
                setRelatedProducts(relatedRes.data.data);

                setLoading(false);
                setReviewsLoading(false);
                setRelatedLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setRelatedError('Could not load related products.');
                setLoading(false);
                setReviewsLoading(false);
                setRelatedLoading(false);
            }
        };
        fetchProductData();
        window.scrollTo(0, 0); // Scroll to top when product ID changes
    }, [id]);

    const handleLoadMore = () => {
        setVisibleReviews(prev => prev + 5);
    };

    const handleAddToCart = async () => {
        try {
            setAdding(true);
            await addToCart(product._id, quantity);
            toast.success('Added to your sanctuary bag!');
        } catch (err) { toast.error('Failed to add product.'); }
        finally { setAdding(false); }
    };

    const handleBuyNow = async () => {
        await addToCart(product._id, quantity);
        navigate('/checkout');
    };

    const goToProductDetails = (productId) => {
        if (!productId) return;
        navigate(`/product/${productId}`);
    };

    const handleAddRelatedToCart = async (productId) => {
        if (!productId) return;
        try {
            setAddingRelatedId(productId);
            await addToCart(productId, 1);
        } catch (err) {
            toast.error('Failed to add product.');
        } finally {
            setAddingRelatedId(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.pageBg }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: colors.pageBg }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textMain }}>Oops! Sanctuary Interrupted</h2>
            <p className="text-lg opacity-70 mb-8" style={{ color: colors.textSecondary }}>{error}</p>
            <Link to="/products" className="px-8 py-3 rounded-full font-bold text-white transition-all hover:scale-105" style={{ backgroundColor: colors.primary }}>
                Return to Collection
            </Link>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.pageBg }}>
            <p className="text-lg font-medium opacity-60">This selection is currently unavailable in the sanctuary.</p>
        </div>
    );

    return (
        <div className="min-h-screen pt-28 w-full overflow-x-hidden" style={{ backgroundColor: colors.pageBg }}>
            <div className="w-full px-4 md:px-8 pb-20">

                {/* 1. Navigation Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest mb-8 opacity-60" style={{ color: colors.textSecondary }}>
                    <Link to="/" className="hover:underline">Home</Link>
                    <FaChevronRight size={8} />
                    <Link to="/products" className="hover:underline">Collection</Link>
                    <FaChevronRight size={8} />
                    <span style={{ color: colors.textMain }}>{product.category}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* COLUMN 1: Visuals - Full Card Style */}
                    <div className="w-full lg:w-[38%] flex gap-5 sticky top-32">
                        {/* Thumbnails */}
                        <div className="hidden md:flex flex-col gap-4">
                            {product.images?.map((img, index) => (
                                <button
                                    key={index}
                                    onMouseEnter={() => setSelectedImage(index)}
                                    className="h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shadow-sm bg-white"
                                    style={{ borderColor: selectedImage === index ? colors.primary : colors.accent }}
                                >
                                    <img src={img} className="h-full w-full object-cover" alt="thumbnail" />
                                </button>
                            ))}
                        </div>
                        {/* Main Image Box (Full container coverage) */}
                        <div className="flex-1 aspect-[4/5] rounded-[2.5rem] overflow-hidden border bg-white shadow-xl group" style={{ borderColor: colors.accent }}>
                            <img
                                src={product.images?.[selectedImage] || 'https://via.placeholder.com/800'}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                alt={product.name}
                            />
                        </div>
                    </div>

                    {/* COLUMN 2: Curation Details */}
                    <div className="w-full lg:w-[37%] space-y-8">
                        <div className="border-b pb-6" style={{ borderColor: colors.accent }}>
                            <Link to="#" className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:underline" style={{ color: colors.primary }}>
                                <FaStore /> Visit the {product.brand} Store
                            </Link>
                            <h1 className="text-4xl font-bold tracking-tight leading-tight mt-3" style={{ color: colors.textMain }}>
                                {product.name}
                            </h1>
                            <div className="flex items-center mt-4 gap-6">
                                <div className="flex items-center text-sm font-bold" style={{ color: colors.primary }}>
                                    {product.rating} <FaStar className="ml-1" />
                                </div>
                                <span className="text-[12px] font-medium underline cursor-pointer" style={{ color: colors.textSecondary }}>
                                    {product.reviews} Verified Ratings
                                </span>
                            </div>
                        </div>

                        {/* Pricing Highlight */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">

                                <span className="text-4xl font-bold" style={{ color: colors.textMain }}>₹{product.price}</span>
                            </div>

                            <p className="text-[11px] font-bold opacity-60 uppercase tracking-widest" style={{ color: colors.textSecondary }}>Inclusive of all fulfillment taxes</p>
                        </div>

                        {/* Offers */}
                        <div className="border rounded-[2rem] p-6 space-y-5 bg-white shadow-sm" style={{ borderColor: colors.accent }}>
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: colors.textMain }}>
                                <FaRegCreditCard style={{ color: colors.primary }} /> Boutique Offers
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-2xl bg-slate-50 space-y-1" style={{ borderColor: colors.accent }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.primary }}>Bank Privilege</p>
                                    <p className="text-[11px] font-medium leading-tight">Upto 25% credit adjustment</p>
                                </div>
                                <div className="p-4 border rounded-2xl bg-slate-50 space-y-1" style={{ borderColor: colors.accent }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.primary }}>Nova Partner</p>
                                    <p className="text-[11px] font-medium leading-tight">18% GST savings for business</p>
                                </div>
                            </div>
                        </div>

                        {/* Technical Attributes Table */}
                        <div className="grid grid-cols-2 gap-y-4 text-xs pt-4 border-t" style={{ borderColor: colors.accent }}>
                            <div className="font-bold opacity-60 uppercase">Brand</div>
                            <div className="font-bold">{product.brand}</div>
                            <div className="font-bold opacity-60 uppercase">Space</div>
                            <div className="font-bold">{product.category}</div>
                            <div className="font-bold opacity-60 uppercase">Composition</div>
                            <div className="font-bold">Plant-Based Formula</div>
                        </div>

                        {/* Narrative Bullets */}
                        <div className="border-t pt-8" style={{ borderColor: colors.accent }}>
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: colors.textMain }}>About this selection</h3>
                            <ul className="space-y-5 list-disc pl-5 text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                                {product.description.split('.').filter(s => s.trim()).map((s, i) => (
                                    <li key={i} className="pl-2 font-medium">{s.trim()}.</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* COLUMN 3: The Sanctuary Buy Box */}
                    <div className="w-full lg:w-[25%] sticky top-32">
                        <div
                            className="rounded-[2.5rem] border p-8 space-y-8 shadow-2xl bg-white"
                            style={{ borderColor: colors.accent }}
                        >
                            <div className="space-y-1">
                                <span className="text-4xl font-bold" style={{ color: colors.textMain }}>₹{product.price * quantity}</span>
                                <p className="text-sm font-bold mt-2" style={{ color: '#007600' }}>Ready for Dispatch</p>
                            </div>

                            <div className="space-y-5 text-[13px]" style={{ color: colors.textSecondary }}>
                                <div className="flex items-start gap-4">
                                    <FaTruck className="mt-1" style={{ color: colors.primary }} />
                                    <p>Complimentary delivery <span className="font-bold text-slate-900">Monday, March 9</span>.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <FaShieldAlt style={{ color: colors.primary }} />
                                    <p>Secure fulfillment by <span className="font-black italic">Nova.</span></p>
                                </div>
                            </div>

                            {/* Tactile Quantity Selector */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Adjust Quantity</label>
                                <div
                                    className="flex items-center justify-between border-2 rounded-2xl p-1.5 shadow-inner transition-all bg-slate-50"
                                    style={{ borderColor: colors.accent }}
                                >
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="p-3.5 rounded-xl hover:bg-white active:scale-90 transition-all flex items-center justify-center shadow-sm"
                                        style={{ color: colors.primary }}
                                    >
                                        <FaMinus size={10} />
                                    </button>
                                    <span className="text-xl font-black px-4" style={{ color: colors.textMain }}>{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="p-3.5 rounded-xl hover:bg-white active:scale-90 transition-all flex items-center justify-center shadow-sm"
                                        style={{ color: colors.primary }}
                                    >
                                        <FaPlus size={10} />
                                    </button>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-4 pt-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={adding}
                                    className="w-full py-4.5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 text-white"
                                    style={{
                                        backgroundColor: colors.primary,
                                        boxShadow: `0 10px 20px rgba(166, 138, 100, 0.2)`
                                    }}
                                >
                                    {adding ? 'Securing...' : 'Add to Bag'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    className="w-full py-4.5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 text-white"
                                    style={{ backgroundColor: colors.textMain }}
                                >
                                    Direct Purchase
                                </button>
                            </div>

                            <div className="pt-8 border-t flex flex-col gap-5 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50" style={{ borderColor: colors.accent }}>
                                <div className="flex items-center gap-4 hover:opacity-100 transition-opacity cursor-pointer">
                                    <FaSync /> Pure Exchange Policy
                                </div>
                                <div className="flex items-center gap-4 hover:opacity-100 transition-opacity cursor-pointer">
                                    <FaShieldAlt /> Heritage Warranty
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Customer Reviews Section */}
                <div className="mt-20 pt-16 border-t" style={{ borderColor: colors.accent }}>
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Summary Column - Kept exactly as your rating good feedback */}
                        <div className="w-full lg:w-[30%] space-y-6">
                            <h2 className="text-2xl font-bold" style={{ color: colors.textMain }}>Customer Rating</h2>
                            <div className="flex items-center gap-3">
                                <div className="flex text-lg" style={{ color: colors.primary }}>
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < Math.round(product.rating) ? "fill-current" : "opacity-30"} />
                                    ))}
                                </div>
                                <span className="text-lg font-bold" style={{ color: colors.textMain }}>{product.rating} out of 5</span>
                            </div>
                            <p className="text-sm opacity-70" style={{ color: colors.textSecondary }}>
                                {reviews.length} global ratings
                            </p>

                            {/* Simple Rating Breakdown */}
                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = reviews.filter(r => r.rating === star).length;
                                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-4 text-sm">
                                            <span className="w-12 hover:underline cursor-pointer">{star} star</span>
                                            <div className="flex-1 h-5 bg-white rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                                <div
                                                    className="h-full rounded-lg transition-all duration-1000"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: colors.primary,
                                                        boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </div>
                                            <span className="w-8 text-right opacity-60 font-medium">{Math.round(percentage)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reviews List - Updated UI with "Show More" functionality */}
                        <div className="flex-1 space-y-8">
                            <h3 className="text-xl font-bold border-b pb-4" style={{ color: colors.textMain, borderColor: colors.accent }}>
                                Honest Customer Reviews
                            </h3>

                            {reviewsLoading ? (
                                <div className="space-y-8 animate-pulse">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-32 bg-white/50 rounded-3xl"></div>
                                    ))}
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="py-12 text-center rounded-[2rem] border-2 border-dashed bg-white/50" style={{ borderColor: colors.accent }}>
                                    <p className="text-lg font-medium italic opacity-60">This selection hasn't been narrated yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Only slice the first N reviews based on visibleReviews state */}
                                    {reviews.slice(0, visibleReviews).map((review) => (
                                        <div
                                            key={review._id}
                                            className="p-8 rounded-[2rem] bg-white/40 border border-transparent hover:border-[#A68A64] hover:bg-white transition-all duration-500 group shadow-sm hover:shadow-md"
                                            style={{ borderColor: 'rgba(166, 138, 100, 0.1)' }}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0">
                                                        {review.user?.avatar ? (
                                                            <img src={review.user.avatar} className="w-12 h-12 rounded-full object-cover border-2 shadow-sm" style={{ borderColor: colors.accent }} alt="" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border shadow-sm" style={{ borderColor: colors.accent }}>
                                                                <FaUserCircle className="text-2xl opacity-20" style={{ color: colors.textMain }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-sm tracking-wide block" style={{ color: colors.textMain }}>
                                                            {review.user?.fullName || 'Anonymous Collector'}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex text-[10px]" style={{ color: colors.primary }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <FaStar key={i} className={i < review.rating ? "fill-current" : "opacity-30"} />
                                                                ))}
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-100 text-green-800 opacity-80">
                                                                Verified
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                                                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-[15px] leading-relaxed font-medium italic" style={{ color: colors.textMain }}>
                                                    "{review.comment}"
                                                </p>
                                            </div>

                                            <div className="flex gap-6 mt-6 pt-4 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-black transition-colors" style={{ color: colors.textSecondary }}>
                                                    Helpful
                                                </button>
                                                <button className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity" style={{ color: colors.textSecondary }}>
                                                    Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Show More Button - Only appears if there are more reviews to show */}
                                    {visibleReviews < reviews.length && (
                                        <div className="pt-8 flex justify-center">
                                            <button
                                                onClick={() => setVisibleReviews(prev => prev + 5)}
                                                className="px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-white active:scale-95 shadow-lg border-2 text-white hover:text-[#4A4036]"
                                                style={{
                                                    backgroundColor: colors.primary,
                                                    borderColor: colors.primary,
                                                    boxShadow: `0 10px 20px rgba(166, 138, 100, 0.2)`
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = colors.primary;
                                                }}
                                            >
                                                Show More Customer Reviews
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
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
            
            <Footer />
        </div>
    );
};

export default ProductDetails;