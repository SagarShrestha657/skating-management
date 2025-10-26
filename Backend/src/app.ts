import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sessionRoutes from './routes/sessionRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notificationRoutes';
import morgan from 'morgan';
import { checkSessionsAndSendNotifications } from './services/notificationService';


// Load environment variables from .env file
dotenv.config();

const app: Application = express();
const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI;

// CORS configuration
const allowedOrigins = [
    'https://skating-management.vercel.app',
    'http://localhost:5173' // Your local frontend development server
];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests) or from the allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

// Middlewares
app.use(cors(corsOptions)); // Enable Cross-Origin Resource Sharing with specific origins
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logger

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Root endpoint for health check
app.get('/api/check', (req: Request, res: Response) => {
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