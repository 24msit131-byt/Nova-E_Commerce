import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFilter, FaBoxOpen, FaDownload } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ManageProducts = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products/admin');
      setProducts(data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product from the Nova catalog?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product successfully removed from catalog');
        fetchProducts();
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);

      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await api.get(`/reports/inventory${params.toString() ? `?${params.toString()}` : ''}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Product_invoice.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex w-full font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-10 lg:p-16">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-[#4A4036] tracking-tight uppercase">Inventory Master</h1>
            <p className="text-[#A68A64] text-xs font-black mt-1 uppercase tracking-[0.2em]">Curation & Stock Management</p>
          </div>
          <button
            onClick={() => navigate('/admin/add-product')}
            className="flex items-center space-x-3 bg-[#A68A64] text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#4A4036] transition-all shadow-lg active:scale-95"
          >
            <FaPlus /> <span>New Collection Item</span>
          </button>
        </header>

        {/* Filters & Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E0D8CC] mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#E0D8CC] group-focus-within:text-[#A68A64] transition-colors" />
            <input
              type="text"
              placeholder="Search catalog by name..."
              className="w-full bg-[#F5F5F5] border border-transparent rounded-xl py-4 pl-14 pr-6 text-sm outline-none focus:bg-white focus:border-[#A68A64] transition-all text-[#4A4036]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center space-x-2 px-6 py-4 bg-[#FAF7F2] text-[#4A4036] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#E0D8CC] transition-all border border-[#E0D8CC]">
            <FaFilter className="text-[#A68A64]" /> <span>Category</span>
          </button>
        </div>

        {/* Sophisticated Data Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] overflow-hidden">
          {loading ? (
            <div className="p-24 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A68A64] mx-auto"></div>
              <p className="mt-4 text-[#A68A64] font-black text-[10px] uppercase tracking-widest">Accessing Catalog...</p>
            </div>
          ) : error ? (
            <div className="p-24 text-center">
              <p className="text-red-400 font-bold text-[10px] uppercase tracking-widest">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F5]">
                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Product Info</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Category</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Price</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Stock</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#A68A64] uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D8CC]/50">
                  {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                    <tr key={product._id} className="hover:bg-[#FAF7F2]/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-[#F5F5F5] rounded-lg overflow-hidden flex items-center justify-center text-[#E0D8CC] group-hover:bg-white group-hover:shadow-sm transition-all border border-[#E0D8CC]/30">
                            {product.images?.length > 0 ? (
                              <img src={product.images[0]} alt="" className="h-full w-full object-cover grayscale-[30%] group-hover:grayscale-0" />
                            ) : (
                              <FaBoxOpen size={20} />
                            )}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-[#4A4036]">{product.name}</span>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-[#A68A64]/70 mt-1">
                              {product.packSize ? `Volume · ${product.packSize}` : 'Volume not set'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-[#A68A64] uppercase">{product.category}</td>
                      <td className="px-8 py-6 text-sm font-bold text-[#4A4036]">₹{product.price.toLocaleString('en-IN')}</td>
                      <td className="px-8 py-6 text-sm font-medium text-[#4A4036]/70">{product.stock} Units</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${product.stock > 10 ? 'bg-green-50 text-green-700' :
                          product.stock > 0 ? 'bg-[#E0D8CC] text-[#4A4036]' : 'bg-red-50 text-red-600'
                          }`}>
                          {product.stock > 10 ? 'Available' : product.stock > 0 ? 'Low Volume' : 'Depleted'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => navigate(`/admin/update-product/${product._id}`)}
                            className="h-9 w-9 bg-[#F5F5F5] text-[#A68A64] rounded-lg flex items-center justify-center hover:bg-[#4A4036] hover:text-white transition-all shadow-sm border border-[#E0D8CC]"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
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
          
          {/* Pagination */}
          <div className="p-8 border-t border-[#E0D8CC] flex justify-between items-center bg-[#F5F5F5]/30">
            <span className="text-[10px] font-black text-[#A68A64] uppercase tracking-widest">Inventory Segment</span>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="px-5 py-2 bg-[#4A4036] text-white rounded-lg text-[10px] font-black uppercase hover:bg-[#A68A64] shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaDownload size={10} />
                <span>{downloading ? 'Downloading...' : 'Download Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageProducts;