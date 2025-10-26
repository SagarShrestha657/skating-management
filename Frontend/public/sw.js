self.addEventListener('push', event => {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icon-192x192.png', // Make sure you have an icon in your public folder
        badge: '/badge-72x72.png', // And a badge icon
        data: {
            url: data.data.url // Pass the URL from the payload
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close(); // Close the notification

    // Open the app URL passed in the push notification data
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});