import express from 'express';
import { createOrder, createRazorpayOrder, cancelRazorpayPayment, cancelMyOrder, verifyRazorpayPayment, getAdminOrders, getMyOrders, getOrderById, updateOrderStatus, updateOrderDetails, requestOrderReturn, updateOrderReturnRequest } from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.post('/razorpay/create', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/razorpay/cancel', protect, cancelRazorpayPayment);
router.post('/:id/cancel', protect, cancelMyOrder);
router.post('/:id/return-request', protect, requestOrderReturn);
router.get('/my', protect, getMyOrders);
router.get('/admin', protect, requireAdmin, getAdminOrders);
router.get('/:id', protect, requireAdmin, getOrderById);
router.patch('/:id/status', protect, requireAdmin, updateOrderStatus);
router.patch('/:id/details', protect, requireAdmin, updateOrderDetails);
router.patch('/:id/return-request', protect, requireAdmin, updateOrderReturnRequest);

export default router;
