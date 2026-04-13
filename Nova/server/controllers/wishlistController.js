import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

const getOrCreateWishlist = async (userId) => {
    let wishlist = await Wishlist.findOne({ user: userId }).populate('products');

    if (!wishlist) {
        wishlist = await Wishlist.create({ user: userId, products: [] });
        wishlist = await Wishlist.findById(wishlist._id).populate('products');
    }

    return wishlist;
};

export const getWishlist = async (req, res) => {
    try {
        const wishlist = await getOrCreateWishlist(req.user.id);

        res.status(200).json({
            status: 'success',
            data: { wishlist }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Product id is required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                status: 'fail',
                message: 'Product not found'
            });
        }

        let wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user.id, products: [] });
        }

        wishlist.products.addToSet(productId);
        await wishlist.save();

        wishlist = await Wishlist.findById(wishlist._id).populate('products');

        res.status(200).json({
            status: 'success',
            message: 'Product saved to wishlist',
            data: { wishlist }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        let wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user.id, products: [] });
        }

        wishlist.products = wishlist.products.filter((item) => item.toString() !== productId);
        await wishlist.save();

        wishlist = await Wishlist.findById(wishlist._id).populate('products');

        res.status(200).json({
            status: 'success',
            message: 'Product removed from wishlist',
            data: { wishlist }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};