import { Request, Response } from 'express';
import CustomizationAsset from '../models/CustomizationAsset';

// @desc    Get all assets for a project
// @route   GET /api/customization-assets/:projectId
// @access  Private
const getAssets = async (req: any, res: Response) => {
    const assets = await CustomizationAsset.find({ project: req.params.projectId });
    res.json(assets);
};

// @desc    Create a customization asset
// @route   POST /api/customization-assets
// @access  Private
const createAsset = async (req: any, res: Response) => {
    const { projectId, asset_type, url, metadata } = req.body;

    const asset = new CustomizationAsset({
        project: projectId,
        user: req.user._id,
        asset_type,
        url,
        metadata,
    });

    const createdAsset = await asset.save();
    res.status(201).json(createdAsset);
};

// @desc    Update an asset
// @route   PUT /api/customization-assets/:id
// @access  Private
const updateAsset = async (req: Request, res: Response) => {
    const { url, metadata } = req.body;

    const asset = await CustomizationAsset.findById(req.params.id);

    if (asset) {
        asset.url = url || asset.url;
        asset.metadata = metadata || asset.metadata;
        const updatedAsset = await asset.save();
        res.json(updatedAsset);
    } else {
        res.status(404).json({ message: 'Asset not found' });
    }
};

// @desc    Delete an asset
// @route   DELETE /api/customization-assets/:id
// @access  Private
const deleteAsset = async (req: Request, res: Response) => {
    const asset = await CustomizationAsset.findById(req.params.id);

    if (asset) {
        await asset.deleteOne();
        res.json({ message: 'Asset removed' });
    } else {
        res.status(404).json({ message: 'Asset not found' });
    }
};

export { getAssets, createAsset, updateAsset, deleteAsset };
