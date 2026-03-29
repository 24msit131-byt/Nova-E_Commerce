import express from 'express';
import {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
} from '../controllers/cartController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All cart routes are protected
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartQuantity);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

export default router;
