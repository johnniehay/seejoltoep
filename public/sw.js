var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// declare const self as unknown as ServiceWorkerGlobalScope: ServiceWorkerGlobalScope;
var SWself = self;
SWself.addEventListener('push', function (event) {
    if (event.data) {
        var data = event.data.json();
        var d = Date.now();
        var options = {
            body: data.body,
            icon: data.icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [100, 50, 100],
            data: __assign({ dateOfArrival: Date.now(), primaryKey: '2' }, data),
        };
        event.waitUntil(SWself.registration.showNotification(data.title, options));
    }
});
SWself.addEventListener("install", function (event) {
    // The promise that skipWaiting() returns can be safely ignored.
    SWself.skipWaiting();
});
SWself.addEventListener('notificationclick', function (event) {
    var _a, _b;
    console.log('Notification click received.');
    var url = (_b = (_a = event.notification.data) === null || _a === void 0 ? void 0 : _a.url) !== null && _b !== void 0 ? _b : '/';
    event.notification.close();
    event.waitUntil(SWself.clients.openWindow(url));
});
