import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please provide a promo code'],
        unique: true,
        uppercase: true,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: [true, 'Please select a discount type'],
    },
    discountValue: {
        type: Number,
        required: [true, 'Please provide a discount value'],
        min: [0, 'Discount value cannot be negative'],
    },
    // Legacy display field retained for backward compatibility with existing data.
    discount: {
        type: String,
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

promoCodeSchema.pre('validate', function promoCodePreValidate() {
    if (this.discountType && Number.isFinite(Number(this.discountValue))) {
        const normalizedValue = Number(this.discountValue);
        this.discount = this.discountType === 'percentage'
            ? `${normalizedValue}%`
            : `₹${normalizedValue}`;
    }
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;
