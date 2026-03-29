import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTrash, FaEye, FaSave, FaLink } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const Banner = () => {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentBanner, setCurrentBanner] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [bannerData, setBannerData] = useState({
        title: '',
        subtitle: '',
        link: '',
        image: null,
        previewUrl: ''
    });

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                setInitialLoading(true);
                const { data } = await api.get('/banner');
                const banner = data?.data;
                setCurrentBanner(banner || null);

                setBannerData((prev) => ({
                    ...prev,
                    title: banner?.title || '',
                    subtitle: banner?.subtitle || '',
                    link: banner?.link || '/products',
                    previewUrl: banner?.imageUrl || ''
                }));
            } catch (err) {
                console.error('Failed to fetch banner:', err);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchBanner();
    }, []);

    // Nova Brand Palette
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        pageBg: '#e9e4dc',      // Warm Cream
        textMain: '#4A4036',    // Dark Brown
        accent: '#D6C9B5',      // Borders
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerData({
                ...bannerData,
                image: file,
                previewUrl: URL.createObjectURL(file)
            });
            setRemoveImage(false);
        }
    };

    const handleClearImage = () => {
        setBannerData({ ...bannerData, previewUrl: '', image: null });
        setRemoveImage(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('title', bannerData.title);
        formData.append('subtitle', bannerData.subtitle);
        formData.append('link', bannerData.link);
        formData.append('removeImage', removeImage ? 'true' : 'false');
        if (bannerData.image) formData.append('image', bannerData.image);

        try {
            const { data } = await api.put('/banner/admin', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const savedBanner = data?.data;
            setCurrentBanner(savedBanner || null);
            setBannerData((prev) => ({
                ...prev,
                image: null,
                previewUrl: savedBanner?.imageUrl || prev.previewUrl
            }));
            setRemoveImage(false);
            toast.success('Banner updated successfully in your sanctuary!');
        } catch (err) {
            toast.error('Failed to update banner.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex">
                <AdminSidebar />
                <main className="flex-1 p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
            <AdminSidebar />
            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-[44px] font-bold tracking-tighter pb-2" style={{ color: colors.textMain }}>Banner Management</h1>
                    <p className="text-[13px] opacity-60 uppercase tracking-widest font-bold">Set the visual tone for your storefront</p>
                </header>

                <div className="grid lg:grid-cols-2 gap-12">

                    {/* COLUMN 1: CONFIGURATION */}
                    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border" style={{ borderColor: colors.accent }}>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Banner Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Summer Sanctuary Collection"
                                className="w-full bg-slate-50 border-2 rounded-2xl p-4 focus:outline-none transition-all"
                                style={{ borderColor: colors.accent }}
                                value={bannerData.title}
                                onChange={(e) => setBannerData({ ...bannerData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Subtitle / Narrative</label>
                            <textarea
                                placeholder="A brief description of the current mood..."
                                className="w-full bg-slate-50 border-2 rounded-2xl p-4 h-32 focus:outline-none transition-all"
                                style={{ borderColor: colors.accent }}
                                value={bannerData.subtitle}
                                onChange={(e) => setBannerData({ ...bannerData, subtitle: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Redirect Path (URL)</label>
                            <div className="relative">
                                <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                                <input
                                    type="text"
                                    placeholder="/collection/new-arrivals"
                                    className="w-full bg-slate-50 border-2 rounded-2xl p-4 pl-12 focus:outline-none transition-all"
                                    style={{ borderColor: colors.accent }}
                                    value={bannerData.link}
                                    onChange={(e) => setBannerData({ ...bannerData, link: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Visual Asset</label>
                            <div
                                className="border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer hover:bg-slate-50 transition-all group"
                                style={{ borderColor: colors.accent }}
                                onClick={() => document.getElementById('bannerInput').click()}
                            >
                                <input type="file" id="bannerInput" hidden onChange={handleImageChange} accept="image/*" />
                                <FaCloudUploadAlt className="text-4xl mx-auto mb-4 opacity-20 group-hover:scale-110 transition-transform" style={{ color: colors.primary }} />
                                <p className="text-xs font-bold opacity-60">Drop high-resolution image here or click to browse</p>
                                <p className="text-[9px] opacity-40 mt-2">Recommended: 1920x800px</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-lg text-white transition-all active:scale-95"
                            style={{ backgroundColor: colors.textMain }}
                        >
                            {loading ? 'Processing...' : <span className="flex items-center justify-center gap-2"><FaSave /> Deploy Banner</span>}
                        </button>
                    </form>

                    {/* COLUMN 2: LIVE PREVIEW */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border shadow-sm" style={{ borderColor: colors.accent }}>
                            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Current Live Banner</h3>
                            <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden border" style={{ borderColor: colors.accent }}>
                                <img
                                    src={currentBanner?.imageUrl || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=2000'}
                                    className="w-full h-full object-cover"
                                    alt="Current live banner"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-5 text-white flex flex-col justify-end">
                                    <h4 className="text-lg font-bold line-clamp-2">{currentBanner?.title || 'Pure solutions for a spotless sanctuary.'}</h4>
                                    <p className="text-xs opacity-80 mt-1 line-clamp-2">{currentBanner?.subtitle || 'Nova brings the art of curation to home care.'}</p>
                                    <p className="text-[10px] uppercase tracking-wider mt-2 opacity-80">Path: {currentBanner?.link || '/products'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><FaEye /> Live Preview</h3>
                            {bannerData.previewUrl && (
                                <button
                                    onClick={handleClearImage}
                                    className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 hover:underline"
                                >
                                    <FaTrash /> Clear Image
                                </button>
                            )}
                        </div>

                        {/* Banner Preview Card */}
                        <div className="relative w-full aspect-[16/7] rounded-[2.5rem] overflow-hidden shadow-2xl bg-white group border-4 border-white">
                            {bannerData.previewUrl ? (
                                <img src={bannerData.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 italic text-sm opacity-30">
                                    No image selected
                                </div>
                            )}

                            {/* Overlay Text Preview */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-center p-12 text-white">
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter max-w-md">
                                    {bannerData.title || 'Your Title Here'}
                                </h2>
                                <p className="text-sm mt-3 opacity-80 max-w-xs font-medium">
                                    {bannerData.subtitle || 'Your narrative will appear here.'}
                                </p>
                                <div className="mt-8">
                                    <span className="px-8 py-3 border-2 border-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Explore More
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/50 p-6 rounded-3xl border border-dashed" style={{ borderColor: colors.accent }}>
                            <p className="text-[10px] leading-relaxed opacity-60">
                                <strong>Note:</strong> Ensure images are optimized for web (under 500KB) to maintain site sanctuary speed. Changes will reflect immediately on the customer landing page.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Banner;