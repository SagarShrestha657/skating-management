import { Request, Response } from 'express';
import Subscription from '../models/subscription';


export const subscribe = async (req: Request, res: Response) => {
    const subscription = req.body;

    try {
        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({ endpoint: subscription.endpoint });
        if (existingSubscription) {
            return res.status(200).json({ message: 'Subscription already exists.' });
        }
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const newSubscription = new Subscription({
            ...subscription,
            areaId: req.user.areaId // Add areaId from the authenticated user's token
        });
        await newSubscription.save();
        return res.status(201).json({ message: 'Subscription saved successfully.' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return res.status(500).json({ message: 'Failed to save subscription.' });
    }
};