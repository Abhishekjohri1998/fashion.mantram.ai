import path from 'path';
import express from 'express';
import upload from '../middleware/uploadMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
    if (req.file) {
        res.send({
            message: 'Image uploaded',
            filePath: `/${req.file.path.replace(/\\/g, '/')}`,
        });
    } else {
        res.status(400).send({ message: 'No file uploaded' });
    }
});

export default router;
