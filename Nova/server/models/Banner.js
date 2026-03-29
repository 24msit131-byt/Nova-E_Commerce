import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        default: 'Pure solutions for a spotless sanctuary.'
    },
    subtitle: {
        type: String,
        trim: true,
        default: 'Nova brings the art of curation to home care. Elevate your living space with eco-conscious products designed for performance and peace of mind.'
    },
    link: {
        type: String,
        trim: true,
        default: '/products'
    },
    imageUrl: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
