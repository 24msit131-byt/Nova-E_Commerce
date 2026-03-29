import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
        return;
    }
    cb(new Error('Only image files are allowed'));
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 4
    },
    fileFilter
});

export const uploadProductImages = (req, res, next) => {
    upload.array('images', 4)(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        let message = error.message;
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'Each image must be 5MB or smaller';
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            message = 'You can upload up to 4 images only';
        }

        res.status(400).json({
            success: false,
            message
        });
    });
};

export const uploadBannerImage = (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        let message = error.message;
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'Image must be 5MB or smaller';
        }

        res.status(400).json({
            success: false,
            message
        });
    });
};