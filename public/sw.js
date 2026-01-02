const CACHE_NAME = 'rides911-v2-' + Date.now(); // Force refresh with timestamp
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

let spProfile = null;

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker - Message received:', event.data);
  
  if (event.data.type === 'REGISTER_SP_PROFILE') {
    spProfile = event.data.profile;
    console.log('Service Worker - SP Profile registered:', spProfile);
  }
  
  if (event.data.type === 'NEW_CLIENT_REQUEST') {
    console.log('Service Worker - New client request received:', event.data.request);
    
    if (spProfile) {
      const request = event.data.request;
      
      // Apply geographic and service filtering
      const shouldNotify = checkShouldNotify(spProfile, request);
      console.log('Service Worker - Should notify:', shouldNotify);
      
      if (shouldNotify) {
        console.log('Service Worker - Showing notification for request:', request['client-request-id']);
        self.registration.showNotification('New Request', {
          body: 'Press to open SP Dashboard',
          icon: '/icon-192x192.png',
          requireInteraction: true,
          tag: 'ride-request-' + request['client-request-id']
        });
      }
    } else {
      console.log('Service Worker - No SP profile available');
    }
  }
});

// Handle notification clicks - simplified test
self.addEventListener('notificationclick', function(event) {
  console.log('SW: Notification clicked!');
  event.notification.close();
  
  // Simple window open without promises
  self.clients.openWindow('https://rides911.com/dashboard?from=notification');
});

// Handle push events for testing
self.addEventListener('push', (event) => {
  console.log('SW: Push event received');
  
  event.waitUntil(
    self.registration.showNotification('Test Notification', {
      body: 'Click me to test notification handler',
      icon: '/icon-192x192.png',
      requireInteraction: true,
      tag: 'test-notification'
    })
  );
});



// Geographic filtering function
function checkShouldNotify(spProfile, request) {
  console.log('Service Worker - Filtering check:', {
    spServices: spProfile.serviceTypes,
    requestService: request.transportType,
    spLocation: spProfile.location,
    requestLocation: { lat: request.pickupLatitude, lng: request.pickupLongitude }
  });
  
  // Check service type
  if (!spProfile.serviceTypes.includes(request.transportType)) {
    console.log('Service Worker - Service type mismatch');
    return false;
  }
  
  // Check coordinates
  if (!spProfile.location || !request.pickupLatitude || !request.pickupLongitude) {
    console.log('Service Worker - Missing coordinates');
    return false;
  }
  
  // Calculate distance
  const distance = calculateDistance(
    spProfile.location,
    { latitude: request.pickupLatitude, longitude: request.pickupLongitude }
  );
  
  console.log('Service Worker - Distance calculated:', distance, 'km');
  return distance <= 10; // 10km radius
}

// Distance calculation
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}