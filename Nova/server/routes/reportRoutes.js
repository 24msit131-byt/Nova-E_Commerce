import express from 'express';
import { getDashboardStats, getRecentOrders, getInventoryReport, getUserRegistryReport } from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/stats', protect, requireAdmin, getDashboardStats);
router.get('/recent-orders', protect, requireAdmin, getRecentOrders);
router.get('/inventory', protect, requireAdmin, getInventoryReport);
router.get('/users', protect, requireAdmin, getUserRegistryReport);

export default router;
