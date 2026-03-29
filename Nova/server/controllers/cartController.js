import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Get user's cart
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        res.status(200).json({
            status: 'success',
            data: { cart }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // 1. Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                status: 'fail',
                message: 'Product not found'
            });
        }

        // 2. Find user's cart or create one
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        // 3. Check if product already in cart
        const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

        if (itemIndex > -1) {
            // Product exists, update quantity
            cart.items[itemIndex].quantity += parseInt(quantity);
        } else {
            // Product does not exist, add as new item
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.product');

        res.status(200).json({
            status: 'success',
            data: { cart: updatedCart }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// Update item quantity
export const updateCartQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({
                status: 'fail',
                message: 'Quantity cannot be less than 1. Use remove to delete item.'
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                status: 'fail',
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            await cart.save();
        } else {
            return res.status(404).json({
                status: 'fail',
                message: 'Product not found in cart'
            });
        }

        const updatedCart = await Cart.findById(cart._id).populate('items.product');

        res.status(200).json({
            status: 'success',
            data: { cart: updatedCart }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                status: 'fail',
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(p => p.product.toString() !== productId);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.product');

        res.status(200).json({
            status: 'success',
            data: { cart: updatedCart }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                status: 'fail',
                message: 'Cart not found'
            });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({
            status: 'success',
            message: 'Cart cleared successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};
