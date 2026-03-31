import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaFilter, FaSearch, FaStar, FaChevronDown, FaThLarge, FaList, FaBoxOpen, FaRupeeSign } from 'react-icons/fa';
import { HiOutlineShoppingBag } from 'react-icons/hi2';
import api from '../../../services/api';
import { useCart } from '../../../context/CartContext.jsx';
import Footer from '../../../components/Footer';

const Products = () => {
    const { addToCart } = useCart();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [selectedRating, setSelectedRating] = useState(0);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Nova Theme Colors
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        secondary: '#FAF7F2',   // Warm Cream
        bgSection: '#F2EBDD',   // Slightly deeper beige
        textMain: '#4A4036',    // Dark Brown
        textSecondary: '#756A5E', // Medium Brown
        accent: '#E0D8CC',      // Light Beige
        deepBg: '#2C2621'       // Deep Grounded Brown
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/products');
                setProducts(data.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        setSearchQuery(searchParams.get("search") || "");
    }, [searchParams]);

    const handleCategoryChange = (cat) => {
        const categoryValue = cat.toLowerCase().replace(' care', '');
        if (selectedCategories.includes(categoryValue)) {
            setSelectedCategories(selectedCategories.filter(c => c !== categoryValue));
        } else {
            setSelectedCategories([...selectedCategories, categoryValue]);
        }
    };

    const handlePriceChange = (rangeValue) => {
        setSelectedPriceRange(rangeValue);
    };

    const handleRatingChange = (rating) => {
        setSelectedRating((prev) => (prev === rating ? 0 : rating));
    };

    const handleStockFilter = (checked) => {
        setInStockOnly(checked);
    };

    const resetAllFilters = () => {
        setSelectedCategories([]);
        setSelectedPriceRange('');
        setSelectedRating(0);
        setInStockOnly(false);
    };

    const hasActiveFilters = Boolean(selectedPriceRange || selectedRating || inStockOnly);
    const activeFilterCount = selectedCategories.length + (selectedPriceRange ? 1 : 0) + (selectedRating ? 1 : 0) + (inStockOnly ? 1 : 0);

    const filteredProducts = products.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase()) || category.includes(searchQuery.toLowerCase());

        const productCat = category.replace(' care', '').trim();
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(productCat);

        const price = Number(product.price) || 0;
        let matchesPrice = true;
        if (selectedPriceRange === '0-99') {
            matchesPrice = price <= 99;
        } else if (selectedPriceRange === '100-199') {
            matchesPrice = price >= 100 && price <= 199;
        } else if (selectedPriceRange === '200-499') {
            matchesPrice = price >= 200 && price <= 499;
        } else if (selectedPriceRange === '500-above') {
            matchesPrice = price >= 500;
        }

        const rating = Number(product.rating) || 0;
        const matchesRating = selectedRating === 0 || rating >= selectedRating;

        const stockValue = Number(product.stock ?? product.quantity ?? 0);
        const matchesStock = !inStockOnly || stockValue > 0;

        return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesStock;
    });

    return (
        <div className="flex flex-col min-h-screen w-full" style={{ backgroundColor: colors.secondary }}>
            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(-12deg); }
                        50% { transform: translateY(-15px) rotate(-8deg); }
                    }
                    .animate-float-custom {
                        animation: float 4s ease-in-out infinite;
                    }
                    input[type='range']::-webkit-slider-thumb {
                        background: ${colors.primary};
                        cursor: pointer;
                    }
                `}
            </style>

            {/* Main Content Area - flex-grow ensures this pushes the footer down */}
            <div className="flex-grow pt-24 pb-20 overflow-x-hidden">
                
                {/* 1. Impactful Header */}
                <div className="w-full px-6 md:px-10 py-20 mb-12 relative overflow-hidden" style={{ backgroundColor: colors.deepBg }}>
                    <div className="absolute top-0 right-0 w-96 h-96 opacity-10 blur-3xl rounded-full" style={{ backgroundColor: colors.primary }}></div>
                    <div className="relative z-10">
                        <h1 className="text-5xl font-black tracking-tighter uppercase text-white">The Collection</h1>
                        <p className="mt-4 text-sm font-medium uppercase tracking-[0.3em]" style={{ color: colors.accent }}>
                            Pure essentials for the curated home
                        </p>
                    </div>
                </div>

                <div className="w-full px-6 md:px-10">

                    <button
                        type="button"
                        onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                        className="inline-flex items-center justify-center gap-2 self-start px-5 py-3 rounded-xl border-2 border-[#E0D8CC] bg-white text-[11px] font-black uppercase tracking-[0.16em] mb-8"
                        style={{ color: colors.textMain }}
                    >
                        <FaFilter style={{ color: colors.primary }} />
                        {isFilterPanelOpen ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    {isFilterPanelOpen && (
                        <div
                            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                            onClick={() => setIsFilterPanelOpen(false)}
                        />
                    )}

                    <div className="flex flex-col lg:flex-row gap-10">

                    {/* 2. SIDEBAR FILTERS */}
                    <aside className={`${isFilterPanelOpen ? 'block' : 'hidden'} w-full lg:w-64 flex-shrink-0 fixed top-0 left-0 z-50 h-full w-[88%] max-w-[360px] bg-[#FAF7F2] p-6 overflow-y-auto transition-transform duration-300 translate-x-0 lg:static lg:z-auto lg:h-auto lg:max-w-none lg:bg-transparent lg:p-0 lg:overflow-visible`}>
    <div className="flex items-center justify-between mb-8 lg:hidden">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textMain }}>Filters</h3>
        <button
            type="button"
            onClick={() => setIsFilterPanelOpen(false)}
            className="w-9 h-9 rounded-full border border-[#E0D8CC] text-lg"
            style={{ color: colors.textMain }}
            aria-label="Close filters"
        >
            ×
        </button>
    </div>
    <div className="lg:sticky lg:top-32 space-y-12">
        
        {/* 1. FILTER BY SPACE (Existing) */}
        <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center" style={{ color: colors.textMain }}>
                <FaFilter className="mr-3" style={{ color: colors.primary }} /> Filter by Space
            </h3>
            <div className="space-y-4">
                {['Kitchen', 'Floor', 'Windows', 'Bathroom'].map((cat) => (
                    <label key={cat} className="flex items-center group cursor-pointer">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-2 transition-all cursor-pointer appearance-none checked:bg-[#A68A64]"
                                style={{ borderColor: colors.accent }}
                                checked={selectedCategories.includes(cat.toLowerCase())}
                                onChange={() => handleCategoryChange(cat)}
                            />
                            {selectedCategories.includes(cat.toLowerCase()) && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white text-[10px]">✓</div>
                            )}
                        </div>
                        <span className={`ml-4 text-[13px] font-bold uppercase tracking-wider transition-colors ${selectedCategories.includes(cat.toLowerCase()) ? 'text-[#A68A64]' : 'text-[#756A5E] group-hover:text-[#4A4036]'}`}>
                            {cat} Care
                        </span>
                    </label>
                ))}
            </div>
        </div>

        {/* 2. FILTER BY PRICE (Amazon Style Range) */}
        <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center" style={{ color: colors.textMain }}>
                <FaRupeeSign className="mr-3" style={{ color: colors.primary }} /> Price Range
            </h3>
            <div className="space-y-4">
                {[
                    { label: 'Under ₹99', value: '0-99' },
                    { label: '₹100 - ₹199', value: '100-199' },
                    { label: '₹200 - ₹499', value: '200-499' },
                    { label: 'Over ₹500', value: '500-above' }
                ].map((range) => (
                    <label key={range.value} className="flex items-center group cursor-pointer">
                        <input 
                            type="radio" 
                            name="priceRange"
                            className="w-4 h-4 accent-[#A68A64] cursor-pointer"
                            checked={selectedPriceRange === range.value}
                            onChange={() => handlePriceChange(range.value)}
                        />
                        <span className="ml-4 text-[13px] font-medium text-[#756A5E] group-hover:text-[#4A4036] transition-colors">
                            {range.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>

        {/* 3. CUSTOMER RATINGS (Star Filter) */}
        <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center" style={{ color: colors.textMain }}>
                <FaStar className="mr-3" style={{ color: colors.primary }} /> Avg. Rating
            </h3>
            <div className="space-y-3">
                {[4, 3, 2].map((star) => (
                    <label key={star} className="flex items-center group cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded accent-[#A68A64] cursor-pointer"
                            checked={selectedRating === star}
                            onChange={() => handleRatingChange(star)}
                        />
                        <div className="ml-3 flex text-[#A68A64] text-xs space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={i < star ? "fill-current" : "text-[#E0D8CC]"} />
                            ))}
                        </div>
                        <span className="ml-3 text-[12px] font-bold text-[#756A5E] group-hover:text-[#4A4036]">
                            & Up
                        </span>
                    </label>
                ))}
            </div>
        </div>

        {/* 4. AVAILABILITY */}
        <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]  flex items-center" style={{ color: colors.textMain }}>
                <FaBoxOpen className="mr-3" style={{ color: colors.primary }} /> Availability
            </h3>
            <label className="flex items-center cursor-pointer group">
                <div className="relative inline-flex items-center cursor-pointer mt-5">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={inStockOnly}
                        onChange={(e) => handleStockFilter(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#E0D8CC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A68A64]"></div>
                    <span className="ml-4 text-[13px] font-bold uppercase tracking-wider text-[#756A5E] group-hover:text-[#4A4036]">
                        In Stock Only
                    </span>
                </div>
            </label>
        </div>

        {/* GLOBAL RESET */}
        {(selectedCategories.length > 0 || hasActiveFilters) && (
            <button
                onClick={resetAllFilters}
                className="w-full px-5 py-4 border-2 border-[#E0D8CC] rounded-2xl bg-white hover:bg-[#4A4036] hover:text-white hover:border-[#4A4036] transition-all duration-300 group mt-0"
                style={{ color: colors.textMain }}
            >
                <span className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.16em]">Clear All Filters</span>
                    <span className="h-6 min-w-6 px-2 rounded-full bg-[#F2EBDD] group-hover:bg-white/20 text-xs font-black flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                </span>
            </button>
        )}
    </div>
</aside>

                    {/* 3. PRODUCT GRID */}
                    <main className="flex-1">
                        <div className="flex justify-between items-center mb-12 pb-6 border-b" style={{ borderColor: colors.accent }}>
                            <p className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: colors.textSecondary }}>
                                Showing {filteredProducts.length} Artisan Products
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center py-32">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: colors.primary }}></div>
                                <p className="mt-6 text-sm uppercase tracking-widest font-bold opacity-60" style={{ color: colors.textSecondary }}>Curating Selection...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-24 rounded-[3rem]" style={{ backgroundColor: colors.accent }}>
                                <h3 className="text-xl font-bold uppercase tracking-tighter">Connection Interrupted</h3>
                                <p className="mt-2 text-sm opacity-70">{error}</p>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFilterPanelOpen ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-8`}> 
                                {filteredProducts.map((item) => (
                                    <div key={item._id} className="group bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-[#E0D8CC]/30">
                                        {/* Image Section */}
                                        <Link to={`/product/${item._id}`} className="relative aspect-[4/4] overflow-hidden block">
                                            <img
                                                src={item.images[0]}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </Link>

                                        {/* Content Section */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#A68A64]/60">
                                                    {item.category || "Surface"}
                                                </span>
                                                <div className="bg-[#F2EBDD]/50 px-4 py-1 rounded-full flex items-center gap-1">
                                                    <FaStar className="text-[#A68A64] text-[10px]" />
                                                    <span className="text-[10px] font-bold text-[#4A4036]">{item.rating || "0"}</span>
                                                </div>
                                            </div>

                                            <Link to={`/product/${item._id}`}>
                                                <h4 className="text-[#4A4036] font-bold text-xl mb-1 line-clamp-1">{item.name}</h4>
                                            </Link>

                                            <p className="text-[#756A5E] text-xs leading-relaxed line-clamp-2 opacity-60 mb-4">
                                                {item.description || "Artisanally crafted with pure ingredients for a curated and minimalist home experience."}
                                            </p>

                                            <div className="flex justify-between items-center mt-auto">
                                                <p className="text-[#4A4036] font-black text-xl">₹{item.price}</p>
                                                <button
                                                    onClick={() => addToCart(item._id)}
                                                    className="w-12 h-12 bg-[#FAF7F2] text-[#4A4036] rounded-full flex items-center justify-center hover:bg-[#4A4036] hover:text-white transition-all duration-300 shadow-sm border border-[#E0D8CC]/30"
                                                >
                                                    <HiOutlineShoppingBag size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 rounded-[4rem]" style={{ backgroundColor: colors.bgSection }}>
                                <FaSearch className="mx-auto text-4xl mb-6 opacity-10" style={{ color: colors.textMain }} />
                                <h3 className="text-2xl font-bold uppercase tracking-tighter">No items found</h3>
                                <p className="mt-3 text-sm opacity-60">Adjust your curation filters to explore more.</p>
                            </div>
                        )}
                    </main>
                </div>
                </div>
            </div>

            {/* Footer Section - Outside of the flex-grow div */}
            <Footer />
        </div>
    );
};

export default Products;



/***************************/
/* upper code is not working, so I have commented it out and added a new code below. Please use the new code for the product page. */
/**************************/

/*import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaFilter, FaSearch, FaStar, FaChevronDown, FaThLarge, FaList } from 'react-icons/fa';
import api from '../../../services/api';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/products');
                setProducts(data.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Update local state when URL params change
    useEffect(() => {
        setSearchQuery(searchParams.get("search") || "");
    }, [searchParams]);

    // Handle Category Filter
    const handleCategoryChange = (cat) => {
        const categoryValue = cat.toLowerCase().replace(' care', '');
        if (selectedCategories.includes(categoryValue)) {
            setSelectedCategories(selectedCategories.filter(c => c !== categoryValue));
        } else {
            setSelectedCategories([...selectedCategories, categoryValue]);
        }
    };

    // Filter products logic
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase());

        const productCat = product.category.toLowerCase().replace(' care', '');
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(productCat);

        return matchesSearch && matchesCategory;
    });

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        // Also update URL for consistency
        if (val) {
            setSearchParams({ search: val });
        } else {
            setSearchParams({});
        }
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-20 w-full overflow-x-hidden">

            {/* 1. Sophisticated Header & Search *//*}
 
<div className="w-full bg-slate-900 px-6 md:px-12 lg:px-20 py-16 text-white mb-10 relative">
<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
<div>
<h1 className="text-4xl font-bold tracking-tighter">Explore Collection</h1>
<p className="text-slate-400 mt-2 text-sm font-medium">Find the perfect cleaning solutions for your premium lifestyle.</p>
</div>

{/* Modern Search Bar *//*}
<div className="relative w-full md:w-[400px] group">
<FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
<input
type="text"
placeholder="Search products..."
className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all"
value={searchQuery}
onChange={handleSearchInput}
/>
</div>
</div>
</div>

<div className="w-full px-6 md:px-12 lg:px-20 flex flex-col lg:flex-row gap-12">

{/* 2. SIDEBAR FILTERS (Left) *//*}
<aside className="w-full lg:w-64 flex-shrink-0">
    <div className="sticky top-32 space-y-10">
        <div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center">
                <FaFilter className="mr-2 text-indigo-600" /> Filter By Category
            </h3>
            <div className="space-y-3">
                {['Kitchen', 'Floor', 'Windows', 'Bathroom'].map((cat) => (
                    <label key={cat} className="flex items-center group cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                            checked={selectedCategories.includes(cat.toLowerCase())}
                            onChange={() => handleCategoryChange(cat)}
                        />
                        <span className={`ml-3 text-[13px] font-bold transition-colors ${selectedCategories.includes(cat.toLowerCase()) ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-900'}`}>{cat} Care</span>
                    </label>
                ))}
                {selectedCategories.length > 0 && (
                    <button
                        onClick={() => setSelectedCategories([])}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-4 hover:text-slate-900 transition-colors"
                    >
                        × Clear Filters
                    </button>
                )}
            </div>
        </div>

        <div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Price Range</h3>
            <input type="range" className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
            <div className="flex justify-between mt-4 text-[11px] font-bold text-slate-400">
                <span>₹0</span>
                <span>₹5000+</span>
            </div>
        </div>

        <div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Customer Rating</h3>
            {[4, 3, 2].map((star) => (
                <button key={star} className="flex items-center space-x-2 text-[12px] font-bold text-slate-500 hover:text-indigo-600 transition-all mb-2">
                    <div className="flex text-yellow-400">
                        {[...Array(star)].map((_, i) => <FaStar key={i} />)}
                    </div>
                    <span>& Up</span>
                </button>
            ))}
        </div>
    </div>
