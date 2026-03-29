import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ')
			? authHeader.split(' ')[1]
			: null;

		if (!token) {
			return res.status(401).json({
				status: 'fail',
				message: 'You are not logged in. Please log in to continue.'
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		let currentUser = null;
		let role = decoded.role;

		if (decoded.role === 'admin') {
			currentUser = await Admin.findById(decoded.id);
		} else if (decoded.role === 'user') {
			currentUser = await User.findById(decoded.id);
		}

		if (!currentUser) {
			currentUser = await Admin.findById(decoded.id);
			if (currentUser) {
				role = 'admin';
			}
		}

		if (!currentUser) {
			currentUser = await User.findById(decoded.id);
			if (currentUser) {
				role = currentUser.role === 'admin' ? 'admin' : 'user';
			}
		}

		if (!currentUser) {
			return res.status(401).json({
				status: 'fail',
				message: 'The user belonging to this token no longer exists.'
			});
		}

		req.user = currentUser;
		req.userRole = role;
		next();
	} catch (err) {
		return res.status(401).json({
			status: 'fail',
			message: 'Invalid or expired token.'
		});
	}
};
