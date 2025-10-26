import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


// It's best practice to use environment variables for sensitive data
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const EMPLOYEE_PASSWORD = process.env.EMPLOYEE_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "";

export const login = (req: Request, res: Response) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }
    
    let role: 'admin' | 'employee' | null = null;
    if (password === ADMIN_PASSWORD) {
        role = 'admin';
    } else if (password === EMPLOYEE_PASSWORD) {
        role = 'employee';
    }
    
    if (role) {
        const token = jwt.sign({ role }, JWT_SECRET, { expiresIn: '30d' }); // Token expires in 30 days
        return res.status(200).json({ token });
    }

    return res.status(401).json({ message: 'Invalid password' });
};