import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, googleLogin, forgotPassword, resetPassword } from '../controllers/authController.js';
import { deleteUserByAdmin, getAdminUsers, getMe, updateProfile, updateUserRole } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		status: 'fail',
		message: 'Too many password reset requests. Please try again after 15 minutes.'
	}
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/admin/users', protect, requireAdmin, getAdminUsers);
router.patch('/admin/users/:userId/role', protect, requireAdmin, updateUserRole);
router.delete('/admin/users/:userId', protect, requireAdmin, deleteUserByAdmin);

export default router;