import PromoCode from '../models/PromoCode.js';

const parseLegacyDiscount = (discount) => {
    const raw = String(discount || '').trim();

    if (!raw) {
        return null;
    }

    if (raw.includes('%')) {
        const value = Number.parseFloat(raw.replace('%', '').trim());
        if (Number.isFinite(value) && value >= 0) {
            return { discountType: 'percentage', discountValue: value };
        }
        return null;
    }

    const value = Number.parseFloat(raw.replace('₹', '').replace(/,/g, '').trim());
    if (Number.isFinite(value) && value >= 0) {
        return { discountType: 'fixed', discountValue: value };
    }

    return null;
};

const formatDiscount = (discountType, discountValue) => {
    return discountType === 'percentage'
        ? `${discountValue}%`
        : `₹${discountValue}`;
};

const getPromoDiscountMeta = (promoCode) => {
    let discountType = promoCode.discountType;
    let discountValue = Number(promoCode.discountValue);

    if (!discountType || !Number.isFinite(discountValue)) {
        const parsed = parseLegacyDiscount(promoCode.discount);
        if (parsed) {
            discountType = parsed.discountType;
            discountValue = parsed.discountValue;
        }
    }

    if (!discountType || !Number.isFinite(discountValue)) {
        return null;
    }

    return {
        discountType,
        discountValue,
        discountDisplay: formatDiscount(discountType, discountValue)
    };
};

const calculateDiscountAmount = (subtotal, discountType, discountValue) => {
    const subtotalNumber = Number(subtotal);
    const safeSubtotal = Number.isFinite(subtotalNumber) && subtotalNumber > 0 ? subtotalNumber : 0;

    if (safeSubtotal === 0) {
        return 0;
    }

    let discountAmount = discountType === 'percentage'
        ? (safeSubtotal * discountValue) / 100
        : discountValue;

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
        discountAmount = 0;
    }

    return Math.min(discountAmount, safeSubtotal);
};

const deactivateExpiredPromoCodes = async () => {
    const now = new Date();

    await PromoCode.updateMany(
        {
            status: 'Active',
            expiresAt: { $ne: null, $lt: now }
        },
        {
            $set: { status: 'Inactive' }
        }
    );
};

// @desc    Get all promo codes
// @route   GET /api/v1/promos
// @access  Private/Admin
export const getAllPromoCodes = async (req, res) => {
    try {
        await deactivateExpiredPromoCodes();

        const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
        
        // Calculate stats
        const activeCount = await PromoCode.countDocuments({ status: 'Active' });
        
        // Mock revenue for now as it would require Order model integration
        const totalRevenue = 45200; // This should ideally be calculated from orders using promos

        res.status(200).json({
            success: true,
            count: promoCodes.length,
            activeCount,
            totalRevenue,
            data: promoCodes
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create promo code
// @route   POST /api/v1/promos
// @access  Private/Admin
export const createPromoCode = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            discount,
            usageLimit,
            expiresAt,
            status
        } = req.body;

        let normalizedType = discountType;
        let normalizedValue = Number(discountValue);

        if (!normalizedType || !Number.isFinite(normalizedValue)) {
            const parsedLegacy = parseLegacyDiscount(discount);
            if (parsedLegacy) {
                normalizedType = parsedLegacy.discountType;
                normalizedValue = parsedLegacy.discountValue;
            }
        }

        if (!['percentage', 'fixed'].includes(normalizedType) || !Number.isFinite(normalizedValue) || normalizedValue < 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid discount type and value'
            });
        }

        const normalizedUsageLimit = Number.isFinite(Number(usageLimit)) ? Math.max(Number(usageLimit), 0) : 0;
        const normalizedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;

        if (normalizedExpiresAt && Number.isNaN(normalizedExpiresAt.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid expiry date'
            });
        }

        const promoCode = await PromoCode.create({
            code,
            discountType: normalizedType,
            discountValue: normalizedValue,
            discount: formatDiscount(normalizedType, normalizedValue),
            usageLimit: normalizedUsageLimit,
            expiresAt: normalizedExpiresAt,
            status
        });

        res.status(201).json({
            success: true,
            data: promoCode
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete promo code
// @route   DELETE /api/v1/promos/:id
// @access  Private/Admin
export const deletePromoCode = async (req, res) => {
    try {
        const promoCode = await PromoCode.findByIdAndDelete(req.params.id);

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Promo code not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Promo code deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update promo code status
// @route   PATCH /api/v1/promos/:id
// @access  Private/Admin
export const updatePromoCodeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const promoCode = await PromoCode.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Promo code not found'
            });
        }

        res.status(200).json({
            success: true,
            data: promoCode
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Validate promo code
// @route   POST /api/v1/promos/validate
// @access  Private
export const validatePromoCode = async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a promo code'
            });
        }

        const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid promo code'
            });
        }

        if (promoCode.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'This promo code is no longer active'
            });
        }

        if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
            promoCode.status = 'Inactive';
            await promoCode.save({ validateBeforeSave: false });

            return res.status(400).json({
                success: false,
                message: 'This promo code has expired'
            });
        }

        if (promoCode.usageLimit > 0 && promoCode.usageCount >= promoCode.usageLimit) {
            if (promoCode.status !== 'Inactive') {
                promoCode.status = 'Inactive';
                await promoCode.save({ validateBeforeSave: false });
            }

            return res.status(400).json({
                success: false,
                message: 'This promo code has reached its usage limit'
            });
        }

        const discountMeta = getPromoDiscountMeta(promoCode);

        if (!discountMeta) {
            return res.status(400).json({
                success: false,
                message: 'Promo code discount configuration is invalid'
            });
        }

        const { discountType, discountValue, discountDisplay } = discountMeta;
        const discountAmount = calculateDiscountAmount(subtotal, discountType, discountValue);

        res.status(200).json({
            success: true,
            code: promoCode.code,
            discountAmount,
            discountType,
            discountValue,
            discountDisplay
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
