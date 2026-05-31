import { describe, expect, test } from "bun:test";
import {
  buildCustomerExportCsv,
  calculateAdminStats,
  calculateSalesSummary,
  canUseLocalAdminMode,
  customerActivityLabel,
  shouldUseLocalAdminFallback,
} from "./adminAnalytics";

const now = new Date("2026-05-10T12:00:00+05:30");

describe("admin analytics", () => {
  test("does not replace successful remote admin payloads with local fallback just because products are empty", () => {
    expect(shouldUseLocalAdminFallback({ isLocalAdmin: false, hadRemoteError: false, remoteProducts: [] })).toBe(false);
    expect(shouldUseLocalAdminFallback({ isLocalAdmin: true, hadRemoteError: false, remoteProducts: [] })).toBe(true);
  });

  test("only accepts local admin tokens when fallback mode is explicitly enabled", () => {
    expect(canUseLocalAdminMode("local-admin-123", false)).toBe(false);
    expect(canUseLocalAdminMode("local-admin-123", true)).toBe(true);
    expect(canUseLocalAdminMode("remote-session-token", true)).toBe(false);
  });

  test("calculates dashboard metrics from live orders and fulfillment states", () => {
    const stats = calculateAdminStats({
      inventory: [{ inventory_qty: 1 }, { inventory_qty: 4 }],
      orders: [
        { id: "o1", total: 1200, status: "confirmed", payment_status: "paid", created_at: "2026-05-10T03:00:00.000Z" },
        { id: "o2", total: 800, status: "processing", payment_status: "pending", payment_method: "cod", created_at: "2026-05-10T04:00:00.000Z" },
        { id: "o3", total: 999, status: "cancelled", payment_status: "paid", created_at: "2026-05-10T05:00:00.000Z" },
      ],
    }, now);

    expect(stats.ordersToday).toBe(2);
    expect(stats.revenueToday).toBe(2000);
    expect(stats.pendingFulfilment).toBe(2);
    expect(stats.lowStock).toBe(1);
  });

  test("summarizes real sales for a date range including live COD orders", () => {
    const summary = calculateSalesSummary([
      { id: "o1", total: 1000, status: "delivered", payment_status: "paid", payment_method: "razorpay", created_at: "2026-05-08T12:00:00.000Z" },
      { id: "o2", total: 500, status: "confirmed", payment_status: "pending", payment_method: "cod", created_at: "2026-05-09T12:00:00.000Z" },
      { id: "o3", total: 700, status: "cancelled", payment_status: "paid", payment_method: "razorpay", created_at: "2026-05-09T13:00:00.000Z" },
    ], { start: "2026-05-08", end: "2026-05-09" });

    expect(summary.revenue).toBe(1500);
    expect(summary.orders).toBe(2);
    expect(summary.averageOrderValue).toBe(750);
    expect(summary.paidOrders).toBe(1);
    expect(summary.codOrders).toBe(1);
  });

  test("prefers checkout activity with order SKUs over older cart activity", () => {
    const customer = { id: "c1", name: "Ananya", updated_at: "2026-05-09T09:00:00.000Z" };
    const label = customerActivityLabel(
      customer,
      [{ id: "o1", customer_id: "c1", created_at: "2026-05-10T09:00:00.000Z", order_items: [{ sku: "KS-RED" }] }],
      [{ customer_id: "c1", activity_type: "product_added_to_cart", sku: "KS-BLUE", created_at: "2026-05-09T09:00:00.000Z" }],
    );

    expect(label).toEqual({ type: "Checkout", detail: "SKU: KS-RED", at: "2026-05-10T09:00:00.000Z" });
  });

  test("labels a verified customer cart snapshot as an abandoned cart until an order appears", () => {
    const customer = { id: "c1", name: "Ananya", updated_at: "2026-05-09T09:00:00.000Z" };
    const label = customerActivityLabel(
      customer,
      [],
      [{
        customer_id: "c1",
        activity_type: "cart_snapshot",
        sku: "KS-BLUE, KS-GOLD",
        metadata: { itemCount: 2 },
        created_at: "2026-05-10T08:30:00.000Z",
      }],
    );

    expect(label).toEqual({ type: "Abandoned Cart", detail: "SKU: KS-BLUE, KS-GOLD", at: "2026-05-10T08:30:00.000Z" });
  });

  test("does not label an empty cart snapshot as abandoned", () => {
    const customer = { id: "c1", name: "Ananya", updated_at: "2026-05-09T09:00:00.000Z" };
    const label = customerActivityLabel(
      customer,
      [],
      [{
        customer_id: "c1",
        activity_type: "cart_snapshot",
        metadata: { itemCount: 0, items: [] },
        created_at: "2026-05-10T08:35:00.000Z",
      }],
    );

    expect(label).toEqual({ type: "Cart Cleared", detail: "", at: "2026-05-10T08:35:00.000Z" });
  });

  test("exports customer data with escaped CSV fields", () => {
    const csv = buildCustomerExportCsv([
      { id: "c1", name: "Riya, Sen", phone: "7416644554", country_code: "+91", email: "", is_verified: true, updated_at: "2026-05-10T09:00:00.000Z" },
    ]);

    expect(csv).toContain('"Riya, Sen",+91 7416644554,,Yes,Just Visit');
  });
});
