import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/firebase.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import guidanceRouter from './routes/guidance.js';
import alumniRouter from './routes/alumni.js';
import adminRouter from './routes/admin.js';
import safetyRouter from './routes/safety.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/guidance', guidanceRouter);
app.use('/api/alumni', alumniRouter);
app.use('/api/admin', adminRouter);
app.use('/api/safety', safetyRouter);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`✅ Express server running on port ${PORT}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
