import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.DATABASE);

        const email = '';
        const password = '';

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit();
        }

        const newAdmin = new Admin({
            fullName: 'System Admin',
            email,
            password, // Will be hashed by pre-save hook
        });

        await newAdmin.save();
        console.log('Admin created successfully');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit();
    } catch (err) {
        console.error('Error seeding admin:', err.message);
        process.exit(1);
    }
};

seedAdmin();
