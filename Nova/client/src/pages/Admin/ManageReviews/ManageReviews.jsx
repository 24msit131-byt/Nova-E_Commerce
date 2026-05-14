import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaFilter, FaRegStar, FaSearch, FaStar, FaSyncAlt, FaTrash } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ManageReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRating, setSelectedRating] = useState('All');
    const [editingReview, setEditingReview] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/reviews/admin');
            setReviews(data.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const closeEditor = () => {
        setEditingReview(null);
        setReviewForm({ rating: 0, comment: '' });
    };

    const openEditor = (review) => {
        setEditingReview(review);
        setReviewForm({
            rating: review.rating || 0,
            comment: review.comment || '',
        });
    };

    const handleSaveReview = async (event) => {
        event.preventDefault();

        if (!reviewForm.rating) {
            toast.error('Please choose a rating');
            return;
        }

        try {
            setSaving(true);
            const { data } = await api.put(`/reviews/admin/${editingReview._id}`, {
                rating: Number(reviewForm.rating),
                comment: reviewForm.comment,
            });

            setReviews((prev) => prev.map((review) => review._id === editingReview._id ? data.data : review));
            toast.success('Review updated');
            closeEditor();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update review');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteReview = async (review) => {
        if (!window.confirm('Delete this review?')) {
            return;
        }

        try {
            await api.delete(`/reviews/admin/${review._id}`);
            setReviews((prev) => prev.filter((item) => item._id !== review._id));
            toast.success('Review deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete review');
        }
    };

    const filteredReviews = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return reviews.filter((review) => {
            const ratingMatch = selectedRating === 'All' || Number(review.rating) === Number(selectedRating);

            if (!query) {
                return ratingMatch;
            }

            const searchableText = [
                review.comment,
                review.user?.fullName,
                review.user?.email,
                review.product?.name,
                review.product?.category,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return ratingMatch && searchableText.includes(query);
        });
    }, [reviews, searchTerm, selectedRating]);

    const averageRating = reviews.length
        ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';

    const ratingBuckets = [5, 4, 3, 2, 1].reduce((acc, rating) => {
        acc[rating] = reviews.filter((review) => Number(review.rating) === rating).length;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex w-full font-sans">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto">
                <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
                    <div className="flex items-center gap-5">
                        <div>
                            <h1 className="text-3xl font-bold text-[#4A4036] tracking-tighter uppercase">Manage Reviews</h1>
                            <p className="text-[#A68A64] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Moderate product reviews and rating data</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchReviews}
                        className="inline-flex items-center gap-2 bg-white border border-[#E0D8CC] text-[#4A4036] px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F5F5F5] transition-all"
                    >
                        <FaSyncAlt /> Refresh
                    </button>
                </header>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-[2rem] border border-[#E0D8CC] p-6 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">Total Reviews</div>
                        <div className="mt-3 text-4xl font-bold text-[#4A4036]">{reviews.length}</div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-[#E0D8CC] p-6 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">Average Rating</div>
                        <div className="mt-3 text-4xl font-bold text-[#4A4036]">{averageRating}</div>
                        <div className="mt-2 flex items-center gap-1 text-[#A68A64]">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <FaStar key={index} className={index < Math.round(Number(averageRating)) ? 'text-[#A68A64]' : 'text-[#E0D8CC]'} />
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-[#E0D8CC] p-6 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">Five Star Reviews</div>
                        <div className="mt-3 text-4xl font-bold text-[#4A4036]">{ratingBuckets[5] || 0}</div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] p-5 md:p-6 mb-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#E0D8CC]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by product, user, comment, or email..."
                            className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-4 pl-14 pr-6 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <FaFilter className="text-[#A68A64]" />
                        {['All', 5, 4, 3, 2, 1].map((rating) => (
                            <button
                                key={rating}
                                type="button"
                                onClick={() => setSelectedRating(rating)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedRating === rating ? 'bg-[#4A4036] text-white border-[#4A4036]' : 'bg-[#FAF7F2] text-[#4A4036] border-[#E0D8CC] hover:bg-[#F5F5F5]'}`}
                            >
                                {rating === 'All' ? 'All Ratings' : `${rating} Star`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] overflow-hidden">
                    {loading ? (
                        <div className="p-24 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A68A64] mx-auto"></div>
                            <p className="mt-4 text-[#A68A64] font-black text-[10px] uppercase tracking-widest">Loading reviews...</p>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="p-24 text-center text-[#756A5E]">
                            No reviews found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#F5F5F5]">
                                        <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Product</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Customer</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Rating</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Review</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Created</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E0D8CC]/50">
                                    {filteredReviews.map((review) => (
                                        <tr key={review._id} className="hover:bg-[#FAF7F2]/50 transition-colors align-top">
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-[#4A4036]">{review.product?.name || 'Unknown product'}</div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64] mt-2">{review.product?.category || '-'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-[#4A4036]">{review.user?.fullName || 'Unknown user'}</div>
                                                <div className="text-xs text-[#756A5E]">{review.user?.email || '-'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-1 rounded-full bg-[#F2EBDD] px-3 py-1 text-[#A68A64] font-black text-[10px] uppercase tracking-[0.2em]">
                                                    <FaStar /> {review.rating}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-[#4A4036]/80 max-w-[360px]">
                                                {review.comment}
                                            </td>
                                            <td className="px-8 py-6 text-xs font-medium text-[#4A4036]/70 whitespace-nowrap">
                                                {review.createdAt ? new Date(review.createdAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditor(review)}
                                                        className="h-9 w-9 bg-[#F5F5F5] text-[#A68A64] rounded-lg flex items-center justify-center hover:bg-[#4A4036] hover:text-white transition-all shadow-sm border border-[#E0D8CC]"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReview(review)}
                                                        className="h-9 w-9 bg-[#F5F5F5] text-[#A68A64] rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-[#E0D8CC]"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {editingReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl border border-[#E0D8CC]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#4A4036] uppercase tracking-tight">Edit Review</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64] mt-1">Update review text or rating</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeEditor}
                                    className="text-[#756A5E] hover:text-[#4A4036] text-2xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSaveReview} className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Rating</label>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {Array.from({ length: 5 }).map((_, index) => {
                                            const value = index + 1;
                                            const active = value <= Number(reviewForm.rating);
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                                                    className={`w-12 h-12 rounded-xl border transition-all flex items-center justify-center ${active ? 'bg-[#4A4036] text-white border-[#4A4036]' : 'bg-[#FAF7F2] text-[#A68A64] border-[#E0D8CC] hover:bg-[#F5F5F5]'}`}
                                                >
                                                    {active ? <FaStar /> : <FaRegStar />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Comment</label>
                                    <textarea
                                        value={reviewForm.comment}
                                        onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                                        rows="5"
                                        className="mt-3 w-full rounded-2xl border border-[#E0D8CC] bg-[#FAF7F2] p-4 text-sm text-[#4A4036] outline-none focus:border-[#A68A64]"
                                    />
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={closeEditor}
                                        className="px-5 py-3 rounded-xl border border-[#E0D8CC] text-[10px] font-black uppercase tracking-widest text-[#4A4036] hover:bg-[#FAF7F2] transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-5 py-3 rounded-xl bg-[#4A4036] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#A68A64] transition-all disabled:opacity-60"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManageReviews;