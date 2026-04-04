import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.DATABASE);

        const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const password = String(process.env.ADMIN_PASSWORD || '').trim();
        const fullName = String(process.env.ADMIN_FULL_NAME || 'System Admin').trim() || 'System Admin';

        if (!email || !password) {
            throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding the admin account');
        }

        const existingAdmin = await Admin.findOne({ email });
        const admin = existingAdmin || new Admin({ email });

        admin.fullName = fullName;
        admin.email = email;
        admin.password = password;

        await admin.save();

        console.log(existingAdmin ? 'Admin updated successfully' : 'Admin created successfully');
        console.log('Email:', email);
        console.log('Password: [hidden]');
        process.exit();
    } catch (err) {
        console.error('Error seeding admin:', err.message);
        process.exit(1);
    }
};

seedAdmin();
