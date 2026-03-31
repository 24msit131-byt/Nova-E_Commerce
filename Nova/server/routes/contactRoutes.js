import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { sendContactEmail } from '../controllers/contactController.js';

const router = express.Router();

router.post('/send-email', protect, sendContactEmail);

export default router;