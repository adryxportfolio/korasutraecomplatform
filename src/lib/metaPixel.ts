export const META_PIXEL_IDS = [
  "1309757671041283",
  "1850165549038032",
  "1933328504239270",
] as const;

type Fbq = {
  (command: "init", pixelId: string): void;
  (command: "track", eventName: string, params?: Record<string, unknown>): void;
};

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export function metaPixelNoscriptUrl(pixelId: string) {
  return `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`;
}

export function trackMetaPageView(path?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false;

  if (path) {
    window.fbq("track", "PageView", { page_path: path });
  } else {
    window.fbq("track", "PageView");
  }

  return true;
}

export function trackMetaPixelPageView(path: string) {
  return trackMetaPageView(path);
}