</aside>

{/* 3. PRODUCT GRID (Right) *//*}
<main className="flex-1">
    {/* Toolbar *//*}
<div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
<p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredProducts.length} Products</p>
<div className="flex items-center space-x-6">
<div className="flex items-center text-slate-400 space-x-3 border-r border-slate-100 pr-6">
<FaThLarge className="text-slate-900 cursor-pointer" />
<FaList className="hover:text-slate-900 cursor-pointer transition-colors" />
</div>
<div className="flex items-center space-x-2 cursor-pointer group">
<span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Sort By</span>
<FaChevronDown className="text-[8px] group-hover:translate-y-1 transition-transform" />
</div>
</div>
</div>

{/* The Grid *//*}
{loading ? (
    <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading premium products...</p>
    </div>
) : error ? (
    <div className="text-center py-20 bg-red-50 rounded-[3rem]">
        <h3 className="text-xl font-bold text-red-600">Error loading products</h3>
        <p className="text-red-400 mt-2">{error}</p>
    </div>
) : filteredProducts.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-16">
        {filteredProducts.map((item) => (
            <Link to={`/product/${item._id}`} key={item._id} className="group block">
                <div className="relative aspect-[4/5] bg-slate-50 rounded-[2rem] overflow-hidden mb-6 border border-transparent group-hover:border-slate-100 transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-slate-100">
                    <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=500'}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={item.name}
                    />
                    <div className="absolute top-6 left-6">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                            {item.category}
                        </span>
                    </div>
                </div>

                <div className="px-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{item.name}</h3>
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-lg font-black text-slate-900">₹{item.price}</p>
                        <div className="flex items-center space-x-1">
                            <FaStar className="text-yellow-400 text-[10px]" />
                            <span className="text-[11px] font-bold text-slate-400">{item.rating}</span>
                        </div>
                    </div>
                </div>
            </Link>
        ))}
    </div>
) : (
    <div className="text-center py-20 bg-slate-50 rounded-[3rem]">
        <FaSearch className="mx-auto text-4xl text-slate-200 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">No products found</h3>
        <p className="text-slate-400 mt-2">Try searching for something else or check your spelling.</p>
        <button
            onClick={() => setSearchParams({})}
            className="mt-8 px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-slate-900 transition-all"
        >
            Clear Search
        </button>
    </div>
)}

{/* Pagination Placeholder *//*}
<div className="mt-20 flex justify-center">
    <button className="px-12 py-4 border-2 border-slate-900 text-slate-900 text-xs font-black uppercase tracking-widest rounded-full hover:bg-slate-900 hover:text-white transition-all duration-300 active:scale-95">
        Load More Products
    </button>
</div>
</main>
</div>
</div>
);
};

export default Products;

*/