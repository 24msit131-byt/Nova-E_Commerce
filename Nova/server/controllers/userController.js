import User from '../models/User.js';
import Admin from '../models/Admin.js';

const ADDRESS_LIMIT = 4;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const buildAddressPayload = (body = {}) => ({
    label: normalizeText(body.label) || 'Home',
    addressLine: normalizeText(body.addressLine),
    pincode: normalizeText(body.pincode),
    state: normalizeText(body.state),
    district: normalizeText(body.district),
    taluka: normalizeText(body.taluka),
    city: normalizeText(body.city),
    isDefault: body.isDefault === true || body.isDefault === 'true',
});

const validateAddressPayload = (address) => {
    const requiredFields = ['addressLine', 'pincode', 'state', 'district', 'taluka', 'city'];
    return requiredFields.filter((field) => !address[field]);
};

const syncProfileFieldsFromDefaultAddress = (user) => {
    const addresses = Array.isArray(user.addresses) ? user.addresses : [];

    if (!addresses.length) {
        return;
    }

    const primaryAddress = addresses.find((address) => address.isDefault) || addresses[0];

    user.addressLine = primaryAddress?.addressLine || '';
    user.pincode = primaryAddress?.pincode || '';
    user.state = primaryAddress?.state || '';
    user.district = primaryAddress?.district || '';
    user.taluka = primaryAddress?.taluka || '';
    user.city = primaryAddress?.city || '';
};

const syncDefaultAddressFromProfileFields = (user) => {
    const addresses = Array.isArray(user.addresses) ? user.addresses : [];

    if (!addresses.length) {
        return;
    }

    const primaryAddress = addresses.find((address) => address.isDefault) || addresses[0];

    if (!primaryAddress) {
        return;
    }

    primaryAddress.addressLine = user.addressLine || '';
    primaryAddress.pincode = user.pincode || '';
    primaryAddress.state = user.state || '';
    primaryAddress.district = user.district || '';
    primaryAddress.taluka = user.taluka || '';
    primaryAddress.city = user.city || '';
};

const ensureDefaultAddress = (addresses, preferredAddressId = null) => {
    if (!addresses.length) {
        return;
    }

    if (preferredAddressId) {
        addresses.forEach((address) => {
            address.isDefault = String(address._id) === String(preferredAddressId);
        });
        return;
    }

    const currentDefaultIndex = addresses.findIndex((address) => address.isDefault);

    if (currentDefaultIndex >= 0) {
        addresses.forEach((address, index) => {
            address.isDefault = index === currentDefaultIndex;
        });
        return;
    }

    addresses.forEach((address, index) => {
        address.isDefault = index === 0;
    });
};

const pickProfileFields = (body) => ({
    fullName: body.fullName,
    phoneNumber: body.phoneNumber,
    addressLine: body.addressLine,
    pincode: body.pincode,
    state: body.state,
    district: body.district,
    taluka: body.taluka,
    city: body.city,
});

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const updates = pickProfileFields(req.body);
        if (typeof req.body.state === 'string') {
            updates.state = req.body.state.trim();
        }

        Object.keys(updates).forEach((key) => {
            if (updates[key] === undefined) {
                delete updates[key];
            }
        });

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found.'
            });
        }

        user.set(updates);

        if (Array.isArray(user.addresses) && user.addresses.length > 0) {
            syncDefaultAddressFromProfileFields(user);
        }

        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

