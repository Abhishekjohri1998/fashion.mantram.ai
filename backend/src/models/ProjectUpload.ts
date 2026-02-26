import mongoose from 'mongoose';

const projectUploadSchema = new mongoose.Schema(
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
        angle_key: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        file_path: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const ProjectUpload = mongoose.model('ProjectUpload', projectUploadSchema);

export default ProjectUpload;
