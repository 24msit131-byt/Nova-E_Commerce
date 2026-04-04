import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import * as XLSX from 'xlsx';

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const TREND_PERIODS = new Set(['weekly', 'monthly', 'yearly']);
const REVENUE_OVERVIEW_PERIODS = new Set(['weekly', 'monthly', 'yearly']);

const padTwoDigits = (value) => String(value).padStart(2, '0');

const buildMonthlyRevenueOverview = (year) => {
    const buckets = Array.from({ length: 12 }, (_, index) => {
        const currentDate = new Date(year, index, 1);

        return {
            key: `${year}-${padTwoDigits(index + 1)}`,
            label: currentDate.toLocaleDateString('en-IN', { month: 'short' })
        };
    });

    return {
        year,
        buckets,
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59, 999),
        groupBy: 'month'
    };
};

const buildDailyRevenueOverview = (endDate, dayCount) => {
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const startDate = new Date(rangeEnd);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (dayCount - 1));

    const buckets = Array.from({ length: dayCount }, (_, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + index);

        return {
            key: `${currentDate.getFullYear()}-${padTwoDigits(currentDate.getMonth() + 1)}-${padTwoDigits(currentDate.getDate())}`,
            label: currentDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            })
        };
    });

    return {
        startDate,
        endDate: rangeEnd,
        buckets,
        groupBy: 'day'
    };
};

const buildRevenueOverviewConfig = (period) => {
    const normalizedPeriod = REVENUE_OVERVIEW_PERIODS.has(period) ? period : 'yearly';

    if (normalizedPeriod === 'yearly') {
        const currentYear = new Date().getFullYear();

        return {
            period: normalizedPeriod,
            currentLabel: String(currentYear),
            previousLabel: String(currentYear - 1),
            subtitle: 'Monthly revenue compared to previous year',
            currentRange: buildMonthlyRevenueOverview(currentYear),
            previousRange: buildMonthlyRevenueOverview(currentYear - 1),
        };
    }

    const dayCount = normalizedPeriod === 'monthly' ? 30 : 7;
    const currentRange = buildDailyRevenueOverview(new Date(), dayCount);
    const previousRange = buildDailyRevenueOverview(new Date(currentRange.startDate.getTime() - 1), dayCount);

    return {
        period: normalizedPeriod,
        currentLabel: normalizedPeriod === 'monthly' ? 'Last 30 days' : 'Last 7 days',
        previousLabel: normalizedPeriod === 'monthly' ? 'Previous 30 days' : 'Previous 7 days',
        subtitle: normalizedPeriod === 'monthly'
            ? 'Daily revenue compared to previous 30 days'
            : 'Daily revenue compared to previous 7 days',
        currentRange,
        previousRange,
    };
};

const aggregateRevenueSeries = async (range) => {
    const groupStage = range.groupBy === 'month'
        ? {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$totalPrice' }
        }
        : {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$totalPrice' }
        };

    const groupedOrders = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: range.startDate,
                    $lte: range.endDate
                },
                $or: [
                    { isPaid: true },
                    { paymentMethod: { $regex: /^cod$/i }, isDelivered: true }
                ]
            }
        },
        {
            $group: groupStage
        }
    ]);

    const revenueMap = new Map(
        groupedOrders.map((entry) => {
            const { year, month, day } = entry._id;
            const key = range.groupBy === 'month'
                ? `${year}-${padTwoDigits(month)}`
                : `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`;

            return [key, entry.revenue || 0];
        })
    );

    const series = range.buckets.map((bucket) => ({
        label: bucket.label,
        value: revenueMap.get(bucket.key) || 0
    }));

    const totalRevenue = series.reduce((sum, item) => sum + item.value, 0);

    return { series, totalRevenue };
};

const buildOrderTrendBuckets = (period) => {
    const normalizedPeriod = TREND_PERIODS.has(period) ? period : 'weekly';
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (normalizedPeriod === 'yearly') {
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);
        const buckets = Array.from({ length: 12 }, (_, index) => {
            const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
            return {
                key: `${currentDate.getFullYear()}-${padTwoDigits(currentDate.getMonth() + 1)}`,
                label: currentDate.toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric'
                })
            };
        });

        return {
            startDate,
            endDate,
            buckets,
            groupBy: 'month'
        };
    }

    const dayCount = normalizedPeriod === 'monthly' ? 30 : 7;
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (dayCount - 1));

    const buckets = Array.from({ length: dayCount }, (_, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + index);

        return {
            key: `${currentDate.getFullYear()}-${padTwoDigits(currentDate.getMonth() + 1)}-${padTwoDigits(currentDate.getDate())}`,
            label: currentDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            })
        };
    });

    return {
        startDate,
        endDate,
        buckets,
        groupBy: 'day'
    };
};

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

