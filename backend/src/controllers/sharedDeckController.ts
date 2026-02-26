import { Request, Response } from 'express';
import SharedDeck from '../models/SharedDeck';
import crypto from 'crypto';

// @desc    Create a share token for a project
// @route   POST /api/shared-decks
// @access  Private
const createShareToken = async (req: any, res: Response) => {
    const { projectId } = req.body;

    let sharedDeck = await SharedDeck.findOne({ project: projectId, user: req.user._id });

    if (!sharedDeck) {
        const token = crypto.randomBytes(32).toString('hex');
        sharedDeck = new SharedDeck({
            project: projectId,
            user: req.user._id,
            token,
        });
        await sharedDeck.save();
    }

    res.json(sharedDeck);
};

// @desc    Get project by share token
// @route   GET /api/shared-decks/:token
// @access  Public
const getProjectByToken = async (req: Request, res: Response) => {
    const sharedDeck = await SharedDeck.findOne({ token: req.params.token }).populate('project');

    if (sharedDeck) {
        res.json(sharedDeck);
    } else {
        res.status(404).json({ message: 'Invalid or expired token' });
    }
};

export { createShareToken, getProjectByToken };
