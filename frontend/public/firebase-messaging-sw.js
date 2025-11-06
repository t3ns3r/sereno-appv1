// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'SERENO';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.type || 'sereno-notification',
    data: payload.data || {},
    actions: [],
    requireInteraction: payload.data?.type === 'emergency_alert',
    vibrate: payload.data?.type === 'emergency_alert' ? [200, 100, 200, 100, 200] : [100, 50, 100]
  };

  // Add actions based on notification type
  if (payload.data?.type === 'emergency_alert') {
    notificationOptions.actions = [
      {
        action: 'respond',
        title: 'Responder',
        icon: '/icons/respond-icon.png'
      },
      {
        action: 'view_details',
        title: 'Ver Detalles'
      }
    ];
  } else if (payload.data?.type === 'daily_reminder') {
    notificationOptions.actions = [
      {
        action: 'open_mood',
        title: 'Registrar Estado'
      },
      {
        action: 'open_tracking',
        title: 'Seguimiento'
      }
    ];
  } else if (payload.data?.type === 'activity_update') {
    notificationOptions.actions = [
      {
        action: 'view_activity',
        title: 'Ver Actividad'
      },
      {
        action: 'view_board',
        title: 'Ver Todas'
      }
    ];
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});