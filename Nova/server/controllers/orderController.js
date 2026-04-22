import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import PromoCode from '../models/PromoCode.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendOrderNotifications, sendOrderCancellationNotifications, sendReturnRequestNotifications, sendReturnDecisionNotifications } from '../utils/orderNotifications.js';

const rollbackStock = async (updatedItems) => {
    if (!updatedItems.length) return;

    await Product.bulkWrite(
        updatedItems.map((item) => ({
            updateOne: {
                filter: { _id: item.productId },
                update: { $inc: { stock: item.qty } }
            }
        }))
    );
};

const reserveStockForOrder = async (orderItems) => {
    const updatedItems = [];

    for (const item of orderItems) {
        const qty = Number(item.qty);

        if (!item.product || Number.isNaN(qty) || qty <= 0) {
            await rollbackStock(updatedItems);
            throw new Error(`Invalid order quantity for ${item.name || 'an item'}`);
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true }
        );

        if (!updatedProduct) {
            await rollbackStock(updatedItems);

            const existingProduct = await Product.findById(item.product).select('name');
            const productName = existingProduct?.name || item.name || 'Product';
            throw new Error(`${productName} is out of stock or has insufficient quantity`);
        }

        updatedItems.push({ productId: item.product, qty });
    }
};

const restoreStockForOrder = async (orderItems) => {
    const stockUpdates = [];

    for (const item of orderItems) {
        const qty = Number(item.qty);

        if (!item.product || Number.isNaN(qty) || qty <= 0) {
            continue;
        }

        stockUpdates.push({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: qty } }
            }
        });
    }

    if (stockUpdates.length) {
        await Product.bulkWrite(stockUpdates);
    }
};

const getRazorpayConfig = () => {
    const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (!keyId || !keySecret) {
        throw new Error('Razorpay is not configured on the server');
    }

    return { keyId, keySecret };
};

const createRazorpayClient = () => {
    const { keyId, keySecret } = getRazorpayConfig();

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
};

const verifyRazorpaySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const { keySecret } = getRazorpayConfig();

    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    return expectedSignature === razorpaySignature;
};

const incrementPromoUsage = async (promoCodeValue) => {
    if (!promoCodeValue) return;

    const promoCode = await PromoCode.findOne({ code: promoCodeValue.toUpperCase() });

    if (!promoCode) return;

    if (promoCode.status !== 'Active') return;

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) return;

    if (promoCode.usageLimit > 0 && promoCode.usageCount >= promoCode.usageLimit) {
        await PromoCode.updateOne(
            { _id: promoCode._id, status: 'Active' },
            { $set: { status: 'Inactive' } }
        );
        return;
    }

    const nextUsageCount = Number(promoCode.usageCount || 0) + 1;
    const update = { $inc: { usageCount: 1 } };

    if (promoCode.usageLimit > 0 && nextUsageCount >= promoCode.usageLimit) {
        update.$set = { status: 'Inactive' };
    }

    await PromoCode.updateOne(
        { _id: promoCode._id },
        update
    );
};