// @desc    Get order trend data for dashboard charts
// @route   GET /api/v1/reports/order-trends
// @access  Private/Admin
export const getOrderTrendReport = async (req, res) => {
    try {
        const requestedPeriod = String(req.query.period || 'weekly').toLowerCase();
        const period = TREND_PERIODS.has(requestedPeriod) ? requestedPeriod : 'weekly';
        const { startDate, endDate, buckets, groupBy } = buildOrderTrendBuckets(period);

        const groupStage = groupBy === 'month'
            ? {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
            : {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
            };

        const groupedOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: groupStage
            }
        ]);

        const countMap = new Map(
            groupedOrders.map((entry) => {
                const { year, month, day } = entry._id;
                const key = groupBy === 'month'
                    ? `${year}-${padTwoDigits(month)}`
                    : `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`;

                return [key, entry.count];
            })
        );

        const series = buckets.map((bucket) => ({
            label: bucket.label,
            value: countMap.get(bucket.key) || 0
        }));

        const totalOrders = series.reduce((sum, item) => sum + item.value, 0);

        res.status(200).json({
            success: true,
            data: {
                period,
                totalOrders,
                series
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get revenue trend data for dashboard charts
// @route   GET /api/v1/reports/revenue-trends
// @access  Private/Admin
export const getRevenueTrendReport = async (req, res) => {
    try {
        const requestedPeriod = String(req.query.period || 'weekly').toLowerCase();
        const period = TREND_PERIODS.has(requestedPeriod) ? requestedPeriod : 'weekly';
        const { startDate, endDate, buckets, groupBy } = buildOrderTrendBuckets(period);

        const revenueMatch = {
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },
            $or: [
                { isPaid: true },
                { paymentMethod: { $regex: /^cod$/i }, isDelivered: true }
            ]
        };

        const groupStage = groupBy === 'month'
            ? {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                revenue: { $sum: '$totalPrice' }
            }
            : {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                revenue: { $sum: '$totalPrice' }
            };

        const groupedOrders = await Order.aggregate([
            {
                $match: revenueMatch
            },
            {
                $group: groupStage
            }
        ]);

        const revenueMap = new Map(
            groupedOrders.map((entry) => {
                const { year, month, day } = entry._id;
                const key = groupBy === 'month'
                    ? `${year}-${padTwoDigits(month)}`
                    : `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`;

                return [key, entry.revenue || 0];
            })
        );

        const series = buckets.map((bucket) => ({
            label: bucket.label,
            value: revenueMap.get(bucket.key) || 0
        }));

        const totalRevenue = series.reduce((sum, item) => sum + item.value, 0);

        res.status(200).json({
            success: true,
            data: {
                period,
                totalRevenue,
                series
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get revenue overview comparison chart
// @route   GET /api/v1/reports/revenue-overview
// @access  Private/Admin
export const getRevenueOverviewReport = async (req, res) => {
    try {
        const requestedPeriod = String(req.query.period || 'yearly').toLowerCase();
        const config = buildRevenueOverviewConfig(requestedPeriod);

        const currentRevenueSeries = await aggregateRevenueSeries(config.currentRange);
        const comparisonRevenueSeries = await aggregateRevenueSeries(config.previousRange);

        res.status(200).json({
            success: true,
            data: {
                period: config.period,
                currentLabel: config.currentLabel,
                previousLabel: config.previousLabel,
                subtitle: config.subtitle,
                labels: config.currentRange.buckets.map((bucket) => bucket.label),
                currentSeries: currentRevenueSeries.series,
                comparisonSeries: comparisonRevenueSeries.series,
                totals: {
                    currentRevenue: currentRevenueSeries.totalRevenue,
                    previousRevenue: comparisonRevenueSeries.totalRevenue
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
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
