import Category from '../models/Category.js';
import Product from '../models/Product.js';

const normalizeCategoryName = (value = '') => value.trim().replace(/\s+/g, ' ');

const findCategoryByNameCaseInsensitive = async (name, excludeId = null) => {
    const categories = await Category.find(excludeId ? { _id: { $ne: excludeId } } : {});
    const normalizedName = name.toLowerCase();

    return categories.find((category) => category.name.trim().toLowerCase() === normalizedName) || null;
};

const getCategoryCounts = async () => {
    const counts = await Product.aggregate([
        {
            $match: {
                category: { $type: 'string', $ne: '' },
            },
        },
        {
            $group: {
                _id: '$category',
                productCount: { $sum: 1 },
            },
        },
    ]);

    return new Map(
        counts.map((item) => [String(item._id).trim().toLowerCase(), item.productCount])
    );
};

const syncMissingProductCategories = async () => {
    const [categoryDocs, productCategories] = await Promise.all([
        Category.find({}, { name: 1 }),
        Product.distinct('category', { category: { $type: 'string', $ne: '' } }),
    ]);

    const existingNames = new Set(
        categoryDocs.map((category) => category.name.trim().toLowerCase())
    );

    const categoriesToInsert = productCategories
        .map((name) => normalizeCategoryName(name))
        .filter((name) => name && !existingNames.has(name.toLowerCase()))
        .map((name) => ({ name }));

    if (categoriesToInsert.length > 0) {
        await Category.insertMany(categoriesToInsert, { ordered: false }).catch(() => {});
    }
};

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        await syncMissingProductCategories();

        const [categories, categoryCountMap] = await Promise.all([
            Category.find().sort({ name: 1 }),
            getCategoryCounts(),
        ]);

        const data = categories.map((category) => ({
            ...category.toObject(),
            productCount: categoryCountMap.get(category.name.trim().toLowerCase()) || 0,
        }));

        res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const name = normalizeCategoryName(req.body?.name);

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category name',
            });
        }

        const existingCategory = await findCategoryByNameCaseInsensitive(name);

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists',
            });
        }

        const category = await Category.create({ name });

        res.status(201).json({
            success: true,
            data: {
                ...category.toObject(),
                productCount: 0,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        const nextName = normalizeCategoryName(req.body?.name);

        if (!nextName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category name',
            });
        }

        const duplicateCategory = await findCategoryByNameCaseInsensitive(nextName, category._id);

        if (duplicateCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists',
            });
        }

        const previousName = category.name;
        category.name = nextName;
        await category.save();

        await Product.updateMany(
            { category: previousName },
            { $set: { category: nextName } }
        );

        const categoryCountMap = await getCategoryCounts();

        res.status(200).json({
            success: true,
            data: {
                ...category.toObject(),
                productCount: categoryCountMap.get(nextName.trim().toLowerCase()) || 0,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        const productCount = await Product.countDocuments({ category: category.name });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'This category is still used by products. Reassign those products before deleting it.',
            });
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};