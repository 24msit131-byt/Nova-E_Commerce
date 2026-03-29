import express from 'express';
import { createReview, getProductReviews } from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createReview);

router.route('/:productId')
    .get(getProductReviews);

export default router;
