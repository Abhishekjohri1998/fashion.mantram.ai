import { Request, Response } from 'express';
import TechPackDrawing from '../models/TechPackDrawing';

// @desc    Get all drawings for a project
// @route   GET /api/techpack-drawings/:projectId
// @access  Private
const getDrawings = async (req: any, res: Response) => {
    const drawings = await TechPackDrawing.find({ project: req.params.projectId });
    res.json(drawings);
};

// @desc    Add or update a techpack drawing
// @route   POST /api/techpack-drawings
// @access  Private
const addDrawing = async (req: any, res: Response) => {
    const { projectId, angle_key, drawing_url } = req.body;

    let drawing = await TechPackDrawing.findOne({ project: projectId, angle_key });

    if (drawing) {
        drawing.drawing_url = drawing_url;
        const updatedDrawing = await drawing.save();
        res.json(updatedDrawing);
    } else {
        drawing = new TechPackDrawing({
            project: projectId,
            user: req.user._id,
            angle_key,
            drawing_url,
        });
        const createdDrawing = await drawing.save();
        res.status(201).json(createdDrawing);
    }
};

export { getDrawings, addDrawing };
