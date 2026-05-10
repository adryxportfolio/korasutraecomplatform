import { describe, expect, test } from "bun:test";
import {
  browserPostgresRealtimeTables,
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

  test("keeps browser postgres subscriptions limited to public storefront tables", () => {
    expect(browserPostgresRealtimeTables).toEqual([
      "categories",
      "products",
      "product_images",
      "product_videos",
      "product_variants",
      "coupons",
      "site_settings",
      "journal_articles",
    ]);
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

    expect(channelNames).toEqual([COMMERCE_REALTIME_CHANNEL]);
    expect(removedChannels).toHaveLength(1);
  });

  test("subscribes to direct postgres changes only for browser-safe tables", () => {
    const postgresTables: string[] = [];
    const channelNames: string[] = [];
    const client = {
      channel: (name: string) => {
        const channel = {
          on: (type: string, filter: { table?: string } | { event: string }, _callback?: unknown) => {
            if (type === "postgres_changes" && "table" in filter && filter.table) postgresTables.push(filter.table);
            return channel;
          },
          subscribe: () => channel,
        };
        channelNames.push(name);
        return channel;
      },
      removeChannel: () => undefined,
    };

    const unsubscribe = subscribeToCommerceRealtime(client, "mixed-sync", () => undefined, ["orders", "customers", "products", "journal_articles"]);
    unsubscribe();

    expect(channelNames).toEqual(["mixed-sync", COMMERCE_REALTIME_CHANNEL]);
    expect(postgresTables).toEqual(["products", "journal_articles"]);
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

  test("keeps the dashboard status connected when postgres realtime is connected and broadcast closes", () => {
    const statuses: string[] = [];
    const client = {
      channel: (name: string) => {
        const channel = {
          on: () => channel,
          subscribe: (callback?: (status: string) => void) => {
            callback?.(name === "catalog-sync" ? "SUBSCRIBED" : "CLOSED");
            return channel;
          },
        };
        return channel;
      },
      removeChannel: () => undefined,
    };

    const unsubscribe = subscribeToCommerceRealtime(
      client,
      "catalog-sync",
      () => undefined,
      ["products"],
      { onStatusChange: (status) => statuses.push(status) },
    );

    expect(statuses).toContain("connected");
    expect(statuses.at(-1)).toBe("connected");
    unsubscribe();
  });
});
