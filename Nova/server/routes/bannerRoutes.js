import express from 'express';
import { getBanner, upsertBanner } from '../controllers/bannerController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';
import { uploadBannerImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', getBanner);
router.put('/admin', protect, requireAdmin, uploadBannerImage, upsertBanner);

export default router;
