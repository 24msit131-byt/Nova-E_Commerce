import express from 'express';
import { createReview, deleteReviewAdmin, getAllReviewsAdmin, getProductReviews, updateReviewAdmin } from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createReview);

router.route('/admin')
    .get(protect, requireAdmin, getAllReviewsAdmin);

router.route('/admin/:id')
    .put(protect, requireAdmin, updateReviewAdmin)
    .delete(protect, requireAdmin, deleteReviewAdmin);

router.route('/:productId')
    .get(getProductReviews);

export default router;
