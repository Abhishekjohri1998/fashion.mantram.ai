import express from 'express';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../controllers/customizationAssetController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, createAsset);
router.route('/:projectId').get(protect, getAssets);
router.route('/item/:id').put(protect, updateAsset).delete(protect, deleteAsset);

export default router;
