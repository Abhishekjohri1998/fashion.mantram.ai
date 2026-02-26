import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB.');

        const email = 'admin@solesmith.com';
        const password = 'Password@123';
        const name = 'Admin User';

        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('User already exists.');
        } else {
            const user = await User.create({
                name,
                email,
                password,
                isAdmin: true,
                displayName: 'Admin',
            });
            console.log('User created successfully!');
        }

        console.log('\n--- Credentials ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('-------------------\n');

        process.exit(0);
    } catch (err) {
        console.error('Error creating user:', err);
        process.exit(1);
    }
};

createUser();
