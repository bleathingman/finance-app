// public/firebase-messaging-sw.js
//
// ⚠️  Les variables import.meta.env ne sont PAS disponibles dans un Service Worker.
//     Colle ici les valeurs réelles de ta config Firebase (elles sont publiques).
//     Où les trouver :
//     Firebase Console → Paramètres du projet → Vos applications → Config

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            '__VITE_FIREBASE_API_KEY__',
  authDomain:        '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId:         '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket:     '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId:             '__VITE_FIREBASE_APP_ID__'
})

const messaging = firebase.messaging()

// ─── Notifications reçues quand l'app est fermée / en arrière-plan ──
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {}
  const data = payload.data || {}

  self.registration.showNotification(title || 'FinanceFlow', {
    body:    body || '',
    icon:    icon || '/icons/icon-192x192.png',
    badge:   '/icons/badge-72x72.png',
    tag:     data.type || 'financeflow',
    data:    { url: data.lien || '/' },
    actions: data.lien ? [{ action: 'open', title: 'Voir →' }] : [],
    vibrate: [100, 50, 100],
  })
})

// ─── Clic sur la notification native ──────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('navigate' in client) return client.navigate(url).then(c => c?.focus())
      }
      return clients.openWindow(url)
    })
  )
})