const getReturnRequestStatus = (order) => String(order?.returnRequest?.status || 'None');

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            taxPrice,
            shippingPrice,
            totalPrice,
            promoCode,
            promoDiscount
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No order items'
            });
        }

        await reserveStockForOrder(orderItems);

        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod,
            taxPrice,
            shippingPrice,
            promoCode: promoCode || '',
            promoDiscount: Number(promoDiscount || 0),
            totalPrice
        });

        let createdOrder;

        try {
            createdOrder = await order.save();
        } catch (error) {
            await restoreStockForOrder(orderItems);
            throw error;
        }

        try {
            await incrementPromoUsage(createdOrder.promoCode);
        } catch (promoError) {
            console.error('Failed to record promo usage for COD order:', promoError);
        }

        void sendOrderNotifications({ order: createdOrder, user: req.user });

        res.status(201).json({
            success: true,
            data: createdOrder
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create Razorpay payment order
// @route   POST /api/v1/orders/razorpay/create
// @access  Private
export const createRazorpayOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            taxPrice,
            shippingPrice,
            totalPrice,
            promoCode,
            promoDiscount
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No order items'
            });
        }

        const razorpayClient = createRazorpayClient();

        await reserveStockForOrder(orderItems);

        const pendingOrder = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod: 'Razorpay',
            paymentGateway: 'Razorpay',
            taxPrice,
            shippingPrice,
            promoCode: promoCode || '',
            promoDiscount: Number(promoDiscount || 0),
            totalPrice,
            isPaid: false,
            status: 'Processing'
        });

        let createdOrder;

        try {
            createdOrder = await pendingOrder.save();
        } catch (error) {
            await restoreStockForOrder(orderItems);
            throw error;
        }

        let razorpayOrder;

        try {
            razorpayOrder = await razorpayClient.orders.create({
                amount: Math.round(Number(totalPrice || 0) * 100),
                currency: 'INR',
                receipt: `order_${createdOrder._id}`,
                notes: {
                    orderId: String(createdOrder._id),
                    userId: String(req.user._id)
                }
            });
        } catch (error) {
            await restoreStockForOrder(orderItems);
            await Order.findByIdAndDelete(createdOrder._id);
            throw error;
        }

        createdOrder.razorpayOrderId = razorpayOrder.id;

        try {
            await createdOrder.save({ validateBeforeSave: false });
        } catch (error) {
            await restoreStockForOrder(orderItems);
            await Order.findByIdAndDelete(createdOrder._id);
            throw error;
        }

        res.status(201).json({
            success: true,
            data: {
                order: createdOrder,
                razorpayOrder,
                keyId: String(process.env.RAZORPAY_KEY_ID || '').trim()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/v1/orders/razorpay/verify
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            orderId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature
        } = req.body;

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Missing Razorpay payment details'
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (String(order.user) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to verify this order'
            });
        }

        if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
            return res.status(400).json({
                success: false,
                message: 'Razorpay order mismatch'
            });
        }

        if (!verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Razorpay payment signature'
            });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: razorpayPaymentId,
            status: 'captured',
            update_time: new Date().toISOString(),
            email_address: req.user.email
        };
        order.razorpayOrderId = razorpayOrderId;
        order.paymentMethod = 'Razorpay';

        await order.save();

        try {
            await incrementPromoUsage(order.promoCode);
        } catch (promoError) {
            console.error('Failed to record promo usage for Razorpay order:', promoError);
        }

        void sendOrderNotifications({ order, user: req.user });

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Cancel pending Razorpay payment order
// @route   POST /api/v1/orders/razorpay/cancel
// @access  Private
export const cancelRazorpayPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (String(order.user) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to cancel this order'
            });
        }

        if (order.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Paid orders cannot be cancelled here'
            });
        }

        order.status = 'Cancelled';
        await restoreStockForOrder(order.orderItems);
        await Order.findByIdAndDelete(order._id);

        void sendOrderCancellationNotifications({ order, user: req.user });

        res.status(200).json({
            success: true,
            message: 'Pending Razorpay order cancelled'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Cancel my order before delivery
// @route   POST /api/v1/orders/:id/cancel
// @access  Private
export const cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (String(order.user) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to cancel this order'
            });
        }

        if (order.isDelivered || String(order.status) === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'Delivered orders cannot be cancelled'
            });
        }

        if (String(order.status) === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This order is already cancelled'
            });
        }

        const cancelReason = String(req.body?.reason || '').trim();

        if (!cancelReason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a cancellation reason'
            });
        }

        await restoreStockForOrder(order.orderItems);

        order.status = 'Cancelled';
        order.cancelReason = cancelReason;
        order.cancelledAt = new Date();
        order.cancelledBy = 'user';

        await order.save();

        const customerUser = await User.findById(order.user).select('fullName email phoneNumber');
        void sendOrderCancellationNotifications({ order, user: customerUser || req.user });

        res.status(200).json({
            success: true,
            data: order,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Request order return
// @route   POST /api/v1/orders/:id/return-request
// @access  Private
export const requestOrderReturn = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (String(order.user) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to return this order'
            });
        }

        if (String(order.status) !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'You can request a return only after the order is delivered'
            });
        }

        const currentReturnStatus = getReturnRequestStatus(order);

        if (['Requested', 'Approved', 'Completed'].includes(currentReturnStatus)) {
            return res.status(400).json({
                success: false,
                message: 'A return request already exists for this order'
            });
        }

        const reason = String(req.body?.reason || '').trim();

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for the return request'
            });
        }

        order.returnRequest = {
            status: 'Requested',
            reason,
            adminNote: '',
            requestedAt: new Date(),
            processedAt: null
        };

        await order.save();

        const customerUser = await User.findById(order.user).select('fullName email phoneNumber');
        void sendReturnRequestNotifications({ order, user: customerUser || req.user });

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Review order return request
// @route   PATCH /api/v1/orders/:id/return-request
// @access  Private/Admin
export const updateOrderReturnRequest = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const status = String(req.body?.status || '').trim();
        const adminNote = String(req.body?.adminNote || '').trim();
        const currentReturnStatus = getReturnRequestStatus(order);

        if (!['Approved', 'Rejected', 'Completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid return request status'
            });
        }

        if (status === 'Completed') {
            if (currentReturnStatus !== 'Approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Return can only be marked completed after approval'
                });
            }

            order.returnRequest.status = 'Completed';
            order.returnRequest.adminNote = adminNote || order.returnRequest.adminNote;
            order.returnRequest.processedAt = new Date();
            order.status = 'Returned';

            await order.save();

            return res.status(200).json({
                success: true,
                data: order
            });
        }

        if (currentReturnStatus !== 'Requested') {
            return res.status(400).json({
                success: false,
                message: 'There is no pending return request to review'
            });
        }

        order.returnRequest.status = status;
        order.returnRequest.adminNote = adminNote;
        order.returnRequest.processedAt = new Date();

        await order.save();

        if (['Approved', 'Rejected'].includes(status)) {
            const customerUser = await User.findById(order.user).select('fullName email phoneNumber');
            void sendReturnDecisionNotifications({ order, user: customerUser || { email: '', fullName: '' }, decision: status });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get logged-in user's orders
// @route   GET /api/v1/orders/my
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('orderItems.product', 'name');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all orders for admin
// @route   GET /api/v1/orders/admin
// @access  Private/Admin
export const getAdminOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'fullName email');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order status
// @route   PATCH /api/v1/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const { status } = req.body;
        const previousStatus = order.status;

        if (previousStatus !== 'Cancelled' && status === 'Cancelled') {
            await restoreStockForOrder(order.orderItems);
        }

        order.status = status;

        if (status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            if (String(order.paymentMethod).toLowerCase() === 'cod') {
                order.isPaid = true;
                order.paidAt = Date.now();
            }
        } else if (status === 'Shipped') {
            order.isShipped = true;
            order.shippedAt = Date.now();
        }

        await order.save();

        if (previousStatus !== 'Cancelled' && status === 'Cancelled') {
            const customerUser = await User.findById(order.user).select('fullName email phoneNumber');
            void sendOrderCancellationNotifications({ order, user: customerUser || { email: '', fullName: '' } });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order details (trackingId, adminNotes)
// @route   PATCH /api/v1/orders/:id/details
// @access  Private/Admin
export const updateOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const { trackingId, adminNotes } = req.body;

        if (trackingId !== undefined) order.trackingId = trackingId;
        if (adminNotes !== undefined) order.adminNotes = adminNotes;

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private/Admin
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'fullName email phoneNumber');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
