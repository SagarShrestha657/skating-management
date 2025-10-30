import webpush from 'web-push';
import Session from '../models/Session';
import Subscription from '../models/subscription';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("VAPID keys are not configured. Please generate them and add to .env file.");
} else {
    webpush.setVapidDetails(
        'mailto:shresthasagar657@gmail.com', // Replace with your email
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

export const checkSessionsAndSendNotifications = async () => {
    try {
        const now = new Date();
        // Find sessions that ended in the last minute and haven't been notified
       const expiredSessions = await Session.find({
            status: 'active',
            endTime: { $lte: now },
            notified: { $ne: true }
        });

        if (expiredSessions.length === 0) {
            return;
        }

        for (const session of expiredSessions) {
            // Find subscriptions only for the area where the session expired
            const subscriptions = await Subscription.find({ areaId: session.areaId });
          
            if (subscriptions.length === 0) {
                continue; // Move to the next session
            }

            const payload = JSON.stringify({
                title: 'Skating Session Over',
                body: `Time is up for ${session.name}!`,
                data: {
                    url: 'https://skating-management.vercel.app/'
                }
            });

            for (const sub of subscriptions) {
                try {
                    await webpush.sendNotification(sub, payload);
                } catch (error: any) {
                    // If a subscription is invalid (e.g., user uninstalled the app), delete it.
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        console.log('Subscription has expired or is no longer valid. Removing.');
                        await Subscription.findByIdAndDelete(sub._id);
                    } else {
                        console.error('Error sending notification to a subscriber:', error.body);
                    }
                }
            }

            session.notified = true;
            await session.save();
        }
    } catch (error) {
        console.error('Error sending push notifications:', error);
    }
};
