
// npx tsc public/sw.ts --types --lib "webworker,es6" --outDir public
interface SWNotificationOptions extends NotificationOptions {
  title: string
  vibrate?: number[]
  timestamp?: number
  renotify?: boolean
  image?: string
  action?: {action:string, title:string, icon?:string}
  navigate?: string
}

// declare const self as unknown as ServiceWorkerGlobalScope: ServiceWorkerGlobalScope;
const SWself = self as unknown as ServiceWorkerGlobalScope
SWself.addEventListener('push', function (event) {
  if (event.data) {
    const data: SWNotificationOptions = event.data.json()
    const d = Date.now()
    const options: SWNotificationOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      ...data,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        ...data
      },
    }
    event.waitUntil(SWself.registration.showNotification(data.title, options))
  }
})

SWself.addEventListener("install", (event) => {
  // The promise that skipWaiting() returns can be safely ignored.
  SWself.skipWaiting();
})

SWself.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  const url = event.notification.data?.navigate ?? '/'
  event.notification.close()
  event.waitUntil(SWself.clients.openWindow(url))
})
