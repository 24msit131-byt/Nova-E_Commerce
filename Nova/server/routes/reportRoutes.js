import express from 'express';
import { getDashboardStats, getRecentOrders, getOrderTrendReport, getRevenueTrendReport, getRevenueOverviewReport, getInventoryReport, getUserRegistryReport } from '../controllers/reportController.js';
import { getOrdersReport } from '../controllers/ordersReportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/stats', protect, requireAdmin, getDashboardStats);
router.get('/recent-orders', protect, requireAdmin, getRecentOrders);
router.get('/order-trends', protect, requireAdmin, getOrderTrendReport);
router.get('/revenue-trends', protect, requireAdmin, getRevenueTrendReport);
router.get('/revenue-overview', protect, requireAdmin, getRevenueOverviewReport);
router.get('/orders', protect, requireAdmin, getOrdersReport);
router.get('/inventory', protect, requireAdmin, getInventoryReport);
router.get('/users', protect, requireAdmin, getUserRegistryReport);

export default router;
