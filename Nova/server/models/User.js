import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            trim: true,
            default: 'Home',
        },
        addressLine: {
            type: String,
            trim: true,
            default: '',
        },
        pincode: {
            type: String,
            trim: true,
            default: '',
        },
        state: {
            type: String,
            trim: true,
            default: '',
        },
        district: {
            type: String,
            trim: true,
            default: '',
        },
        taluka: {
            type: String,
            trim: true,
            default: '',
        },
        city: {
            type: String,
            trim: true,
            default: '',
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please tell us your name!'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false, // Don't show password by default
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local',
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    avatar: {
        type: String,
        trim: true,
        default: '',
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    agreeToTerms: {
        type: Boolean,
        required: [true, 'You must agree to the terms and conditions'],
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: '',
    },
    addresses: {
        type: [addressSchema],
        default: [],
    },
    addressLine: {
        type: String,
        trim: true,
        default: '',
    },
    pincode: {
        type: String,
        trim: true,
        default: '',
    },
    state: {
        type: String,
        trim: true,
        default: '',
    },
    district: {
        type: String,
        trim: true,
        default: '',
    },
    taluka: {
        type: String,
        trim: true,
        default: '',
    },
    city: {
        type: String,
        trim: true,
        default: '',
    },
    resetPasswordToken: {
        type: String,
        select: false,
    },
    resetPasswordExpires: {
        type: Date,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

export default User;
