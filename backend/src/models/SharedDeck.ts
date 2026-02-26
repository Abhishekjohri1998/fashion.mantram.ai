import mongoose from 'mongoose';

const sharedDeckSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Project',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        expires_at: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const SharedDeck = mongoose.model('SharedDeck', sharedDeckSchema);

export default SharedDeck;
