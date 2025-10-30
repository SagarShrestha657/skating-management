import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


// In a real app, you would fetch users from a database
// For demonstration, we'll use a hardcoded list of users.
const users = [
    { username: 'area1_owner', password: process.env.AREA1_OWNER_PASSWORD, role: 'admin', areaId: 'area1' },
    { username: 'area1_staff', password: process.env.AREA1_STAFF_PASSWORD, role: 'employee', areaId: 'area1' },
    { username: 'area2_owner', password: process.env.AREA2_OWNER_PASSWORD, role: 'admin', areaId: 'area2' },
    { username: 'area2_staff', password: process.env.AREA2_STAFF_PASSWORD, role: 'employee', areaId: 'area2' },
];

const JWT_SECRET = process.env.JWT_SECRET || "";

export const login = (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign(
            { role: user.role, areaId: user.areaId },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        return res.status(200).json({ token });
    }

    return res.status(402).json({ message: 'Invalid credentials' });
};