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

          if (usageLimit <= 0) {
            return sum;
          }

          return sum + Math.max(usageLimit - usageCount, 0);
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
      console.error('Error fetching promo codes:', error);
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: '',
    usageLimit: 0,
    expiresAt: '',
    status: 'Active'
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/promos', newPromo);
      if (response.data.success) {
        toast.success('Promo code created successfully');
        setIsModalOpen(false);
        setNewPromo({ code: '', discount: '', usageLimit: 0, expiresAt: '', status: 'Active' });
        fetchPromoCodes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create promo code');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar />
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Nova Dashboard / Management</p>
            <h2 style={styles.title}>Promo Code Management</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={styles.addButton}
          >
            + Create New Code
          </button>
        </header>

        {/* Quick Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Active Coupons</p>
            <h3 style={styles.statValue}>{stats.activeCount}</h3>
          </div>    
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Coupons Used</p>
            <h3 style={styles.statValue}>{stats.couponsUsed}</h3>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Coupons Remaining</p>
            <h3 style={styles.statValue}>{stats.couponsRemaining}</h3>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Coupons</p>
            <h3 style={styles.statValue}>{stats.totalCoupons}</h3>
          </div>
        </div>

        {/* Promo Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Usages</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.length > 0 ? (
                  promoCodes.map((item) => {
                    const usageCount = Number(item.usageCount || 0);
                    const usageLimit = Number(item.usageLimit || 0);
                    const availableCount = usageLimit > 0 ? Math.max(usageLimit - usageCount, 0) : 'Unlimited';
                    const isLimitReached = usageLimit > 0 && usageCount >= usageLimit;
                    const displayStatus = isLimitReached ? 'Inactive' : item.status;

                    return (
                      <tr key={item._id} style={styles.tableRow}>
                        <td style={styles.codeText}>{item.code}</td>
                        <td>{item.discount}</td>
                        <td>
                          <div style={styles.usageValue}>{usageCount}</div>
                          <div style={styles.usageMeta}>Times used by customers</div>
                        </td>
                        <td>
                          <div style={styles.usageValue}>{availableCount}</div>
                          <div style={styles.usageMeta}>Remaining coupon slots</div>
                        </td>
                        <td>
                          <span
                            onClick={() => !isLimitReached && toggleStatus(item._id, item.status)}
                            style={{
                              ...(displayStatus === 'Active' ? styles.statusActive : styles.statusInactive),
                              cursor: isLimitReached ? 'not-allowed' : 'pointer',
                              opacity: isLimitReached ? 0.8 : 1
                            }}
                          >
                            {displayStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleDelete(item._id)}
                              style={{ ...styles.editBtn, color: '#ef4444' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No promo codes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for Creating New Promo Code */}
        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Create New Promo Code</h3>
              <form onSubmit={handleCreate}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Promo Code</label>
                  <input 
                    type="text" 
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({...newPromo, code: e.target.value})}
                    style={styles.input} 
                    required 
                    placeholder="e.g. SUMMER25"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Discount (e.g. 20% or ₹100)</label>
                  <input 
                    type="text" 
                    value={newPromo.discount}
                    onChange={(e) => setNewPromo({...newPromo, discount: e.target.value})}
                    style={styles.input} 
                    required 
                    placeholder="20%"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Usage Limit (0 for unlimited)</label>
                  <input 
                    type="number" 
                    value={newPromo.usageLimit}
                    onChange={(e) => setNewPromo({...newPromo, usageLimit: parseInt(e.target.value)})}
                    style={styles.input} 
                    required 
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Expiry Date</label>
                  <input 
                    type="date" 
                    value={newPromo.expiresAt}
                    onChange={(e) => setNewPromo({...newPromo, expiresAt: e.target.value})}
                    style={styles.input} 
                  />
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" style={styles.submitBtn}>Create Code</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { flex: 1, padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '16px' },
  kicker: { color: '#A68A64', fontSize: '10px', fontWeight: '800', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' },
  title: { fontSize: '24px', color: '#111827', fontWeight: '600' },
  addButton: { backgroundColor: '#3EB489', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' },
  statLabel: { color: '#6b7280', fontSize: '14px', marginBottom: '8px' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#111827' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeader: { backgroundColor: '#f3f4f6', color: '#374151', fontSize: '14px', height: '50px' },
  tableRow: { borderBottom: '1px solid #f3f4f6', height: '60px' },
  codeText: { fontWeight: 'bold', color: '#3EB489' },
  usageValue: { fontWeight: '800', color: '#111827' },
  usageMeta: { marginTop: '4px', fontSize: '12px', color: '#6b7280' },
  statusActive: { padding: '4px 10px', backgroundColor: '#def7ec', color: '#03543f', borderRadius: '12px', fontSize: '12px' },
  statusInactive: { padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#6b7280', borderRadius: '12px', fontSize: '12px' },
  editBtn: { background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', textDecoration: 'underline' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  modalTitle: { marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#111827' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', fontSize: '14px', color: '#374151', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  cancelBtn: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' },
  submitBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3EB489', color: '#fff', cursor: 'pointer', fontWeight: '500' }
};

export default PromoDashboard;