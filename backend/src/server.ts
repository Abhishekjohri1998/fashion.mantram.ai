import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';

import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import uploadRoutes from './routes/uploadRoutes';
import projectUploadRoutes from './routes/projectUploadRoutes';
import customizationAssetRoutes from './routes/customizationAssetRoutes';
import techpackDrawingRoutes from './routes/techpackDrawingRoutes';
import measurementRoutes from './routes/measurementRoutes';
import sharedDeckRoutes from './routes/sharedDeckRoutes';
import path from 'path';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/project-uploads', projectUploadRoutes);
app.use('/api/customization-assets', customizationAssetRoutes);
app.use('/api/techpack-drawings', techpackDrawingRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/shared-decks', sharedDeckRoutes);

// Static Assets
const __dirname_path = path.resolve();
app.use('/uploads', express.static(path.join(__dirname_path, '/uploads')));

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
