import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineUser, HiChevronDown } from 'react-icons/hi2';
import { HiOutlineSearch, HiOutlineLogout, HiOutlineViewGrid } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import api from '../services/api.js';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [searchProducts, setSearchProducts] = useState([]);
    const { user, logout } = useContext(AuthContext);
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setUserMenuOpen(false);
    }, [location]);

    useEffect(() => {
        let isMounted = true;

        const fetchSearchProducts = async () => {
            try {
                const response = await api.get('/products');
                if (isMounted) {
                    setSearchProducts(response.data?.data || []);
                }
            } catch (error) {
                console.error('Navbar search load error:', error?.response?.data || error.message);
            }
        };

        fetchSearchProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!showSearch || !query) {
            setSearchSuggestions([]);
            return;
        }

        const matchedProducts = searchProducts
            .filter((product) => {
                const name = String(product.name || '').toLowerCase();
                const category = String(product.category || '').toLowerCase();
                const description = String(product.description || '').toLowerCase();

                return (
                    name.includes(query) ||
                    category.includes(query) ||
                    description.includes(query)
                );
            })
            .slice(0, 5);

        setSearchSuggestions(matchedProducts);
    }, [showSearch, searchTerm, searchProducts]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
            setShowSearch(false);
            setSearchTerm('');
            setSearchSuggestions([]);
        }
    };

    const handleSuggestionClick = (productId) => {
        setShowSearch(false);
        setSearchTerm('');
        setSearchSuggestions([]);
        navigate(`/product/${productId}`);
    };

    // Theme Color Constants
    const colors = {
        primary: '#A68A64',
        secondary: '#FAF7F2',
        accent: '#E0D8CC',
        textMain: '#4A4036',
        textSecondary: '#756A5E',
        neutralLight: '#F5F5F5'
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled
            ? 'py-3 bg-[#FAF7F2]/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(74,64,54,0.05)]'
            : 'py-5 bg-[#FAF7F2]/80 backdrop-blur-md'
            }`}>
            <div className="w-full px-8">
                <div className="flex justify-between items-center">

                    {/* --- Brand Logo (Nova) --- */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="relative h-10 w-10 flex items-center justify-center">
                            <div
                                className="absolute inset-0 rounded-xl rotate-6 group-hover:rotate-0 transition-transform duration-500"
                                style={{ backgroundColor: colors.primary }}
                            ></div>
                            <span className="relative text-white font-serif italic text-xl">N</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight uppercase" style={{ color: colors.textMain }}>
                            Nov<span style={{ color: colors.primary }}>a</span>
                        </span>
                    </Link>

                    {/* --- Desktop Navigation --- */}
                    <div className="hidden lg:flex items-center space-x-10">
                        {['Home', 'Products', 'About', 'Contact'].map((item) => {
                            let path = '/';
                            if (item === 'Home') path = '/';
                            else if (item === 'Products') path = '/products';
                            else if (item === 'About') path = '/aboutus';
                            else if (item === 'Contact') path = '/contactus';

                            const isActive = path === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(path);

                            return (
                                <Link
                                    key={item}
                                    to={path}
                                    className="text-[13px] uppercase tracking-[0.1em] font-semibold transition-colors relative group"
                                    style={{
                                        color: isActive ? colors.primary : colors.textSecondary,
                                        '--hover-primary': colors.primary
                                    }}
                                >
                                    <span className="group-hover:text-[var(--hover-primary)] transition-colors">
                                        {item}
                                    </span>
                                    <span
                                        className={`absolute -bottom-1 left-0 h-0.5 transition-all group-hover:w-full ${isActive ? 'w-full' : 'w-0'}`}
                                        style={{ backgroundColor: colors.primary }}
                                    ></span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* --- Actions Section --- */}
                    <div className="hidden lg:flex items-center space-x-5">
                        <div className="relative flex items-center">
                            <AnimatePresence>
                                {showSearch && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 240, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        className="relative overflow-visible mr-2"
                                    >
                                        <form onSubmit={handleSearchSubmit} className="relative">
                                            <input
                                                type="text"
                                                placeholder="Pure home products..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full border rounded-full py-1.5 px-4 text-sm outline-none transition-all font-medium"
                                                style={{
                                                    backgroundColor: colors.neutralLight,
                                                    borderColor: colors.accent,
                                                    color: colors.textMain
                                                }}
                                                autoFocus
                                            />
                                        </form>

                                        <AnimatePresence>
                                            {searchTerm.trim() && searchSuggestions.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    className="absolute left-0 top-full mt-3 w-[320px] max-h-96 overflow-y-auto rounded-3xl border bg-white shadow-2xl z-50"
                                                    style={{ borderColor: colors.accent }}
                                                >
                                                    <div className="px-4 py-3 border-b" style={{ borderColor: colors.neutralLight }}>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                                                            Live Suggestions
                                                        </p>
                                                    </div>

                                                    <div className="p-2">
                                                        {searchSuggestions.map((product) => (
                                                            <button
                                                                key={product._id}
                                                                type="button"
                                                                onClick={() => handleSuggestionClick(product._id)}
                                                                className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-[#F5F5F5]"
                                                            >
                                                                <div className="h-12 w-12 rounded-2xl overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                                                                    <img
                                                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=500'}
                                                                        alt={product.name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-bold truncate" style={{ color: colors.textMain }}>
                                                                        {product.name}
                                                                    </p>
                                                                    <p className="text-[11px] uppercase tracking-[0.16em] truncate" style={{ color: colors.textSecondary }}>
                                                                        {product.category || 'Product'}
                                                                    </p>
                                                                </div>
                                                                <span className="text-sm font-black" style={{ color: colors.primary }}>
                                                                    ₹{product.price}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="p-2.5 rounded-full transition-all duration-300"
                                style={{
                                    backgroundColor: showSearch ? colors.accent : 'transparent',
                                    color: colors.textMain
                                }}
                            >
                                <HiOutlineSearch className="text-xl" />
                            </button>
                        </div>

                        <Link
                            to="/cart"
                            className="relative p-2.5 rounded-full transition-colors group"
                            style={{ color: colors.textMain }}
                        >
                            <HiOutlineShoppingBag className="text-xl group-hover:scale-110 transition-transform" />
                            {cartCount > 0 && (
                                <span
                                    className="absolute top-1 right-1 h-5 w-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2"
                                    style={{ backgroundColor: colors.primary, ringColor: colors.secondary }}
                                >
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <div className="h-6 w-px mx-1" style={{ backgroundColor: colors.accent }}></div>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 p-1 pr-3 border rounded-full hover:shadow-sm transition-all"
                                    style={{ backgroundColor: colors.neutralLight, borderColor: colors.accent }}
                                >
                                    <div
                                        className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                        {user.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: colors.textMain }}>
                                        {user.fullName?.split(' ')[0]}
                                    </span>
                                    <HiChevronDown className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} style={{ color: colors.textSecondary }} />
                                </button>

                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl border p-2 z-50 bg-white"
                                            style={{ borderColor: colors.accent }}
                                        >
                                            <div className="px-4 py-3 border-b mb-1" style={{ borderBottomColor: colors.neutralLight }}>
                                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Account</p>
                                                <p className="text-sm font-bold truncate" style={{ color: colors.textMain }}>{user.email}</p>
                                            </div>
                                            <Link to="/profile" className="flex items-center space-x-3 px-4 py-3 text-sm rounded-xl transition-colors hover:bg-[#F5F5F5]">
                                                <HiOutlineUser className="text-lg" style={{ color: colors.primary }} />
                                                <span style={{ color: colors.textMain }}>My Profile</span>
                                            </Link>
                                            {user.role === 'admin' && (
                                                <Link to="/admin/dashboard" className="flex items-center space-x-3 px-4 py-3 text-sm rounded-xl transition-colors hover:bg-[#F5F5F5]">
                                                    <HiOutlineViewGrid className="text-lg" style={{ color: colors.primary }} />
                                                    <span style={{ color: colors.textMain }}>Admin Dashboard</span>
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                                            >
                                                <HiOutlineLogout className="text-lg" />
                                                <span>Sign Out</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-5">
                                <Link to="/login" className="text-[13px] font-bold uppercase tracking-wider" style={{ color: colors.textMain }}>Log in</Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-2.5 text-white text-[13px] font-bold rounded-full shadow-lg active:scale-95 transition-all uppercase tracking-wider"
                                    style={{ backgroundColor: colors.primary, boxShadow: `0 10px 20px rgba(166, 138, 100, 0.2)` }}
                                >
                                    Join Nova
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* --- Mobile Menu Trigger --- */}
                    <div className="lg:hidden flex items-center space-x-3">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-xl transition-colors"
                            style={{ backgroundColor: colors.accent, color: colors.textMain }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Mobile Menu Drawer --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="lg:hidden border-t overflow-hidden bg-[#FAF7F2]"
                        style={{ borderTopColor: colors.accent }}
                    >
                        <div className="px-8 py-10 space-y-6">
                            {['Home', 'Products', 'About', 'Contact'].map((item) => {
                                let path = '/';
                                if (item === 'Home') path = '/';
                                else if (item === 'About') path = '/aboutus';
                                else if (item === 'Contact') path = '/contactus';
                                else path = `/${item.toLowerCase()}`;

                                return (
                                    <Link key={item} to={path} className="block text-3xl font-bold transition-colors" style={{ color: colors.textMain }}>
                                        {item}
                                    </Link>
                                );
                            })}
                            <div className="pt-8 flex flex-col space-y-4">
                                {!user ? (
                                    <>
                                        <Link to="/login" className="w-full py-4 text-center font-bold border rounded-2xl" style={{ borderColor: colors.accent, color: colors.textMain }}>Log in</Link>
                                        <Link to="/register" className="w-full py-4 text-center font-bold text-white rounded-2xl" style={{ backgroundColor: colors.primary }}>Create Account</Link>
                                    </>
                                ) : (
                                    <Link to="/profile" className="w-full py-4 text-center font-bold text-white rounded-2xl" style={{ backgroundColor: colors.primary }}>My Account</Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;