export const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found.',
            });
        }

        if ((user.addresses || []).length >= ADDRESS_LIMIT) {
            return res.status(400).json({
                status: 'fail',
                message: `You can save up to ${ADDRESS_LIMIT} addresses.`,
            });
        }

        const address = buildAddressPayload(req.body);
        const missingFields = validateAddressPayload(address);

        if (missingFields.length) {
            return res.status(400).json({
                status: 'fail',
                message: `Please complete the address fields: ${missingFields.join(', ')}.`,
            });
        }

        const shouldBeDefault = address.isDefault || (user.addresses || []).length === 0 || !(user.addresses || []).some((item) => item.isDefault);

        if (shouldBeDefault) {
            (user.addresses || []).forEach((item) => {
                item.isDefault = false;
            });
        }

        user.addresses.push({
            ...address,
            isDefault: shouldBeDefault,
        });

        ensureDefaultAddress(user.addresses);
        syncProfileFieldsFromDefaultAddress(user);
        await user.save();

        res.status(201).json({
            status: 'success',
            message: 'Address added successfully.',
            data: {
                user,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found.',
            });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                status: 'fail',
                message: 'Address not found.',
            });
        }

        const payload = buildAddressPayload(req.body);
        const missingFields = validateAddressPayload(payload);

        if (missingFields.length) {
            return res.status(400).json({
                status: 'fail',
                message: `Please complete the address fields: ${missingFields.join(', ')}.`,
            });
        }

        const nextIsDefault = req.body.isDefault === undefined ? address.isDefault : payload.isDefault;

        address.set({
            ...payload,
            isDefault: nextIsDefault,
        });

        if (nextIsDefault) {
            ensureDefaultAddress(user.addresses, address._id);
        } else {
            ensureDefaultAddress(user.addresses);
        }

        syncProfileFieldsFromDefaultAddress(user);
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Address updated successfully.',
            data: {
                user,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found.',
            });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                status: 'fail',
                message: 'Address not found.',
            });
        }

        const wasDefault = address.isDefault;
        address.deleteOne();

        if (user.addresses.length > 0) {
            if (wasDefault) {
                user.addresses.forEach((item, index) => {
                    item.isDefault = index === 0;
                });
            }

            ensureDefaultAddress(user.addresses);
            syncProfileFieldsFromDefaultAddress(user);
        }

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Address deleted successfully.',
            data: {
                user,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

const mapUserForAdminTable = (doc, sourceRole) => ({
    id: doc._id,
    name: doc.fullName,
    email: doc.email,
    role: sourceRole,
    joined: doc.createdAt,
    status: 'Active',
});

export const getAdminUsers = async (req, res) => {
    try {
        const search = (req.query.search || '').trim().toLowerCase();

        const [users, admins] = await Promise.all([
            User.find({}).select('fullName email role createdAt').sort({ createdAt: -1 }),
            Admin.find({}).select('fullName email createdAt').sort({ createdAt: -1 }),
        ]);

        const normalizedUsers = users.map((user) =>
            mapUserForAdminTable(user, user.role === 'admin' ? 'Admin' : 'User')
        );
        const normalizedAdmins = admins.map((admin) => mapUserForAdminTable(admin, 'Admin'));

        const combined = [...normalizedAdmins, ...normalizedUsers]
            .filter((user) => {
                if (!search) return true;
                return (
                    user.name.toLowerCase().includes(search) ||
                    user.email.toLowerCase().includes(search) ||
                    user.role.toLowerCase().includes(search)
                );
            })
            .sort((a, b) => new Date(b.joined) - new Date(a.joined));

        const totalAdmins = combined.filter((user) => user.role === 'Admin').length;

        res.status(200).json({
            status: 'success',
            data: {
                users: combined,
                totalUsers: combined.length,
                totalAdmins,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid role. Allowed values are admin or user.',
            });
        }

        if (req.user?._id?.toString() === userId && role !== 'admin') {
            return res.status(400).json({
                status: 'fail',
                message: 'You cannot remove admin access from your own account.',
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            const admin = await Admin.findById(userId);

            if (admin) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Role updates are not supported for legacy admin records.',
                });
            }

            return res.status(404).json({
                status: 'fail',
                message: 'User not found.',
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'User role updated successfully.',
            data: {
                user: mapUserForAdminTable(user, role === 'admin' ? 'Admin' : 'User'),
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

export const deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user?._id?.toString() === userId) {
            return res.status(400).json({
                status: 'fail',
                message: 'You cannot delete your own account.',
            });
        }

        const deletedUser = await User.findByIdAndDelete(userId);
        if (deletedUser) {
            return res.status(200).json({
                status: 'success',
                message: 'User deleted successfully.',
            });
        }

        const deletedAdmin = await Admin.findByIdAndDelete(userId);
        if (deletedAdmin) {
            return res.status(200).json({
                status: 'success',
                message: 'Admin deleted successfully.',
            });
        }

        return res.status(404).json({
            status: 'fail',
            message: 'User not found.',
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};
