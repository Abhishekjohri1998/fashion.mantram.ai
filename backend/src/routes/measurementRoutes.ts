import express from 'express';
import { getMeasurements, saveMeasurements } from '../controllers/measurementController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, saveMeasurements);
router.route('/:projectId').get(protect, getMeasurements);

export default router;
