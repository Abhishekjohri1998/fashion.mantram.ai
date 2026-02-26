import express from 'express';
import { getProjectUploads, addProjectUpload } from '../controllers/projectUploadController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, addProjectUpload);
router.route('/:projectId').get(protect, getProjectUploads);

export default router;
