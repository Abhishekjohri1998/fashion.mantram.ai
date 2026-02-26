import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            default: 'footwear',
        },
        base_size: {
            type: String,
            required: true,
            default: '',
        },
        size_system: {
            type: String,
            required: true,
            default: 'EU',
        },
        base_measurements: {
            type: Map,
            of: Number,
            default: {},
        },
        status: {
            type: String,
            required: true,
            default: 'draft',
        },
        workflow_mode: {
            type: String,
            default: 'standard',
        },
    },
    {
        timestamps: true,
    }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
