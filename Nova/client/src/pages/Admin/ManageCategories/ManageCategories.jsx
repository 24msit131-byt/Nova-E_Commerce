import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPlus, FaSyncAlt, FaTrash, FaTags } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ManageCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState('');
    const [editingCategoryName, setEditingCategoryName] = useState('');

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/categories');
            setCategories(data.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setCategoryName('');
        setEditingCategoryId('');
        setEditingCategoryName('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextName = (editingCategoryId ? editingCategoryName : categoryName).trim();

        if (!nextName) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            setSaving(true);

            if (editingCategoryId) {
                await api.put(`/categories/${editingCategoryId}`, { name: nextName });
                toast.success('Category updated');
            } else {
                await api.post('/categories', { name: nextName });
                toast.success('Category added');
            }

            resetForm();
            await fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategoryId(category._id);
        setEditingCategoryName(category.name || '');
        setCategoryName('');
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Delete ${category.name}?`)) {
            return;
        }

        try {
            await api.delete(`/categories/${category._id}`);
            toast.success('Category deleted');
            if (editingCategoryId === category._id) {
                resetForm();
            }
            await fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const totalProducts = categories.reduce((sum, category) => sum + Number(category.productCount || 0), 0);

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex w-full font-sans">
            <AdminSidebar />

            <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto">
                <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
                    <div className="flex items-center gap-5">
                        <Link to="/admin/products" className="h-12 w-12 bg-white border border-[#E0D8CC] rounded-xl flex items-center justify-center text-[#A68A64] hover:bg-[#FAF7F2] transition-all shadow-sm">
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-[#4A4036] tracking-tighter uppercase">Product Categories</h1>
                            <p className="text-[#A68A64] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Manage catalog taxonomy and product assignment</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchCategories}
                        className="inline-flex items-center gap-2 bg-white border border-[#E0D8CC] text-[#4A4036] px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F5F5F5] transition-all"
                    >
                        <FaSyncAlt /> Refresh
                    </button>
                </header>

                <div className="grid xl:grid-cols-[360px_1fr] gap-8 mb-8">
                    <section className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] p-8 space-y-6 h-fit">
                        <div className="flex items-center gap-3 text-[#A68A64] text-[10px] font-black uppercase tracking-[0.2em]">
                            <FaTags /> {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    value={editingCategoryId ? editingCategoryName : categoryName}
                                    onChange={(event) => editingCategoryId
                                        ? setEditingCategoryName(event.target.value)
                                        : setCategoryName(event.target.value)
                                    }
                                    placeholder="e.g. Kitchen Care"
                                    className="w-full py-3 border-b-2 border-[#FAF7F2] focus:border-[#A68A64] outline-none text-sm font-bold text-[#4A4036] transition-all placeholder:text-[#E0D8CC]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#4A4036] text-white px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#A68A64] transition-all disabled:opacity-60"
                                >
                                    {editingCategoryId ? <FaEdit /> : <FaPlus />}
                                    {saving ? 'Saving...' : (editingCategoryId ? 'Update Category' : 'Add Category')}
                                </button>

                                {editingCategoryId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-3 rounded-xl border border-[#E0D8CC] text-[10px] font-black uppercase tracking-widest text-[#4A4036] hover:bg-[#FAF7F2] transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E0D8CC]/70">
                            <div className="rounded-2xl bg-[#FAF7F2] p-4">
                                <div className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Categories</div>
                                <div className="text-2xl font-bold text-[#4A4036] mt-2">{categories.length}</div>
                            </div>
                            <div className="rounded-2xl bg-[#FAF7F2] p-4">
                                <div className="text-[9px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Products Tagged</div>
                                <div className="text-2xl font-bold text-[#4A4036] mt-2">{totalProducts}</div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] overflow-hidden">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-[#E0D8CC] bg-[#FAF7F2]/60">
                            <div>
                                <h2 className="text-lg font-bold text-[#4A4036] uppercase tracking-tight">All Categories</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64] mt-1">Rename or remove categories in one place</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-24 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A68A64] mx-auto"></div>
                                <p className="mt-4 text-[#A68A64] font-black text-[10px] uppercase tracking-widest">Loading categories...</p>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="p-24 text-center text-[#756A5E]">
                                No categories found yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#F5F5F5]">
                                            <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Category</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Products</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Updated</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E0D8CC]/50">
                                        {categories.map((category) => (
                                            <tr key={category._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="font-bold text-[#4A4036]">{category.name}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex items-center rounded-full bg-[#F2EBDD] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">
                                                        {Number(category.productCount || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-medium text-[#4A4036]/70">
                                                    {category.updatedAt ? new Date(category.updatedAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(category)}
                                                            className="h-9 w-9 bg-[#F5F5F5] text-[#A68A64] rounded-lg flex items-center justify-center hover:bg-[#4A4036] hover:text-white transition-all shadow-sm border border-[#E0D8CC]"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(category)}
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
                    </section>
                </div>

                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64] px-1">
                    Renaming a category updates every product using that category.
                </div>
            </main>
        </div>
    );
};

export default ManageCategories;