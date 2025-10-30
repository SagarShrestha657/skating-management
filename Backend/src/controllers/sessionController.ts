import { Request, Response } from 'express';
import Session from '../models/Session';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export const createSession = async (req: Request, res: Response) => {
    try {
        const { name, hours, quantity, totalAmount } = req.body;

        if (!name || !hours || !quantity || totalAmount === undefined) {
            return res.status(400).json({ message: 'Missing required fields: name, hours, quantity, totalAmount.' });
        }

        // Get the current time in UTC. The frontend will handle displaying it in Nepal's timezone.
        const startTime = new Date();
        // Calculate the end time based on the Nepal start time
        const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

        const newSession = await Session.create({ // The 'status' field will default to 'active' from the model
            name,
            hours,
            quantity,
            totalAmount,
            startTime,
            endTime,
            status: 'active',
            notified: false,
        });

        return res.status(201).json({ success: true, data: { session: newSession } });
    } catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({ message: 'Server error while creating session.' });
    }
};

export const editSession = async (req: Request, res: Response) => {
    try {
        const { name, hours, quantity, totalAmount } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        // Recalculate endTime based on original startTime and new hours
        const endTime = new Date(new Date(session.startTime!).getTime() + hours * 60 * 60 * 1000);

        const updatedSession = await Session.findByIdAndUpdate(
            req.params.id,
            { name, hours, quantity, totalAmount, endTime },
            { new: true }
        );

        if (!updatedSession) {
            return res.status(404).json({ message: 'Session not found during update.' });
        }

        return res.status(200).json({ success: true, data: { session: updatedSession } });
    } catch (error) {
        console.error('Error editing session:', error);
        return res.status(500).json({ message: 'Server error while editing session.' });
    }
};

export const getActiveSessions = async (req: Request, res: Response) => {
    try {
        const sessions = await Session.find({ status: 'active' }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, sessions });
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        return res.status(500).json({ message: 'Server error while fetching sessions.' });
    }
};


export const deleteSession = async (req: Request, res: Response) => {
    try {
        // Find the session by ID and update its status to 'completed'
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { status: 'completed' },
            { new: true } // Return the updated document
        );

        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }
        return res.status(200).json({ success: true, message: 'Session marked as completed.' });
    } catch (error) {
        console.error('Error deleting session:', error);
        return res.status(500).json({ message: 'Server error while deleting session.' });
    }
};

export const deleteSessionPermanently = async (req: Request, res: Response) => {
    try {
        const session = await Session.findByIdAndDelete(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        return res.status(200).json({ success: true, message: 'Session permanently deleted.' });
    } catch (error) {
        console.error('Error permanently deleting session:', error);
        return res.status(500).json({ message: 'Server error while deleting session.' });
    }
};

export const getWeeklySales = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date as string) : new Date();

        // Get the start (Sunday) and end (Saturday) of the week for the target date
        const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(targetDate, { weekStartsOn: 0 });

        // Create an array of all dates in that week
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const weeklySales = await Promise.all(daysInWeek.map(async (day) => {
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            const dailyData = await Session.aggregate([
                { $match: { createdAt: { $gte: dayStart, $lte: dayEnd } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]);

            return {
                // Format date as 'Mon', 'Tue', etc.
                name: day.toLocaleDateString('en-US', { weekday: 'short' }),
                sales: dailyData.length > 0 ? dailyData[0].total : 0,
            };
        }));

        return res.status(200).json({
            success: true,
            data: {
                weeklySales,
            }
        });
    } catch (error) {
        console.error('Error fetching weekly sales:', error);
        return res.status(500).json({ message: 'Server error while fetching weekly sales.' });
    }
};

export const getAnalyticsKpis = async (req: Request, res: Response) => {
    try {
        const now = new Date();

        // Today's Sales
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const todaySalesData = await Session.aggregate([
            { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const todaySales = todaySalesData.length > 0 ? todaySalesData[0].total : 0;

        // This Month's Sales
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const monthSalesData = await Session.aggregate([
            { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const monthSales = monthSalesData.length > 0 ? monthSalesData[0].total : 0;

        return res.status(200).json({ success: true, data: { todaySales, monthSales } });
    } catch (error) {
        console.error('Error fetching KPI analytics:', error);
        return res.status(500).json({ message: 'Server error while fetching KPI analytics.' });
    }
};

export const getAnalyticsTransactions = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const now = new Date();

        let start = startOfDay(now);
        let end = endOfDay(now);

        if (startDate && endDate) {
            start = startOfDay(new Date(startDate as string));
            end = endOfDay(new Date(endDate as string));
        }

        const recentTransactions = await Session.find({ createdAt: { $gte: start, $lte: end } })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: { recentTransactions } });
    } catch (error) {
        console.error('Error fetching transaction analytics:', error);
        return res.status(500).json({ message: 'Server error while fetching transaction analytics.' });
    }
};