import { Request, Response } from 'express';
import Project from '../models/Project';

// @desc    Get all user projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req: any, res: Response) => {
    const projects = await Project.find({ user: req.user._id });
    res.json(projects);
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req: any, res: Response) => {
    const { name, category, base_size, size_system, base_measurements, workflow_mode } = req.body;

    const project = new Project({
        user: req.user._id,
        name,
        category,
        base_size,
        size_system,
        base_measurements,
        workflow_mode,
        status: 'draft',
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        res.json(project);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req: Request, res: Response) => {
    const { name, status, base_size, size_system, base_measurements } = req.body;

    const project = await Project.findById(req.params.id);

    if (project) {
        project.name = name || project.name;
        project.status = status || project.status;
        project.base_size = base_size || project.base_size;
        project.size_system = size_system || project.size_system;
        project.base_measurements = base_measurements || project.base_measurements;

        const updatedProject = await project.save();
        res.json(updatedProject);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        await project.deleteOne();
        res.json({ message: 'Project removed' });
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
};

export {
    getProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject,
};
