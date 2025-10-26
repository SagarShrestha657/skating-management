self.addEventListener('push', event => {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/skate-icon.png', // Make sure you have an icon here
        badge: '/skate-badge.png' // And a badge here
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});