import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { HiOutlineShoppingBag, HiOutlineHeart } from 'react-icons/hi2';
import { useCart } from '../../../context/CartContext.jsx';
import { AuthContext } from '../../../context/AuthContext.jsx';
import api from '../../../services/api.js';
import { toast } from 'react-toastify';

const FeaturedCollection = ({ products, loading }) => {
    const { addToCart } = useCart();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleAddToWishlist = async (productId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            await api.post('/wishlist/add', { productId });
            toast.success('Saved to wishlist');
            window.dispatchEvent(new Event('wishlist-updated'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save to wishlist');
        }
    };

    if (loading) {
        return (
            <section className="bg-[#FAF7F2] py-24 px-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto"></div>
                <p className="mt-4 text-[#4A4036] font-bold uppercase tracking-widest text-xs">Loading essentials...</p>
            </section>
        );
    }

    return (
        <section className="bg-[#F5F2ED] py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <span className="text-[#A68A64] text-[10px] font-black uppercase tracking-[0.3em]">Curation</span>
                        <h2 className="text-[#4A4036] text-4xl font-bold mt-2">Essential Care</h2>
                    </div>
                    <Link to="/products">
                        <button className="text-[#4A4036] border-b-2 border-[#A68A64] font-bold text-xs uppercase tracking-widest pb-1 hover:text-[#A68A64] transition-all">
                            View All Products
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 ">
                    {products && products.length > 0 ? (
                        (() => {
                            const seenCategories = new Set();
                            return products.filter(p => {
                                if (seenCategories.has(p.category)) return false;
                                seenCategories.add(p.category);
                                return true;
                            }).map((product) => (
                                <div key={product._id} className="group bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-[#E0D8CC]/30">
                                    {/* Image Section */}
                                    <div className="relative aspect-[4/4] overflow-hidden block">
                                        <Link to={`/product/${product._id}`} className="block h-full w-full">
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleAddToWishlist(product._id)}
                                            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                                            aria-label="Add to wishlist"
                                        >
                                            <HiOutlineHeart size={18} className="text-[#A68A64]" />
                                        </button>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-5 flex flex-col flex-1">
                                        {/* Category and Rating */}
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#A68A64]/60">
                                                {product.category || "Surface"}
                                            </span>
                                            <div className="bg-[#F2EBDD]/50 px-4 py-1 rounded-full flex items-center gap-1">
                                                <FaStar className="text-[#A68A64] text-[10px]" />
                                                <span className="text-[10px] font-bold text-[#4A4036]">{product.rating || "0"}</span>
                                            </div>
                                        </div>

                                        <Link to={`/product/${product._id}`}>
                                            <h4 className="text-[#4A4036] font-bold text-xl mb-1 line-clamp-1 hover:text-[#A68A64] transition-colors">{product.name}</h4>
                                        </Link>

                                        <p className="text-[#756A5E] text-xs leading-relaxed line-clamp-2 opacity-60 mb-4">
                                            {product.description || "Artisanally crafted with pure ingredients for a curated and minimalist home experience."}
                                        </p>

                                        <div className="flex justify-between items-center mt-auto">
                                            <p className="text-[#4A4036] font-black text-xl">₹{product.price}</p>

                                            {/* Circular Cart Button */}
                                            <button
                                                onClick={() => addToCart(product._id)}
                                                className="w-12 h-12 bg-[#FAF7F2] text-[#4A4036] rounded-full flex items-center justify-center hover:bg-[#4A4036] hover:text-white transition-all duration-300 shadow-sm border border-[#E0D8CC]/30"
                                            >
                                                <HiOutlineShoppingBag size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ));
                        })()
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-[#4A4036] opacity-60 font-bold uppercase tracking-widest text-xs">No products found</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FeaturedCollection;