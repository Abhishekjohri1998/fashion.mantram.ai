import express from 'express';
import { getDrawings, addDrawing } from '../controllers/techpackDrawingController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, addDrawing);
router.route('/:projectId').get(protect, getDrawings);

export default router;
