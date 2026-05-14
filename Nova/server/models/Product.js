import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide product name'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please provide product category'],
        trim: true
    },
    packSize: {
        type: String,
        trim: true,
        default: ''
    },
    price: {
        type: Number,
        required: [true, 'Please provide product price'],
        default: 0
    },
    stock: {
        type: Number,
        required: [true, 'Please provide product stock'],
        default: 0
    },
    description: {
        type: String,
        required: [true, 'Please provide product description']
    },
    status: {
        type: String,
        enum: ['Active', 'Draft'],
        default: 'Active'
    },
    images: {
        type: [String],
        default: []
    },
    rating: {
        type: Number,
        default: 0
    },
    reviews: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
