import Order from '../models/Order.js';
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

// @desc    Get orders report with full details
// @route   GET /api/v1/reports/orders
// @access  Private/Admin
export const getOrdersReport = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'fullName email phoneNumber')
            .populate('orderItems.product', 'name category');

        const orderRows = orders.map((order) => ({
            'Order ID': order._id.toString(),
            'Customer Name': order.user?.fullName || '',
            'Customer Email': order.user?.email || '',
            'Customer Phone': order.user?.phoneNumber || '',
            'Order Status': order.status || '',
            'Return Status': order.returnRequest?.status || 'None',
            'Return Reason': order.returnRequest?.reason || '',
            'Return Admin Note': order.returnRequest?.adminNote || '',
            'Placed At': formatDate(order.createdAt),
            'Paid At': formatDate(order.paidAt),
            'Delivered At': formatDate(order.deliveredAt),
            'Payment Method': order.paymentMethod || '',
            'Payment Gateway': order.paymentGateway || '',
            'Paid': order.isPaid ? 'Yes' : 'No',
            'Delivered': order.isDelivered ? 'Yes' : 'No',
            'Tracking ID': order.trackingId || '',
            'Shipping Address': order.shippingAddress?.address || '',
            'Shipping City': order.shippingAddress?.city || '',
            'Postal Code': order.shippingAddress?.postalCode || '',
            'Country': order.shippingAddress?.country || '',
            'Subtotal': Number((Number(order.totalPrice || 0) - Number(order.taxPrice || 0) - Number(order.shippingPrice || 0)).toFixed(2)),
            'Tax': Number(Number(order.taxPrice || 0).toFixed(2)),
            'Shipping': Number(Number(order.shippingPrice || 0).toFixed(2)),
            'Promo Code': order.promoCode || '',
            'Promo Discount': Number(Number(order.promoDiscount || 0).toFixed(2)),
            'Total': Number(Number(order.totalPrice || 0).toFixed(2)),
            'Item Count': order.orderItems?.length || 0,
            'Items Summary': (order.orderItems || []).map((item) => `${item.name} x${item.qty}`).join(' | ')
        }));

        const itemRows = orders.flatMap((order) => (order.orderItems || []).map((item, index) => ({
            'Order ID': order._id.toString(),
            'Order Item #': index + 1,
            'Customer Name': order.user?.fullName || '',
            'Customer Email': order.user?.email || '',
            'Customer Phone': order.user?.phoneNumber || '',
            'Product ID': item.product?._id?.toString() || item.product?.toString?.() || '',
            'Product Name': item.name || '',
            'Category': item.product?.category || '',
            'Quantity': item.qty || 0,
            'Unit Price': Number(Number(item.price || 0).toFixed(2)),
            'Line Total': Number(Number((item.price || 0) * (item.qty || 0)).toFixed(2)),
            'Order Status': order.status || '',
            'Return Status': order.returnRequest?.status || 'None',
            'Tracking ID': order.trackingId || '',
            'Ordered At': formatDate(order.createdAt)
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orderRows), 'Orders');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(itemRows), 'Order Items');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=orders_report.xlsx');
        res.status(200).send(buffer);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};