import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SITE_SETTINGS_BROADCAST_EVENT,
  SITE_SETTINGS_CHANGED_EVENT,
  SITE_SETTINGS_REALTIME_CHANNEL,
  SITE_SETTINGS_STORAGE_KEY,
  cacheSiteSettings,
  defaultSiteSettings,
  normalizeSiteSettings,
  readCachedSiteSettings,
  type SiteSettings,
} from "@/lib/siteSettings";

type SiteSettingsQueryClient = {
  from: (table: "site_settings") => {
    select: (columns: string) => {
      eq: (column: "id", value: "global") => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

type SiteSettingsRealtimeChannel = {
  on: (
    event: "postgres_changes" | "broadcast",
    filter: Record<string, unknown>,
    callback: (payload?: { payload?: { settings?: Parameters<typeof normalizeSiteSettings>[0] } }) => void,
  ) => SiteSettingsRealtimeChannel;
  subscribe: () => SiteSettingsRealtimeChannel;
};

type SiteSettingsRealtimeClient = {
  channel: (name: string, options?: Record<string, unknown>) => SiteSettingsRealtimeChannel;
  removeChannel: (channel: SiteSettingsRealtimeChannel) => void;
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => readCachedSiteSettings() || defaultSiteSettings);

  const applySettings = useCallback((value: Parameters<typeof normalizeSiteSettings>[0]) => {
    const nextSettings = normalizeSiteSettings(value);
    setSettings(nextSettings);
    cacheSiteSettings(nextSettings);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const client = supabase as unknown as SiteSettingsQueryClient;
      const { data, error } = await client
        .from("site_settings")
        .select("hero, navbar, promo_popup")
        .eq("id", "global")
        .maybeSingle();
      if (error) throw error;
      applySettings(data as Parameters<typeof normalizeSiteSettings>[0]);
    } catch (error) {
      console.error("Unable to load site settings:", error);
      const cachedSettings = readCachedSiteSettings();
      if (cachedSettings) setSettings(cachedSettings);
    }
  }, [applySettings]);

  useEffect(() => {
    loadSettings();
    const realtimeClient = supabase as unknown as SiteSettingsRealtimeClient;
    const channel = realtimeClient
      .channel(SITE_SETTINGS_REALTIME_CHANNEL, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: SITE_SETTINGS_BROADCAST_EVENT }, (event) => {
        if (event?.payload?.settings) applySettings(event.payload.settings);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, loadSettings)
      .subscribe();

    const syncCachedSettings = (event?: StorageEvent | Event) => {
      if (event instanceof StorageEvent && event.key !== SITE_SETTINGS_STORAGE_KEY) return;
      const cachedSettings = readCachedSiteSettings();
      if (cachedSettings) setSettings(cachedSettings);
    };

    const syncCustomSettings = (event: Event) => {
      const settingsEvent = event as CustomEvent<{ settings?: SiteSettings }>;
      if (settingsEvent.detail?.settings) setSettings(settingsEvent.detail.settings);
    };

    window.addEventListener("storage", syncCachedSettings);
    window.addEventListener(SITE_SETTINGS_CHANGED_EVENT, syncCustomSettings);

    return () => {
      window.removeEventListener("storage", syncCachedSettings);
      window.removeEventListener(SITE_SETTINGS_CHANGED_EVENT, syncCustomSettings);
      realtimeClient.removeChannel(channel);
    };
  }, [applySettings, loadSettings]);

  return settings;
}
