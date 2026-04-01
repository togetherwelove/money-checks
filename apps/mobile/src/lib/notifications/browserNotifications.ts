export type BrowserNotificationPermissionState = NotificationPermission | "unsupported";

type BrowserNotificationContent = {
  body: string;
  tag?: string;
  title: string;
};

type BrowserNotificationAssets = {
  badge: string;
  icon: string;
};

export function readBrowserNotificationPermission(): BrowserNotificationPermissionState {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermissionState> {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return Notification.requestPermission();
}

export async function showBrowserNotification(
  content: BrowserNotificationContent,
  assets: BrowserNotificationAssets,
): Promise<boolean> {
  if (readBrowserNotificationPermission() !== "granted") {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    badge: assets.badge,
    body: content.body,
    icon: assets.icon,
  };
  if (content.tag) {
    notificationOptions.tag = content.tag;
  }

  const registration = await getServiceWorkerRegistration();
  if (registration) {
    await registration.showNotification(content.title, notificationOptions);
    return true;
  }

  if (!isBrowserNotificationSupported()) {
    return false;
  }

  new Notification(content.title, notificationOptions);
  return true;
}

function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && typeof Notification !== "undefined";
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}
