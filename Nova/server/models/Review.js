import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: [true, 'Please provide a rating'],
        },
        comment: {
            type: String,
            required: [true, 'Please provide review text'],
            maxlength: 1000,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
    },
    { timestamps: true }
);

// Ensure that a user can only leave one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// We can add a static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function (productId) {
    const result = await this.aggregate([
        {
            $match: { product: productId },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 },
            },
        },
    ]);

    try {
        await this.model('Product').findOneAndUpdate(
            { _id: productId },
            {
                rating: Math.ceil((result[0]?.averageRating || 0) * 10) / 10,
                reviews: result[0]?.numOfReviews || 0,
            }
        );
    } catch (error) {
        console.error(error);
    }
};

reviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.product);
});

reviewSchema.post('remove', async function () {
    await this.constructor.calculateAverageRating(this.product);
});

export default mongoose.model('Review', reviewSchema);
