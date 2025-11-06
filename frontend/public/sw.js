// Service Worker for Push Notifications
const CACHE_NAME = 'sereno-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'SERENO',
    body: 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'sereno-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
    } catch (error) {
      console.error('Error parsing push payload:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions || [],
    requireInteraction: notificationData.data?.type === 'emergency_alert',
    vibrate: notificationData.data?.type === 'emergency_alert' ? [200, 100, 200, 100, 200] : [100, 50, 100]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action || data.action || 'default';

  let url = '/';

  // Handle different notification actions
  switch (action) {
    case 'respond':
    case 'respond_emergency':
      url = `/emergency/${data.alertId}`;
      break;
    case 'open_mood':
      url = '/mood-assessment';
      break;
    case 'open_tracking':
      url = '/daily-tracking';
      break;
    case 'open_chat':
      url = `/chat/${data.channelId || data.alertId}`;
      break;
    case 'view_activity':
      url = `/activities/${data.activityId}`;
      break;
    case 'view_board':
      url = '/activities';
      break;
    case 'view_details':
      url = `/emergency/${data.alertId}/details`;
      break;
    case 'view_location':
      url = `/emergency/${data.alertId}/location`;
      break;
    case 'view_help':
      url = '/help';
      break;
    default:
      url = '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);

  if (event.tag === 'emergency-sync') {
    event.waitUntil(
      // Handle emergency actions that were queued while offline
      handleEmergencySync()
    );
  } else if (event.tag === 'mood-sync') {
    event.waitUntil(
      // Handle mood entries that were queued while offline
      handleMoodSync()
    );
  }
});

// Handle emergency actions sync
async function handleEmergencySync() {
  try {
    // Get queued emergency actions from IndexedDB
    const queuedActions = await getQueuedEmergencyActions();
    
    for (const action of queuedActions) {
      try {
        await fetch('/api/v1/emergency/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action)
        });
        
        // Remove from queue after successful sync
        await removeFromEmergencyQueue(action.id);
      } catch (error) {
        console.error('Error syncing emergency action:', error);
      }
    }
  } catch (error) {
    console.error('Error in emergency sync:', error);
  }
}

// Handle mood entries sync
async function handleMoodSync() {
  try {
    // Get queued mood entries from IndexedDB
    const queuedEntries = await getQueuedMoodEntries();
    
    for (const entry of queuedEntries) {
      try {
        await fetch('/api/v1/mood/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry)
        });
        
        // Remove from queue after successful sync
        await removeFromMoodQueue(entry.id);
      } catch (error) {
        console.error('Error syncing mood entry:', error);
      }
    }
  } catch (error) {
    console.error('Error in mood sync:', error);
  }
}

// IndexedDB helper functions (simplified)
async function getQueuedEmergencyActions() {
  // Implementation would use IndexedDB to get queued actions
  return [];
}

async function removeFromEmergencyQueue(id) {
  // Implementation would remove item from IndexedDB
}

async function getQueuedMoodEntries() {
  // Implementation would use IndexedDB to get queued entries
  return [];
}

async function removeFromMoodQueue(id) {
  // Implementation would remove item from IndexedDB
}