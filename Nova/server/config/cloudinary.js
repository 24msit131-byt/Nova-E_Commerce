import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const cleanEnvValue = (value) => {
    if (!value) {
        return '';
    }

    return value.trim().replace(/^['\"]|['\"]$/g, '');
};

const cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);

if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env');
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

export default cloudinary;