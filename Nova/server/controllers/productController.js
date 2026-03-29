import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

const uploadToCloudinary = (fileBuffer) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        {
            folder: 'nova/products',
            resource_type: 'image'
        },
        (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result.secure_url);
        }
    );

    stream.end(fileBuffer);
});

const getCloudinaryPublicIdFromUrl = (imageUrl) => {
    try {
        const parsedUrl = new URL(imageUrl);
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        const uploadIndex = pathParts.indexOf('upload');

        if (uploadIndex === -1 || uploadIndex === pathParts.length - 1) {
            return null;
        }

        let publicIdParts = pathParts.slice(uploadIndex + 1);

        if (publicIdParts[0]?.startsWith('v')) {
            publicIdParts = publicIdParts.slice(1);
        }

        if (!publicIdParts.length) {
            return null;
        }

        const lastPart = publicIdParts[publicIdParts.length - 1];
        publicIdParts[publicIdParts.length - 1] = lastPart.replace(/\.[^/.]+$/, '');

        return decodeURIComponent(publicIdParts.join('/'));
    } catch {
        return null;
    }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const { name, category, price, stock, description, status, images } = req.body;

        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map((file) => uploadToCloudinary(file.buffer))
            );
        } else if (images) {
            if (Array.isArray(images)) {
                imageUrls = images;
            } else if (typeof images === 'string') {
                try {
                    const parsed = JSON.parse(images);
                    imageUrls = Array.isArray(parsed) ? parsed : [images];
                } catch {
                    imageUrls = [images];
                }
            }
        }

        const product = await Product.create({
            name,
            category,
            price: Number(price),
            stock: Number(stock),
            description,
            status,
            images: imageUrls
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        const isCloudinaryAuthError =
            error?.http_code === 401 ||
            /invalid\s+signature|authentication required/i.test(error?.message || '');

        res.status(400).json({
            success: false,
            message: isCloudinaryAuthError
                ? 'Cloudinary authentication failed. Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in server/.env and restart the server.'
                : error.message
        });
    }
};

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: 'Active' });
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single product details
// @route   GET /api/v1/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Get all products for admin (including drafts)
// @route   GET /api/v1/products/admin
// @access  Private/Admin
export const getAdminProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const publicIds = (product.images || [])
            .map((imageUrl) => getCloudinaryPublicIdFromUrl(imageUrl))
            .filter(Boolean);

        if (publicIds.length > 0) {
            await Promise.allSettled(
                publicIds.map((publicId) =>
                    cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
                )
            );
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const { name, category, price, stock, description, status, existingImages } = req.body;

        let imageUrls = [];

        // Parse existing images if they come as a JSON string
        if (existingImages) {
            try {
                imageUrls = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
            } catch (error) {
                imageUrls = [existingImages];
            }
        }

        // 1. Find removed images to delete from Cloudinary
        const removedImages = (product.images || []).filter(img => !imageUrls.includes(img));
        if (removedImages.length > 0) {
            const publicIds = removedImages
                .map(imgUrl => getCloudinaryPublicIdFromUrl(imgUrl))
                .filter(Boolean);

            if (publicIds.length > 0) {
                await Promise.allSettled(
                    publicIds.map(id => cloudinary.uploader.destroy(id, { resource_type: 'image' }))
                );
            }
        }

        // Handle new file uploads if any
        if (req.files && req.files.length > 0) {
            const newImageUrls = await Promise.all(
                req.files.map((file) => uploadToCloudinary(file.buffer))
            );
            imageUrls = [...imageUrls, ...newImageUrls];
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                category,
                price: price ? Number(price) : product.price,
                stock: stock ? Number(stock) : product.stock,
                description,
                status,
                images: imageUrls
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get related products
// @route   GET /api/v1/products/related/:id
// @access  Public
export const getRelatedProducts = async (req, res) => {
    try {
        const productId = req.params.id;

        // Use aggregation to get one top product from each category
        const related = await Product.aggregate([
            {
                $match: {
                    _id: { $ne: new mongoose.Types.ObjectId(productId) },
                    status: 'Active'
                }
            },
            {
                $sort: { rating: -1, createdAt: -1 }
            },
            {
                $group: {
                    _id: '$category',
                    product: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$product' }
            },
            {
                $limit: 8
            }
        ]);

        res.status(200).json({
            success: true,
            data: related
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
