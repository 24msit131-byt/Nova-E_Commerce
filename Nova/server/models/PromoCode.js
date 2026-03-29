import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please provide a promo code'],
        unique: true,
        uppercase: true,
        trim: true,
    },
    discount: {
        type: String,
        required: [true, 'Please provide a discount value (e.g., 20% or ₹100)'],
        trim: true,
    },
    usageLimit: {
        type: Number,
        default: 0, // 0 for unlimited
    },
    usageCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    expiresAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;
