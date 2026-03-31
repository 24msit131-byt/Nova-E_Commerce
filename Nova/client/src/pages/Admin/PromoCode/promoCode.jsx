import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const PromoDashboard = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    totalRevenue: 0,
    totalCoupons: 0,
    couponsUsed: 0,
    couponsRemaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    usageLimit: 0,
    expiresAt: '',
    status: 'Active'
  });

  const formatDiscountLabel = (promo) => {
    if (promo?.discountType && typeof promo?.discountValue === 'number') {
      return promo.discountType === 'percentage'
        ? `${promo.discountValue}%`
        : `₹${promo.discountValue}`;
    }

    return promo?.discount || '-';
  };

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/promos');
      if (response.data.success) {
        const codes = response.data.data || [];
        const couponsUsed = codes.reduce((sum, promo) => sum + Number(promo.usageCount || 0), 0);
        const couponsRemaining = codes.reduce((sum, promo) => {
          const usageLimit = Number(promo.usageLimit || 0);
          const usageCount = Number(promo.usageCount || 0);
          return usageLimit <= 0 ? sum : sum + Math.max(usageLimit - usageCount, 0);
        }, 0);

        setPromoCodes(codes);
        setStats({
          activeCount: response.data.activeCount,
          totalRevenue: response.data.totalRevenue,
          totalCoupons: codes.length,
          couponsUsed,
          couponsRemaining,
        });
      }
    } catch (error) {
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const response = await api.delete(`/promos/${id}`);
      if (response.data.success) {
        toast.success('Promo code deleted');
        fetchPromoCodes();
      }
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await api.patch(`/promos/${id}`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Promo code ${newStatus.toLowerCase()}`);
        fetchPromoCodes();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const normalizedCode = newPromo.code.trim().toUpperCase();
      const normalizedDiscountValue = Number(newPromo.discountValue);

      if (!normalizedCode) {
        toast.error('Promo code is required');
        return;
      }

      if (!Number.isFinite(normalizedDiscountValue) || normalizedDiscountValue <= 0) {
        toast.error('Please enter a valid discount value');
        return;
      }

      const payload = {
        code: normalizedCode,
        discountType: newPromo.discountType,
        discountValue: normalizedDiscountValue,
        usageLimit: Number(newPromo.usageLimit) || 0,
        status: 'Active',
        ...(newPromo.expiresAt ? { expiresAt: newPromo.expiresAt } : {}),
      };

      const response = await api.post('/promos', payload);
      if (response.data.success) {
        toast.success('Promo code created successfully');
        setIsModalOpen(false);
        setNewPromo({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          usageLimit: 0,
          expiresAt: '',
          status: 'Active'
        });
        fetchPromoCodes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create promo code');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#e9e4dc] font-sans text-[#4A4036]">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#A68A64] mb-1">
              Nova Dashboard / Management
            </p>
            <h2 className="text-3xl font-bold text-[#4A4036]">Promo Code Management</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#A68A64] hover:bg-[#8e7555] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
          >
            + Create New Code
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Coupons', value: stats.activeCount },
            { label: 'Coupons Used', value: stats.couponsUsed },
            { label: 'Coupons Remaining', value: stats.couponsRemaining },
            { label: 'Total Coupons', value: stats.totalCoupons },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-[#D6C9B5] shadow-sm">
              <p className="text-[#A68A64] text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-[#4A4036]">{stat.value}</h3>
            </div>
          ))}
        </div>

       {/* Table Section */}
<div className="bg-white rounded-2xl border border-[#D6C9B5] overflow-hidden shadow-sm">
  {loading ? (
    <div className="p-20 text-center font-medium">Loading records...</div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#f5f2ee] border-b border-[#D6C9B5]">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A68A64]">Code</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A68A64]">Discount</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A68A64]">Usage</th>
            {/* Added text-center here to match the button below */}
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A68A64] text-center">Status</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A68A64] text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D6C9B5]/30">
          {promoCodes.length > 0 ? (
            promoCodes.map((item) => {
              const usageCount = Number(item.usageCount || 0);
              const usageLimit = Number(item.usageLimit || 0);
              const available = usageLimit > 0 ? Math.max(usageLimit - usageCount, 0) : 'Unlimited';
              const isLimitReached = usageLimit > 0 && usageCount >= usageLimit;
              const displayStatus = isLimitReached ? 'Inactive' : item.status;

              return (
                <tr key={item._id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-6 py-4 font-bold text-[#A68A64]">{item.code}</td>
                  <td className="px-6 py-4 font-medium">{formatDiscountLabel(item)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold">{usageCount} / {usageLimit === 0 ? '∞' : usageLimit}</div>
                    <div className="text-[11px] text-[#A68A64]/70 uppercase tracking-tighter font-semibold">Remaining: {available}</div>
                  </td>
                  {/* Status Cell - Centered */}
                  <td className="px-6 py-4 text-center">
                    <button
                      disabled={isLimitReached}
                      onClick={() => toggleStatus(item._id, item.status)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all inline-block ${
                        displayStatus === 'Active' 
                          ? 'bg-[#A68A64] text-white' 
                          : 'bg-[#D6C9B5] text-[#4A4036] opacity-60'
                      } ${isLimitReached ? 'cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                      {displayStatus}
                    </button>
                  </td>
                  {/* Actions Cell - Centered */}
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all active:scale-95 shadow-sm inline-block"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" className="px-6 py-12 text-center text-[#A68A64] italic">No promotional codes found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )}
</div>

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A4036]/40 backdrop-blur-sm">
            <div className="bg-[#e9e4dc] w-full max-w-md rounded-2xl shadow-2xl border border-[#D6C9B5] overflow-hidden">
              <div className="bg-[#A68A64] p-6">
                <h3 className="text-xl font-bold text-white">New Promo Code</h3>
              </div>
              <form onSubmit={handleCreate} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#4A4036] mb-1.5">Promo Code</label>
                  <input 
                    type="text" 
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                    className="w-full bg-white border border-[#D6C9B5] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#A68A64] outline-none"
                    placeholder="SUMMER2026"
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#4A4036] mb-1.5">Discount Type</label>
                    <select
                      value={newPromo.discountType}
                      onChange={(e) => setNewPromo({...newPromo, discountType: e.target.value})}
                      className="w-full bg-white border border-[#D6C9B5] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#A68A64] outline-none"
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#4A4036] mb-1.5">
                      {newPromo.discountType === 'percentage' ? 'Discount %' : 'Discount ₹'}
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step={newPromo.discountType === 'percentage' ? '0.01' : '1'}
                      value={newPromo.discountValue}
                      onChange={(e) => setNewPromo({...newPromo, discountValue: e.target.value})}
                      className="w-full bg-white border border-[#D6C9B5] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#A68A64] outline-none"
                      placeholder={newPromo.discountType === 'percentage' ? '10' : '100'}
                      required 
                    />
                  </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-[#4A4036] mb-1.5">Usage Limit</label>
                    <input 
                      type="number" 
                      value={newPromo.usageLimit}
                      onChange={(e) => setNewPromo({...newPromo, usageLimit: Number(e.target.value) || 0})}
                      className="w-full bg-white border border-[#D6C9B5] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#A68A64] outline-none"
                      required 
                    />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#4A4036] mb-1.5">Expiry Date</label>
                  <input 
                    type="date" 
                    value={newPromo.expiresAt}
                    onChange={(e) => setNewPromo({...newPromo, expiresAt: e.target.value})}
                    className="w-full bg-white border border-[#D6C9B5] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#A68A64] outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 px-4 py-2.5 border border-[#A68A64] text-[#A68A64] rounded-lg font-bold hover:bg-[#A68A64]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2.5 bg-[#A68A64] text-white rounded-lg font-bold hover:bg-[#8e7555] transition-colors shadow-md"
                  >
                    Create
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

export default PromoDashboard;