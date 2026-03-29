import PromoCode from '../models/PromoCode.js';

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
        const { code, discount, usageLimit, expiresAt, status } = req.body;

        const promoCode = await PromoCode.create({
            code,
            discount,
            usageLimit,
            expiresAt,
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

        // Calculate discount
        let discountAmount = 0;
        const discountStr = promoCode.discount;

        if (discountStr.includes('%')) {
            const percentage = parseFloat(discountStr.replace('%', ''));
            discountAmount = (subtotal * percentage) / 100;
        } else {
            // Assume it's a fixed amount like ₹100 or 100
            const fixedAmount = parseFloat(discountStr.replace('₹', '').replace(',', ''));
            discountAmount = fixedAmount;
        }

        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        res.status(200).json({
            success: true,
            code: promoCode.code,
            discountAmount,
            discountType: discountStr.includes('%') ? 'percentage' : 'fixed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
