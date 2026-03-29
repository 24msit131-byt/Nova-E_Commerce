import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartPie, FaBoxOpen, FaUsersCog, FaClipboardList, FaSignOutAlt, FaImages } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Nova Brand Palette
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        pageBg: '#FAF7F2',      // Warm Cream
        sectionBg: '#F2EBDD',   // Grounded Beige
        deepBg: '#2C2621',      // Deep Grounded Brown
        textMain: '#4A4036',    // Dark Brown
        textSecondary: '#756A5E', // Medium Brown
        accent: '#D6C9B5'       // Light Beige Borders
    };

    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie /> },
        { name: 'Manage Products', path: '/admin/products', icon: <FaBoxOpen /> },
        { name: 'Orders', path: '/admin/orders', icon: <FaClipboardList /> },
        { name: 'Users', path: '/admin/users', icon: <FaUsersCog /> },
        { name: 'banner', path: '/admin/banner', icon: <FaImages /> },
    ];

    /*const handleLogout = () => {
        // Clear auth data (assuming it's in localStorage)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        navigate('/login');
    };*/

    return (
        <div 
            className="w-64 h-screen border-r flex flex-col sticky top-0"
            style={{ backgroundColor: 'white', borderColor: colors.accent }}
        >
            {/* Logo Area */}
            <div className="p-8 flex items-center space-x-3 border-b" style={{ borderColor: 'rgba(214, 201, 181, 0.3)' }}>
                <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg rotate-3 transition-transform hover:rotate-0"
                    style={{ backgroundColor: colors.primary }}
                >
                    <span className="text-white font-serif italic text-xl font-black">N</span>
                </div>
                <span className="text-xl font-black tracking-tighter uppercase" style={{ color: colors.textMain }}>
                    Nova <span style={{ color: colors.primary }}>Admin</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-8">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center space-x-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${location.pathname === item.path
                            ? 'shadow-inner'
                            : 'hover:bg-slate-50'
                            }`}
                        style={{ 
                            backgroundColor: location.pathname === item.path ? colors.sectionBg : 'transparent',
                            color: location.pathname === item.path ? colors.primary : colors.textSecondary 
                        }}
                    >
                        <span className="text-lg opacity-70">{item.icon}</span>
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>

            {/* Optional Logout Area (Preserved as requested) */}
            {/* <div className="p-6 border-t" style={{ borderColor: colors.accent }}>
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-4 px-5 py-4 w-full text-[11px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-50 rounded-2xl transition-all"
                >
                    <FaSignOutAlt className="text-lg" />
                    <span>Logout</span>
                </button>
            </div>
            */}
            
            {/* Sidebar Branding Footer */}
            <div className="p-8">
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed text-center" style={{ borderColor: colors.accent }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: colors.textMain }}>Boutique Management</p>
                    <p className="text-[10px] font-black mt-1" style={{ color: colors.primary }}>v2.1 Sanctuary</p>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;