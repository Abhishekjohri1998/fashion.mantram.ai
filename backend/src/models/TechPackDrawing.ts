import mongoose from 'mongoose';

const techpackDrawingSchema = new mongoose.Schema(
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
        drawing_url: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const TechPackDrawing = mongoose.model('TechPackDrawing', techpackDrawingSchema);

export default TechPackDrawing;
