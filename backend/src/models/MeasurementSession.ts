import mongoose from 'mongoose';

const measurementSessionSchema = new mongoose.Schema(
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
        category: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'pending',
        },
        height_cm: {
            type: Number,
        },
        image_url: {
            type: String,
        },
        measurements: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const MeasurementSession = mongoose.model('MeasurementSession', measurementSessionSchema);

export default MeasurementSession;
