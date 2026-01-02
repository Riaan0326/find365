importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBU2xarVI0TLp2bAQwcVg5MKqWHmMA7DxM",
  authDomain: "rides911-7c105.firebaseapp.com",
  projectId: "rides911-7c105",
  storageBucket: "rides911-7c105.firebasestorage.app",
  messagingSenderId: "244837489506",
  appId: "1:244837489506:web:f5bad7f5fceb67b269aa3b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  // Store timestamp when background message received
  const notificationTime = Date.now();
  self.localStorage?.setItem('newest-request-time', notificationTime.toString());
  
  // Notification creation disabled to avoid duplicates
  // self.registration.showNotification(payload.notification?.title || 'New Request', {
  //   body: payload.notification?.body || 'Press to open SP Dashboard',
  //   icon: '/icon-192x192.png',
  //   requireInteraction: true,
  //   tag: 'ride-request'
  // });
});

// Handle notification click - DISABLED
// self.addEventListener('notificationclick', (event) => {
//   console.log('Firebase SW: Notification clicked!');
//   console.log('Firebase SW: Event:', event);
//   console.log('Firebase SW: Notification:', event.notification);
//   
//   event.notification.close();
//   
//   // Simple test - just try to open dashboard
//   event.waitUntil(
//     clients.openWindow('https://rides911.com/dashboard?from=notification').then((windowClient) => {
//       console.log('Firebase SW: Window opened:', windowClient);
//     }).catch((error) => {
//       console.error('Firebase SW: Error opening window:', error);
//     })
//   );
// });