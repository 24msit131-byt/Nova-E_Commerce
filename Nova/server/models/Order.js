import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentGateway: {
        type: String,
        default: ''
    },
    razorpayOrderId: {
        type: String,
        default: ''
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    promoCode: {
        type: String,
        default: ''
    },
    promoDiscount: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing'
    },
    trackingId: {
        type: String,
        default: ''
    },
    adminNotes: {
        type: String,
        default: ''
    },
    returnRequest: {
        status: {
            type: String,
            enum: ['None', 'Requested', 'Approved', 'Rejected', 'Completed'],
            default: 'None'
        },
        reason: {
            type: String,
            default: ''
        },
        adminNote: {
            type: String,
            default: ''
        },
        requestedAt: {
            type: Date
        },
        processedAt: {
            type: Date
        }
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
