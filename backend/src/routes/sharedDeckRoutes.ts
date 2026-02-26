import express from 'express';
import { createShareToken, getProjectByToken } from '../controllers/sharedDeckController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, createShareToken);
router.route('/:token').get(getProjectByToken);

export default router;
