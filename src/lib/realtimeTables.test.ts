import { describe, expect, test } from "bun:test";
import {
  COMMERCE_BROADCAST_EVENT,
  COMMERCE_REALTIME_CHANNEL,
  storefrontRealtimeTables,
  subscribeToCommerceRealtime,
} from "./realtimeTables";

describe("storefrontRealtimeTables", () => {
  test("covers catalog, inventory, coupon, and order surfaces updated from admin", () => {
    expect(storefrontRealtimeTables).toEqual([
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
      "customer_addresses",
      "inventory_movements",
      "site_settings",
    ]);
  });

  test("uses a shared commerce broadcast topic for immediate cross-screen refreshes", () => {
    expect(COMMERCE_REALTIME_CHANNEL).toBe("commerce-sync");
    expect(COMMERCE_BROADCAST_EVENT).toBe("commerce-updated");
  });

  test("subscribes to the shared broadcast topic regardless of page channel name", () => {
    const channelNames: string[] = [];
    const removedChannels: unknown[] = [];
    const client = {
      channel: (name: string) => {
        const channel = {
          on: () => channel,
          subscribe: () => channel,
        };
        channelNames.push(name);
        return channel;
      },
      removeChannel: (channel: unknown) => removedChannels.push(channel),
    };

    const unsubscribe = subscribeToCommerceRealtime(client, "admin-commerce-sync", () => undefined, ["orders"]);
    unsubscribe();

    expect(channelNames).toEqual(["admin-commerce-sync", COMMERCE_REALTIME_CHANNEL]);
    expect(removedChannels).toHaveLength(2);
  });
});
