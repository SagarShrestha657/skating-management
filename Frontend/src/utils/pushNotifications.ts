import { subscribeToPushNotifications } from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('Push messaging is not supported');
        return;
    }

    if (!VAPID_PUBLIC_KEY) {
        console.error('VITE_VAPID_PUBLIC_KEY is not defined in your .env file.');
        return;
    }

    try {
        const swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered.');

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Permission for notifications was denied');
            return;
        }

        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Send the subscription to the backend
        await subscribeToPushNotifications(subscription);
    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
    }
}