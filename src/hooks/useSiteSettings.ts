import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "@/lib/siteSettings";

type SiteSettingsQueryClient = {
  from: (table: "site_settings") => {
    select: (columns: string) => {
      eq: (column: "id", value: "global") => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  const loadSettings = useCallback(async () => {
    try {
      const client = supabase as unknown as SiteSettingsQueryClient;
      const { data, error } = await client
        .from("site_settings")
        .select("hero, navbar, promo_popup")
        .eq("id", "global")
        .maybeSingle();
      if (error) throw error;
      setSettings(normalizeSiteSettings(data as Parameters<typeof normalizeSiteSettings>[0]));
    } catch (error) {
      console.error("Unable to load site settings:", error);
      setSettings(defaultSiteSettings);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    const channel = supabase
      .channel("site-settings-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, loadSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSettings]);

  return settings;
}
