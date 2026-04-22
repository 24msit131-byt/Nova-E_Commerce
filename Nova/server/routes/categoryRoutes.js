import express from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(protect, requireAdmin, createCategory);

router.route('/:id')
    .put(protect, requireAdmin, updateCategory)
    .delete(protect, requireAdmin, deleteCategory);

export default router;