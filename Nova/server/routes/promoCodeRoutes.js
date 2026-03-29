import express from 'express';
import { getAllPromoCodes, createPromoCode, deletePromoCode, updatePromoCodeStatus, validatePromoCode } from '../controllers/promoCodeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, requireAdmin, getAllPromoCodes)
    .post(protect, requireAdmin, createPromoCode);

router.route('/:id')
    .delete(protect, requireAdmin, deletePromoCode)
    .patch(protect, requireAdmin, updatePromoCodeStatus);

router.post('/validate', protect, validatePromoCode);

export default router;
