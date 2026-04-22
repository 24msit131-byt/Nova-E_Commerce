import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import promoCodeRoutes from './routes/promoCodeRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use('/api/v1/user', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/banner', bannerRoutes);
app.use('/api/v1/promos', promoCodeRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/categories', categoryRoutes);

app.get("/", (req, res) => {
	res.send(
		"Server is running. Documentation: /api/v1/user/register"
	);
});

app.get("/api/health", (req, res) => {
	res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/mongoose", (req, res) => {
	res.json({
		mongooseVersion: mongoose.version,
		readyState: mongoose.connection.readyState,
	});
});

export default app;
