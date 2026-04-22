import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaSave, FaTrash, FaArrowLeft, FaInfoCircle, FaHistory } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const PRODUCT_CATEGORIES = [
    'Kitchen Care',
    'Bathroom Care',
    'Floor Care',
    'Windows Care',
    'Laundry Care',
    'Pet Care',
    'Lifestyle & Home'
];

const UpdateProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [media, setMedia] = useState([]); // Array of { url, file }
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState(PRODUCT_CATEGORIES);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        status: 'Active'
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const [productResponse, categoriesResponse] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get('/categories'),
                ]);

                const { data } = productResponse;
                const product = data.data;
                const fetchedCategories = (categoriesResponse.data?.data || [])
                    .map((category) => category.name)
                    .filter(Boolean);

                const availableCategories = [...fetchedCategories];
                if (product.category && !availableCategories.some((category) => category.toLowerCase() === product.category.toLowerCase())) {
                    availableCategories.push(product.category);
                }

                setCategoryOptions(availableCategories.length > 0 ? availableCategories : PRODUCT_CATEGORIES);
                setFormData({
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    stock: product.stock,
                    description: product.description,
                    status: product.status || 'Active'
                });
                setMedia((product.images || []).map(img => ({ url: img, file: null })));
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching product:", err);
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newMedia = files.map(file => ({
            url: URL.createObjectURL(file),
            file: file
        }));
        setMedia([...media, ...newMedia]);
    };

    const removeImage = (index) => {
        setMedia(media.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('name', formData.name);
            formDataToSubmit.append('category', formData.category);
            formDataToSubmit.append('price', formData.price);
            formDataToSubmit.append('stock', formData.stock);
            formDataToSubmit.append('description', formData.description);
            formDataToSubmit.append('status', formData.status);

            const existingImages = media.filter(m => !m.file).map(m => m.url);
            formDataToSubmit.append('existingImages', JSON.stringify(existingImages));

            media.filter(m => m.file).forEach(m => {
                formDataToSubmit.append('images', m.file);
            });

            await api.put(`/products/${id}`, formDataToSubmit, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setIsSaving(false);
            toast.success('Nova Catalog updated and synchronized successfully!');
            navigate('/admin/products');
        } catch (err) {
            console.error("Update failed:", err);
            setIsSaving(false);
            toast.error(err.response?.data?.message || "Error updating product configuration");
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#FAF7F2]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A68A64] mb-4"></div>
            <div className="font-black text-[#A68A64] uppercase tracking-widest text-[10px]">Retrieving Configuration...</div>
        </div>
    );

    return (
        <div className="h-screen bg-[#FAF7F2] flex w-full overflow-hidden font-sans">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto">
                {/* Header Section */}
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center space-x-6">
                        <Link to="/admin/products" className="h-12 w-12 bg-white border border-[#E0D8CC] rounded-xl flex items-center justify-center text-[#A68A64] hover:bg-[#FAF7F2] shadow-sm transition-all">
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-[#4A4036] tracking-tighter uppercase">Modify Entry</h1>
                            <p className="text-[#A68A64] text-[10px] font-black uppercase tracking-widest mt-1 italic">Ref ID: {id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`hidden md:flex items-center space-x-3 bg-[#4A4036] text-white px-10 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#A68A64] transition-all shadow-lg ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <FaSave /> <span>{isSaving ? 'Synchronizing...' : 'Commit Changes'}</span>
                    </button>
                </header>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* LEFT COLUMN: IDENTITY */}
                    <div className="flex-[1.5] space-y-8">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] p-10 space-y-10">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Product Name</label>
                                <input
                                    name="name" type="text" value={formData.name} onChange={handleInputChange}
                                    className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-lg font-bold text-[#4A4036] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Category</label>
                                    <select
                                        name="category" value={formData.category} onChange={handleInputChange}
                                        className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-sm font-bold text-[#4A4036] bg-transparent cursor-pointer"
                                    >
                                        {categoryOptions.map((category) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Inventory Status</label>
                                    <select
                                        name="status" value={formData.status} onChange={handleInputChange}
                                        className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-sm font-bold text-[#4A4036] bg-transparent"
                                    >
                                        <option value="Active">Live</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Product Narrative</label>
                                <textarea
                                    name="description" rows="6" value={formData.description} onChange={handleInputChange}
                                    className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-sm font-medium text-[#4A4036]/80 leading-relaxed transition-all resize-none shadow-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LOGISTICS & MEDIA */}
                    <div className="flex-1 space-y-8">
                        {/* Pricing & Stock (Nova Dark Card) */}
                        <div className="bg-[#4A4036] rounded-[2rem] p-10 text-white space-y-10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A68A64]/10 rounded-full blur-3xl"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A68A64] flex items-center">
                                <FaHistory className="mr-2" /> Live Logistics
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Unit Price (INR)</label>
                                <input
                                    name="price" type="number" value={formData.price} onChange={handleInputChange}
                                    className="w-full py-3 bg-transparent border-b border-[#A68A64]/30 focus:border-[#A68A64] outline-none text-3xl font-bold text-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Available Stock</label>
                                <input
                                    name="stock" type="number" value={formData.stock} onChange={handleInputChange}
                                    className="w-full py-3 bg-transparent border-b border-[#A68A64]/30 focus:border-[#A68A64] outline-none text-lg font-bold text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Image Asset Management */}
                        <div className="bg-white rounded-[2rem] border border-[#E0D8CC] p-8 shadow-sm">
                            <label className="text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em] mb-6 block text-center">Manage Assets</label>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {media.map((item, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-[#FAF7F2]">
                                        <img src={item.url} alt="preview" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute inset-0 bg-[#4A4036]/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                                {media.length < 4 && (
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-[#E0D8CC] flex flex-col items-center justify-center cursor-pointer hover:bg-[#FAF7F2] hover:border-[#A68A64] transition-all group">
                                        <FaCloudUploadAlt className="text-[#E0D8CC] group-hover:text-[#A68A64] text-2xl mb-2" />
                                        <span className="text-[9px] font-black text-[#A68A64] uppercase">Add Media</span>
                                        <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                            <p className="text-[9px] text-[#A68A64] text-center font-bold uppercase italic">Syncing up to 4 assets</p>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="md:hidden w-full bg-[#A68A64] text-white py-5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            {isSaving ? 'Synchronizing...' : 'Save Product Changes'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UpdateProduct;