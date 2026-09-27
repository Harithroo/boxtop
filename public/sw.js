// Boxtop service worker: push notifications only (no offline caching yet).
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : { title: "Boxtop", body: "" };
  e.waitUntil(self.registration.showNotification(d.title || "Boxtop", { body: d.body, icon: "/icon.svg", badge: "/icon.svg", data: { url: d.url || "/" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
