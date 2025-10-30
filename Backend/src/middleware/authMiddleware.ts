import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express's Request interface to include the user payload from the JWT
declare global {
    namespace Express {
        interface Request {
            user?: {
                role: 'admin' | 'employee';
                areaId: string;
            };
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user: {
        role: 'admin' | 'employee';
        areaId: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for safety

export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET) as { role: 'admin' | 'employee', areaId: string };

            // Attach user to the request
            req.user = decoded;

            return next();
        } catch (error) {
            console.error('Token verification failed', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};