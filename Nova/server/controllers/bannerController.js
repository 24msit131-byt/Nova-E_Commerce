import Banner from '../models/Banner.js';
import cloudinary from '../config/cloudinary.js';

const uploadToCloudinary = (fileBuffer) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        {
            folder: 'nova/banner',
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

const defaultBanner = {
    title: 'Pure solutions for a spotless sanctuary.',
    subtitle: 'Nova brings the art of curation to home care. Elevate your living space with eco-conscious products designed for performance and peace of mind.',
    link: '/products',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=2000'
};

// @desc    Get current banner
// @route   GET /api/v1/banner
// @access  Public
export const getBanner = async (req, res) => {
    try {
        let banner = await Banner.findOne().sort({ updatedAt: -1 });

        if (!banner) {
            banner = await Banner.create(defaultBanner);
        }

        res.status(200).json({
            success: true,
            data: banner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create or update banner
// @route   PUT /api/v1/banner/admin
// @access  Private/Admin
export const upsertBanner = async (req, res) => {
    try {
        const { title, subtitle, link, removeImage } = req.body;
        const shouldRemoveImage = String(removeImage).toLowerCase() === 'true';

        let banner = await Banner.findOne().sort({ updatedAt: -1 });

        let imageUrl = banner?.imageUrl || defaultBanner.imageUrl;

        if (shouldRemoveImage && !req.file?.buffer && banner?.imageUrl) {
            const publicId = getCloudinaryPublicIdFromUrl(banner.imageUrl);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
            }
            imageUrl = defaultBanner.imageUrl;
        }

        if (req.file?.buffer) {
            const uploadedUrl = await uploadToCloudinary(req.file.buffer);

            if (banner?.imageUrl) {
                const publicId = getCloudinaryPublicIdFromUrl(banner.imageUrl);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                }
            }

            imageUrl = uploadedUrl;
        }

        if (!banner) {
            banner = await Banner.create({
                title: title || defaultBanner.title,
                subtitle: subtitle || defaultBanner.subtitle,
                link: link || defaultBanner.link,
                imageUrl
            });
        } else {
            banner.title = title || banner.title;
            banner.subtitle = subtitle || banner.subtitle;
            banner.link = link || banner.link;
            banner.imageUrl = imageUrl;
            await banner.save();
        }

        res.status(200).json({
            success: true,
            data: banner,
            message: 'Banner updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
