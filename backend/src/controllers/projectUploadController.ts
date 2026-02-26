import { Request, Response } from 'express';
import ProjectUpload from '../models/ProjectUpload';

// @desc    Get all uploads for a project
// @route   GET /api/project-uploads/:projectId
// @access  Private
const getProjectUploads = async (req: any, res: Response) => {
    const uploads = await ProjectUpload.find({ project: req.params.projectId });
    res.json(uploads);
};

// @desc    Add or update a project upload
// @route   POST /api/project-uploads
// @access  Private
const addProjectUpload = async (req: any, res: Response) => {
    const { projectId, angle_key, label, file_path } = req.body;

    let upload = await ProjectUpload.findOne({ project: projectId, angle_key });

    if (upload) {
        upload.file_path = file_path;
        upload.label = label;
        const updatedUpload = await upload.save();
        res.json(updatedUpload);
    } else {
        upload = new ProjectUpload({
            project: projectId,
            user: req.user._id,
            angle_key,
            label,
            file_path,
        });
        const createdUpload = await upload.save();
        res.status(201).json(createdUpload);
    }
};

export { getProjectUploads, addProjectUpload };
