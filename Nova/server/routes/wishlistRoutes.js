import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/remove/:productId', removeFromWishlist);

export default router;