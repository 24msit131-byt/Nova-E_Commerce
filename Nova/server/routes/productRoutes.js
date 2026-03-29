import express from 'express';
import { createProduct, getProducts, getProductById, getAdminProducts, deleteProduct, updateProduct, getRelatedProducts } from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';
import { uploadProductImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, requireAdmin, uploadProductImages, createProduct);

router.route('/admin')
    .get(protect, requireAdmin, getAdminProducts);

router.route('/:id')
    .get(getProductById)
    .put(protect, requireAdmin, uploadProductImages, updateProduct)
    .delete(protect, requireAdmin, deleteProduct);

router.route('/related/:id')
    .get(getRelatedProducts);

export default router;
