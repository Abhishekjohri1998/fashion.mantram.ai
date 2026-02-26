import mongoose from 'mongoose';

const customizationAssetSchema = new mongoose.Schema(
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
        asset_type: {
            type: String, // customized_image, lifestyle_image, mood_board, customized_drawing, sketch_view
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const CustomizationAsset = mongoose.model('CustomizationAsset', customizationAssetSchema);

export default CustomizationAsset;
