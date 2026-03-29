export const requireAdmin = (req, res, next) => {
	const resolvedRole = req.userRole || req.user?.role;

	if (resolvedRole !== 'admin') {
		return res.status(403).json({
			status: 'fail',
			message: 'Access denied. Admins only.'
		});
	}

	next();
};
