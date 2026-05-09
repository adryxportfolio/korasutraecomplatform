export const storefrontRealtimeTables = [
  "products",
  "product_images",
  "product_videos",
  "product_variants",
  "coupons",
  "coupon_redemptions",
  "orders",
  "order_items",
  "site_settings",
] as const;

type RealtimeChannel = {
  on: (type: "postgres_changes", filter: { event: "*"; schema: "public"; table: string }, callback: () => void) => RealtimeChannel;
  subscribe: () => RealtimeChannel;
};

type RealtimeClient = {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => unknown;
};

export function subscribeToStorefrontRealtime(supabaseClient: RealtimeClient, channelName: string, onChange: () => void) {
  const channel = storefrontRealtimeTables
    .reduce(
      (nextChannel, table) => nextChannel.on("postgres_changes", { event: "*", schema: "public", table }, onChange),
      supabaseClient.channel(channelName),
    )
    .subscribe();

  return () => {
    supabaseClient.removeChannel(channel);
  };
}
