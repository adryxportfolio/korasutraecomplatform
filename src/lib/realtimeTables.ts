export const storefrontRealtimeTables = [
  "categories",
  "products",
  "product_images",
  "product_videos",
  "product_variants",
  "coupons",
  "coupon_redemptions",
  "orders",
  "order_items",
  "customers",
  "customer_activities",
  "customer_addresses",
  "inventory_movements",
  "site_settings",
  "journal_articles",
] as const;

export const browserPostgresRealtimeTables = [
  "categories",
  "products",
  "product_images",
  "product_videos",
  "product_variants",
  "coupons",
  "site_settings",
  "journal_articles",
] as const;

export const COMMERCE_REALTIME_CHANNEL = "commerce-sync";
export const COMMERCE_BROADCAST_EVENT = "commerce-updated";

export type CommerceRealtimePayload = {
  action: string;
  table?: string;
  tables?: string[];
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  productId?: string;
  couponId?: string;
  journalId?: string;
  savedAt?: string;
};

export type CommerceRealtimeStatus = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

type RealtimeChannel = {
  on: (
    type: "postgres_changes" | "broadcast",
    filter: { event: "*"; schema: "public"; table: string } | { event: string },
    callback: (payload?: { payload?: CommerceRealtimePayload }) => void,
  ) => RealtimeChannel;
  subscribe: (callback?: (status: string) => void) => RealtimeChannel;
  send?: (payload: { type: "broadcast"; event: string; payload: CommerceRealtimePayload }) => Promise<unknown>;
};

type RealtimeClient = {
  channel: (name: string, options?: Record<string, unknown>) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => unknown;
};

type CommerceRealtimeOptions = {
  onStatusChange?: (status: CommerceRealtimeStatus) => void;
  debounceMs?: number;
};

function payloadMatchesTables(payload: CommerceRealtimePayload | undefined, tables: readonly string[]) {
  if (!payload?.table && !payload?.tables?.length) return true;
  const changedTables = [payload.table, ...(payload.tables || [])].filter(Boolean);
  return changedTables.some((table) => tables.includes(table as string));
}

function realtimeStatus(status: string): CommerceRealtimeStatus {
  if (status === "SUBSCRIBED") return "connected";
  if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") return "reconnecting";
  if (status === "CLOSED") return "disconnected";
  return "connecting";
}

function browserSafePostgresTables(tables: readonly string[]) {
  return tables.filter((table) => (browserPostgresRealtimeTables as readonly string[]).includes(table));
}

export function subscribeToStorefrontRealtime(
  supabaseClient: RealtimeClient,
  channelName: string,
  onChange: () => void,
  tables: readonly string[] = storefrontRealtimeTables,
  options: CommerceRealtimeOptions = {},
) {
  return subscribeToCommerceRealtime(supabaseClient, channelName, onChange, tables, options);
}

export function subscribeToCommerceRealtime(
  supabaseClient: RealtimeClient,
  channelName: string,
  onChange: (payload?: CommerceRealtimePayload) => void,
  tables: readonly string[] = storefrontRealtimeTables,
  options: CommerceRealtimeOptions = {},
) {
  options.onStatusChange?.("connecting");
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleChange = (payload?: CommerceRealtimePayload) => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => onChange(payload), options.debounceMs ?? 150);
  };

  const postgresTables = browserSafePostgresTables(tables);
  const postgresChannel = postgresTables.length
    ? postgresTables
      .reduce(
        (nextChannel, table) => nextChannel.on("postgres_changes", { event: "*", schema: "public", table }, () => scheduleChange({ action: "postgres-change", table })),
        supabaseClient.channel(channelName),
      )
      .subscribe()
    : null;

  const broadcastChannel = supabaseClient
    .channel(COMMERCE_REALTIME_CHANNEL, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: COMMERCE_BROADCAST_EVENT }, (event) => {
      if (payloadMatchesTables(event?.payload, tables)) scheduleChange(event?.payload);
    })
    .subscribe((status) => options.onStatusChange?.(realtimeStatus(status)));

  return () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    options.onStatusChange?.("disconnected");
    if (postgresChannel) supabaseClient.removeChannel(postgresChannel);
    supabaseClient.removeChannel(broadcastChannel);
  };
}

export async function broadcastCommerceChange(supabaseClient: RealtimeClient, payload: CommerceRealtimePayload) {
  const channel = supabaseClient.channel(COMMERCE_REALTIME_CHANNEL, { config: { broadcast: { self: true, ack: true } } });
  const message = {
    type: "broadcast" as const,
    event: COMMERCE_BROADCAST_EVENT,
    payload: { ...payload, savedAt: payload.savedAt || new Date().toISOString() },
  };

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      supabaseClient.removeChannel(channel);
      resolve();
    };
    const timeout = window.setTimeout(finish, 2500);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      try {
        await channel.send?.(message);
      } finally {
        finish();
      }
    });
  });
}
