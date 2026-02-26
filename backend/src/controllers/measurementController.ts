import { Request, Response } from 'express';
import MeasurementSession from '../models/MeasurementSession';

// @desc    Get latest measurements for a project
// @route   GET /api/measurements/:projectId
// @access  Private
const getMeasurements = async (req: any, res: Response) => {
    const measurements = await MeasurementSession.find({ project: req.params.projectId, status: 'completed' })
        .sort({ updatedAt: -1 })
        .limit(1);
    res.json(measurements);
};

// @desc    Create or update measurement session
// @route   POST /api/measurements
// @access  Private
const saveMeasurements = async (req: any, res: Response) => {
    const { projectId, category, status, height_cm, image_url, measurements } = req.body;

    const session = new MeasurementSession({
        project: projectId,
        user: req.user._id,
        category,
        status,
        height_cm,
        image_url,
        measurements,
    });

    const createdSession = await session.save();
    res.status(201).json(createdSession);
};

export { getMeasurements, saveMeasurements };
