import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaCloudUploadAlt, FaTrash, FaCheckCircle, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        status: 'Active'
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (!selectedFiles.length) return;

        const remainingSlots = 4 - images.length;
        if (remainingSlots <= 0) {
            toast.info('Nova catalog supports up to 4 images per product.');
            e.target.value = '';
            return;
        }

        const filesToAdd = selectedFiles.slice(0, remainingSlots);
        const previews = filesToAdd.map((file) => URL.createObjectURL(file));
        setPreviewImages((prev) => [...prev, ...previews]);
        setImages((prev) => [...prev, ...filesToAdd]);
        e.target.value = '';
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(previewImages[index]);
        setPreviewImages((prev) => prev.filter((_, i) => i !== index));
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        return () => {
            previewImages.forEach((preview) => URL.revokeObjectURL(preview));
        };
    }, [previewImages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, category, description, price, stock } = formData;

        if (!name.trim() || !category.trim() || !description.trim()) {
            toast.error('Please complete the product profile before publishing.');
            return;
        }

        try {
            setLoading(true);
            const productData = new FormData();
            Object.keys(formData).forEach(key => productData.append(key, formData[key]));
            images.forEach((file) => productData.append('images', file));

            await api.post('/products', productData);
            toast.success('Product Curated & Published!');
            navigate('/admin/products');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#FAF7F2] flex w-full overflow-hidden font-sans">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto">
                {/* Header Section */}
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center space-x-6">
                        <Link to="/admin/products" className="h-12 w-12 bg-white border border-[#E0D8CC] rounded-xl flex items-center justify-center text-[#A68A64] hover:bg-[#FAF7F2] transition-all shadow-sm">
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-[#4A4036] tracking-tighter uppercase">Product Curation</h1>
                            <p className="text-[#A68A64] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Add to Nova Home Care Collection</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="hidden md:flex items-center space-x-3 bg-[#4A4036] text-white px-10 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#A68A64] transition-all shadow-lg disabled:bg-[#E0D8CC]"
                    >
                        {loading ? 'Processing...' : <><FaCheckCircle /> <span>Publish to Catalog</span></>}
                    </button>
                </header>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* LEFT COLUMN: PRIMARY DETAILS */}
                    <div className="flex-[1.5] space-y-8">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] p-10 space-y-10">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Product Identity</label>
                                <input
                                    name="name" type="text" value={formData.name} onChange={handleInputChange}
                                    placeholder="e.g. Organic Lavender Surface Cleaner"
                                    className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-lg font-bold text-[#4A4036] transition-all placeholder:text-[#E0D8CC]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Category Selection</label>
                                    <select
                                        name="category" value={formData.category} onChange={handleInputChange}
                                        className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-sm font-bold text-[#4A4036] bg-transparent cursor-pointer"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="kitchen">Kitchen Care</option>
                                        <option value="bathroom">Bathroom Care</option>
                                        <option value="floor">Floor Care</option>
                                        <option value="lifestyle">Lifestyle & Home</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Visibility Status</label>
                                    <select
                                        name="status" value={formData.status} onChange={handleInputChange}
                                        className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-sm font-bold text-[#4A4036] bg-transparent"
                                    >
                                        <option value="Active">Public / Live</option>
                                        <option value="Draft">Internal Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Product Narrative</label>
                                <textarea
                                    name="description" rows="5" value={formData.description} onChange={handleInputChange}
                                    placeholder="Tell the story of this product's ingredients and benefits..."
                                    className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-sm font-medium text-[#4A4036]/80 leading-relaxed transition-all resize-none shadow-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LOGISTICS & MEDIA */}
                    <div className="flex-1 space-y-8">
                        {/* Pricing & Stock Card */}
                        <div className="bg-[#4A4036] rounded-[2rem] p-10 text-white space-y-10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A68A64]/10 rounded-full blur-3xl"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A68A64] flex items-center">
                                <FaInfoCircle className="mr-2" /> Logistics & Pricing
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Retail Price (INR)</label>
                                <input
                                    name="price" type="number" value={formData.price} onChange={handleInputChange}
                                    placeholder="₹ 0.00"
                                    className="w-full py-3 bg-transparent border-b border-[#A68A64]/30 focus:border-[#A68A64] outline-none text-3xl font-bold text-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Warehouse Allocation</label>
                                <input
                                    name="stock" type="number" value={formData.stock} onChange={handleInputChange}
                                    placeholder="Available Units"
                                    className="w-full py-3 bg-transparent border-b border-[#A68A64]/30 focus:border-[#A68A64] outline-none text-lg font-bold text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Image Upload Card */}
                        <div className="bg-white rounded-[2rem] border border-[#E0D8CC] p-8 shadow-sm">
                            <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] mb-6 block text-center">Visual Assets</label>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {previewImages.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-[#FAF7F2]">
                                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute inset-0 bg-[#4A4036]/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                                {images.length < 4 && (
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-[#E0D8CC] flex flex-col items-center justify-center cursor-pointer hover:bg-[#FAF7F2] hover:border-[#A68A64] transition-all group">
                                        <FaCloudUploadAlt className="text-[#E0D8CC] group-hover:text-[#A68A64] text-2xl mb-2" />
                                        <span className="text-[9px] font-black text-[#A68A64] uppercase">Add Photo</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                            <p className="text-[9px] text-[#A68A64] text-center font-bold uppercase tracking-tight">Curation limit: 4 Images</p>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="md:hidden w-full bg-[#A68A64] text-white py-5 rounded-xl font-bold text-xs uppercase tracking-widest disabled:bg-[#E0D8CC]"
                        >
                            {loading ? 'Processing...' : 'Publish Product'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddProduct;