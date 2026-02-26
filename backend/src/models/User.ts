import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    isAdmin: boolean;
    displayName: string;
    avatarUrl: string;
    bio?: string;
    companyName?: string;
    logoUrl?: string;
    website?: string;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
        displayName: {
            type: String,
            default: '',
        },
        avatarUrl: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
        },
        companyName: {
            type: String,
            default: '',
        },
        logoUrl: {
            type: String,
            default: '',
        },
        website: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

userSchema.methods.matchPassword = async function (this: IUser, enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Simplified pre-save hook without next()
userSchema.pre<IUser>('save', async function (this: IUser) {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
