import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sessionRoutes from './routes/sessionRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { checkSessionsAndSendNotifications } from './services/notificationService';


// Load environment variables from .env file
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Root endpoint for health check
app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Skating Management API is running.' });
});

const startServer = async () => {
    if (!MONGO_URI) {
        console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Successfully connected to MongoDB.');
        app.listen(PORT, () => {
            console.log(` Server is listening on port ${PORT}`);
            // Start the session checker only after the server is running
            setInterval(checkSessionsAndSendNotifications, 60000);
        });
    } catch (error) {
        console.error(' Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

startServer();