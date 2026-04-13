import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiOutlineShoppingBag, HiArrowRight, HiOutlineTrash } from 'react-icons/hi2';
import { FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api.js';

const Wishlist = () => {
	const [wishlist, setWishlist] = useState({ products: [] });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [removingId, setRemovingId] = useState(null);

	const colors = {
		primary: '#A68A64',
		secondary: '#FAF7F2',
		accent: '#E0D8CC',
		textMain: '#4A4036',
		textSecondary: '#756A5E'
	};

	useEffect(() => {
		const fetchWishlist = async () => {
			try {
				setLoading(true);
				setError('');
				const response = await api.get('/wishlist');
				setWishlist(response.data?.data?.wishlist || { products: [] });
			} catch (err) {
				setError(err.response?.data?.message || err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchWishlist();
	}, []);

	const handleRemove = async (productId) => {
		try {
			setRemovingId(productId);
			const response = await api.delete(`/wishlist/remove/${productId}`);
			setWishlist(response.data?.data?.wishlist || { products: [] });
			toast.success('Removed from wishlist');
			window.dispatchEvent(new Event('wishlist-updated'));
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to update wishlist');
		} finally {
			setRemovingId(null);
		}
	};

	const wishlistItems = (wishlist?.products || []).filter(Boolean);

	if (loading) {
		return (
			<div className="min-h-screen pt-28 pb-16 flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
				<div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-6" style={{ backgroundColor: colors.secondary }}>
				<div className="max-w-xl rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={{ borderColor: colors.accent }}>
					<h2 className="text-2xl font-bold" style={{ color: colors.textMain }}>
						Wishlist unavailable
					</h2>
					<p className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
						{error}
					</p>
				</div>
			</div>
		);
	}

	if (wishlistItems.length === 0) {
		return (
			<div className="min-h-screen pt-28 pb-16" style={{ backgroundColor: colors.secondary }}>
				<div className="max-w-6xl mx-auto px-6 lg:px-8">
					<div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
						<div className="space-y-6">
							<div
								className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em]"
								style={{ backgroundColor: '#ffffff', color: colors.primary, border: `1px solid ${colors.accent}` }}
							>
								<HiOutlineHeart className="text-base" />
								Saved items
							</div>

							<div className="space-y-4 max-w-2xl">
								<h1 className="text-4xl md:text-6xl font-black tracking-tight" style={{ color: colors.textMain }}>
									Your wishlist, all in one place.
								</h1>
								<p className="text-base md:text-lg leading-8 max-w-xl" style={{ color: colors.textSecondary }}>
									Save products you love so you can revisit them later, compare options, and move your favorites into cart when you are ready.
								</p>
							</div>

							<div className="flex flex-wrap gap-4">
								<Link
									to="/products"
									className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
									style={{ backgroundColor: colors.primary }}
								>
									Browse products
									<HiArrowRight className="text-base" />
								</Link>
								<Link
									to="/cart"
									className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors"
									style={{ color: colors.textMain, border: `1px solid ${colors.accent}`, backgroundColor: '#ffffff' }}
								>
									<HiOutlineShoppingBag className="text-base" />
									View cart
								</Link>
							</div>

							<div className="grid sm:grid-cols-3 gap-4 pt-4">
								{['Track favorites', 'Compare later', 'Move to cart quickly'].map((item) => (
									<div
										key={item}
										className="rounded-3xl border bg-white p-5 shadow-[0_18px_40px_rgba(74,64,54,0.05)]"
										style={{ borderColor: colors.accent }}
									>
										<p className="text-sm font-semibold" style={{ color: colors.textMain }}>
											{item}
										</p>
									</div>
								))}
							</div>
						</div>

						<div className="lg:sticky lg:top-28">
							<div
								className="rounded-[2rem] border bg-white p-8 shadow-[0_24px_80px_rgba(74,64,54,0.08)]"
								style={{ borderColor: colors.accent }}
							>
								<div className="flex items-center justify-between mb-8">
									<p className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: colors.textSecondary }}>
										Wishlist preview
									</p>
									<span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: '#F5F1EA', color: colors.primary }}>
										Empty
									</span>
								</div>

								<div className="rounded-[1.75rem] border-2 border-dashed p-10 text-center" style={{ borderColor: colors.accent, backgroundColor: '#FBF9F5' }}>
									<div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: '#F5F1EA', color: colors.primary }}>
										<HiOutlineHeart className="text-4xl" />
									</div>
									<h2 className="text-2xl font-bold" style={{ color: colors.textMain }}>
										No saved items yet
									</h2>
									<p className="mt-3 text-sm leading-7" style={{ color: colors.textSecondary }}>
										Tap the heart on a product to add it here. Your wishlist will help you keep track of products you want to revisit.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-28 pb-16" style={{ backgroundColor: colors.secondary }}>
			<div className="max-w-6xl mx-auto px-6 lg:px-8 space-y-8">
				<div className="flex items-end justify-between gap-4 flex-wrap">
					<div className="space-y-3 max-w-2xl">
						<div
							className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em]"
							style={{ backgroundColor: '#ffffff', color: colors.primary, border: `1px solid ${colors.accent}` }}
						>
							<HiOutlineHeart className="text-base" />
							Saved items
						</div>
						<h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: colors.textMain }}>
							Your wishlist, all in one place.
						</h1>
					</div>
					<Link to="/products" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]" style={{ backgroundColor: colors.primary }}>
						Browse products
						<HiArrowRight className="text-base" />
					</Link>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{wishlistItems.map((product) => (
						<div key={product._id} className="group rounded-[2rem] border bg-white overflow-hidden shadow-[0_18px_40px_rgba(74,64,54,0.05)]" style={{ borderColor: colors.accent }}>
							<Link to={`/product/${product._id}`} className="block aspect-[4/3] overflow-hidden bg-[#F5F1EA]">
								<img
									src={product.images?.[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=900'}
									alt={product.name}
									className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
								/>
							</Link>
							<div className="p-5 space-y-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.primary }}>
											{product.category || 'Product'}
										</p>
										<h2 className="mt-1 text-lg font-bold truncate" style={{ color: colors.textMain }}>
											{product.name}
										</h2>
									</div>
									<div className="flex items-center gap-1 rounded-full bg-[#F5F1EA] px-3 py-1 text-[11px] font-bold" style={{ color: colors.textMain }}>
										<FaStar className="text-[#A68A64]" />
										{product.rating || 0}
									</div>
								</div>
								<p className="text-sm leading-7 line-clamp-3" style={{ color: colors.textSecondary }}>
									{product.description || 'Saved for later review.'}
								</p>
								<div className="flex items-center justify-between gap-3 pt-2">
									<p className="text-xl font-black" style={{ color: colors.textMain }}>
										₹{product.price}
									</p>
									<button
										type="button"
										onClick={() => handleRemove(product._id)}
										disabled={removingId === product._id}
										className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors hover:bg-[#4A4036] hover:text-white disabled:opacity-50"
										style={{ borderColor: colors.accent, color: colors.textMain }}
									>
										<HiOutlineTrash className="text-base" />
										{removingId === product._id ? 'Removing' : 'Remove'}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Wishlist;
