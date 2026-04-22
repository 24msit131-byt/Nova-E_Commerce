import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const createReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body;
        const userId = req.user._id;

        // Validation
        if (!rating || !comment || !productId) {
            return res.status(400).json({
                success: false,
                message: "Rating, comment, and productId are required."
            });
        }

        // Check if product exists
        const isValidProduct = await Product.findById(productId);
        if (!isValidProduct) {
            return res.status(404).json({
                success: false,
                message: `No product found with id: ${productId}`
            });
        }

        // Check if user has already reviewed the product
        const alreadySubmitted = await Review.findOne({
            product: productId,
            user: userId,
        });

        if (alreadySubmitted) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted a review for this product."
            });
        }

        // Check if the user has purchased the product AND it is delivered
        // Verify via Orders collection
        const hasDeliveredOrder = await Order.findOne({
            user: userId,
            status: 'Delivered',
            'orderItems.product': productId
        });

        if (!hasDeliveredOrder) {
            return res.status(403).json({
                success: false,
                message: "You must have a delivered order of this product to leave a review."
            });
        }

        const review = await Review.create({
            rating,
            comment,
            product: productId,
            user: userId,
        });

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: review,
        });

    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while creating review'
        });
    }
};

export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        // Optional: Ensure product exists
        const reviews = await Review.find({ product: productId }).populate('user', 'fullName email');

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } catch (error) {
        console.error('Get Product Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while fetching reviews'
        });
    }
};

export const getAllReviewsAdmin = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'fullName email')
            .populate('product', 'name category price rating reviews images')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while fetching reviews',
        });
    }
};

export const updateReviewAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        if (rating !== undefined) {
            const nextRating = Number(rating);
            if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5',
                });
            }
            review.rating = nextRating;
        }

        if (comment !== undefined) {
            review.comment = String(comment).trim();
        }

        await review.save();
        await Review.calculateAverageRating(review.product);

        const updatedReview = await Review.findById(id)
            .populate('user', 'fullName email')
            .populate('product', 'name category price rating reviews images');

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: updatedReview,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while updating review',
        });
    }
};

export const deleteReviewAdmin = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        const productId = review.product;
        await review.deleteOne();
        await Review.calculateAverageRating(productId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while deleting review',
        });
    }
};
