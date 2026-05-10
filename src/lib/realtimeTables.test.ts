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
      "customer_activities",
      "customer_addresses",
      "inventory_movements",
      "site_settings",
      "journal_articles",
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

  test("filters broadcast refreshes to the subscribed tables and reports channel status", async () => {
    const broadcastCallbacks: Array<(payload: { payload?: { action: string; table?: string } }) => void> = [];
    const statuses: string[] = [];
    let refreshes = 0;
    const client = {
      channel: () => {
        const channel = {
          on: (type: string, _filter: unknown, callback: (payload: { payload?: { action: string; table?: string } }) => void) => {
            if (type === "broadcast") broadcastCallbacks.push(callback);
            return channel;
          },
          subscribe: (callback?: (status: string) => void) => {
            callback?.("SUBSCRIBED");
            return channel;
          },
        };
        return channel;
      },
      removeChannel: () => undefined,
    };

    const unsubscribe = subscribeToCommerceRealtime(
      client,
      "orders-only",
      () => {
        refreshes += 1;
      },
      ["orders"],
      { debounceMs: 0, onStatusChange: (status) => statuses.push(status) },
    );

    broadcastCallbacks[0]({ payload: { action: "product-updated", table: "products" } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(refreshes).toBe(0);

    broadcastCallbacks[0]({ payload: { action: "order-created", table: "orders" } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(refreshes).toBe(1);
    expect(statuses).toContain("connected");

    unsubscribe();
    expect(statuses.at(-1)).toBe("disconnected");
  });
});
