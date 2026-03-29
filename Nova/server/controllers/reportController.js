import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import * as XLSX from 'xlsx';

// @desc    Get dashboard stats
// @route   GET /api/v1/reports/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
        const [totalOrders, totalProducts, totalUsers, revenueOrders] = await Promise.all([
            Order.countDocuments(),
            Product.countDocuments(),
            User.countDocuments({}),
            Order.find({
                $or: [
                    { isPaid: true },
                    { paymentMethod: { $regex: /^cod$/i }, isDelivered: true }
                ]
            }).select('totalPrice'),
        ]);

        const totalRevenue = revenueOrders.reduce((acc, order) => acc + order.totalPrice, 0);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
                totalOrders,
                activeUsers: totalUsers,
                totalProducts,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get recent orders
// @route   GET /api/v1/reports/recent-orders
// @access  Private/Admin
export const getRecentOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'fullName email')
            .populate('orderItems.product', 'name');

        res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc    Get inventory report (CSV)
// @route   GET /api/v1/reports/inventory
// @access  Private/Admin
export const getInventoryReport = async (req, res) => {
    try {
        const { category, lowStock, startDate, endDate, search } = req.query;

        let query = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        if (lowStock === 'true') {
            query.stock = { $lt: 20 }; // Example threshold for low stock
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const products = await Product.find(query).sort({ name: 1 });

        // Generate XLSX using sheet_to_json approach or manual AOA
        const data = products.map(p => ({
            'Product ID': p._id.toString(),
            'Name': p.name,
            'Category': p.category,
            'Price': p.price,
            'Stock': p.stock,
            'Status': p.status,
            'Created At': new Date(p.createdAt).toLocaleDateString('en-IN')
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

        // Write to buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory.xlsx');
        res.status(200).send(buffer);

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get user registry report (CSV)
// @route   GET /api/v1/reports/users
// @access  Private/Admin
export const getUserRegistryReport = async (req, res) => {
    try {
        const { role, startDate, endDate, status } = req.query;

        let userQuery = {};
        let adminQuery = {};

        // Date Range Filter
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
            userQuery.createdAt = dateFilter;
            adminQuery.createdAt = dateFilter;
        }

        // Role Filter logic
        let includeUsers = true;
        let includeAdmins = true;

        if (role === 'admin') {
            includeUsers = false;
        } else if (role === 'user') {
            includeAdmins = false;
        }

        let combinedData = [];

        if (includeAdmins) {
            const admins = await Admin.find(adminQuery).sort({ createdAt: -1 });
            combinedData.push(...admins.map(a => ({ ...a._doc, sourceRole: 'Admin' })));
        }

        if (includeUsers) {
            const users = await User.find(userQuery).sort({ createdAt: -1 });
            combinedData.push(...users.map(u => ({ ...u._doc, sourceRole: u.role === 'admin' ? 'Admin' : 'User' })));
        }

        // Apply Role filter to combined data (since some Users might have admin role)
        if (role === 'admin') {
            combinedData = combinedData.filter(u => u.sourceRole === 'Admin');
        } else if (role === 'user') {
            combinedData = combinedData.filter(u => u.sourceRole === 'User');
        }

        // Status Filter (Note: Status is not currently in DB, we default to 'Active')
        if (status && status !== 'All') {
            // Placeholder: All are 'Active' for now
            if (status === 'Archive') {
                combinedData = [];
            }
        }

        // Sort by joined date
        combinedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Generate XLSX
        const data = combinedData.map(u => ({
            'User ID': u._id.toString(),
            'Full Name': u.fullName || '',
            'Email': u.email || '',
            'Role': u.sourceRole,
            'Phone': u.phoneNumber || '',
            'Address': u.addressLine || '',
            'City': u.city || '',
            'District': u.district || '',
            'State': u.state || '',
            'Pincode': u.pincode || '',
            'Status': 'Active',
            'Joined Date': new Date(u.createdAt).toLocaleDateString('en-IN')
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "User Registry");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users_registry.xlsx');
        res.status(200).send(buffer);

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
