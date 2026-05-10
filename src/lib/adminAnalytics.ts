export type AdminOrder = {
  id: string;
  order_number?: string | null;
  customer_id?: string | null;
  total?: number | string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  status?: string | null;
  placed_at?: string | null;
  created_at?: string | null;
  order_items?: Array<{ sku?: string | null; created_at?: string | null }>;
};

export type AdminCustomer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  country_code?: string | null;
  email?: string | null;
  is_verified?: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type CustomerActivity = {
  id?: string;
  customer_id?: string | null;
  activity_type?: string | null;
  sku?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type AdminDataShape = {
  orders?: AdminOrder[];
  inventory?: Array<{ inventory_qty?: number | string | null }>;
  customers?: AdminCustomer[];
  customerActivities?: CustomerActivity[];
};

export type SalesRange = {
  start?: string;
  end?: string;
};

export function shouldUseLocalAdminFallback(params: { isLocalAdmin: boolean; hadRemoteError?: boolean; remoteProducts?: unknown[] }) {
  return params.isLocalAdmin || Boolean(params.hadRemoteError && (!params.remoteProducts || params.remoteProducts.length === 0));
}

function orderTimestamp(order: AdminOrder) {
  return order.placed_at || order.created_at || "";
}

function isLiveOrder(order: AdminOrder) {
  return !["cancelled", "refunded"].includes(String(order.status || ""));
}

function isRevenueOrder(order: AdminOrder) {
  return isLiveOrder(order) && !["failed", "refunded"].includes(String(order.payment_status || ""));
}

function isSameLocalDay(value: string, now: Date) {
  if (!value) return false;
  return new Date(value).toDateString() === now.toDateString();
}

function inRange(value: string, range: SalesRange) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (range.start && time < new Date(`${range.start}T00:00:00`).getTime()) return false;
  if (range.end && time > new Date(`${range.end}T23:59:59.999`).getTime()) return false;
  return true;
}

export function calculateAdminStats(data: AdminDataShape, now = new Date()) {
  const orders = data.orders || [];
  const todayOrders = orders.filter((order) => isLiveOrder(order) && isSameLocalDay(orderTimestamp(order), now));
  const todayRevenueOrders = todayOrders.filter(isRevenueOrder);
  const lifetimeRevenueOrders = orders.filter(isRevenueOrder);

  return {
    ordersToday: todayOrders.length,
    revenueToday: todayRevenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    pendingFulfilment: orders.filter((order) => isLiveOrder(order) && ["confirmed", "processing"].includes(String(order.status || ""))).length,
    lowStock: (data.inventory || []).filter((variant) => Number(variant.inventory_qty || 0) <= 2).length,
    lifetimeRevenue: lifetimeRevenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
  };
}

export function calculateSalesSummary(orders: AdminOrder[] = [], range: SalesRange = {}) {
  const filtered = orders.filter((order) => isRevenueOrder(order) && inRange(orderTimestamp(order), range));
  const revenue = filtered.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return {
    orders: filtered.length,
    revenue,
    averageOrderValue: filtered.length ? revenue / filtered.length : 0,
    paidOrders: filtered.filter((order) => order.payment_status === "paid").length,
    codOrders: filtered.filter((order) => order.payment_method === "cod").length,
  };
}

function latestBy<T>(items: T[], getDate: (item: T) => string | null | undefined) {
  return [...items].sort((a, b) => new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime())[0] || null;
}

function skuList(items: Array<{ sku?: string | null }> = []) {
  return items.map((item) => item.sku).filter(Boolean).join(", ");
}

export function customerActivityLabel(customer: AdminCustomer, orders: AdminOrder[] = [], activities: CustomerActivity[] = []) {
  const customerOrders = orders.filter((order) => order.customer_id === customer.id);
  const latestOrder = latestBy(customerOrders, orderTimestamp);
  const latestActivity = latestBy(
    activities.filter((activity) => activity.customer_id === customer.id),
    (activity) => activity.created_at,
  );

  if (latestOrder && (!latestActivity || new Date(orderTimestamp(latestOrder)).getTime() >= new Date(latestActivity.created_at || 0).getTime())) {
    const skus = skuList(latestOrder.order_items || []);
    return {
      type: "Checkout",
      detail: skus ? `SKU: ${skus}` : latestOrder.order_number || "",
      at: orderTimestamp(latestOrder),
    };
  }

  if (latestActivity?.activity_type === "product_added_to_cart") {
    return {
      type: "Product Added to Cart",
      detail: latestActivity.sku ? `SKU: ${latestActivity.sku}` : String(latestActivity.metadata?.sku || ""),
      at: latestActivity.created_at || "",
    };
  }

  if (latestActivity?.activity_type === "checkout") {
    return {
      type: "Checkout",
      detail: latestActivity.sku ? `SKU: ${latestActivity.sku}` : String(latestActivity.metadata?.sku || ""),
      at: latestActivity.created_at || "",
    };
  }

  return {
    type: "Just Visit",
    detail: "",
    at: latestActivity?.created_at || customer.updated_at || customer.created_at || "",
  };
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCustomerExportCsv(customers: AdminCustomer[] = [], orders: AdminOrder[] = [], activities: CustomerActivity[] = []) {
  const rows = customers.map((customer) => {
    const activity = customerActivityLabel(customer, orders, activities);
    return [
      customer.name || "",
      `${customer.country_code || ""} ${customer.phone || ""}`.trim(),
      customer.email || "",
      customer.is_verified ? "Yes" : "No",
      activity.type,
      activity.detail,
      activity.at,
    ].map(csvCell).join(",");
  });

  return [
    ["Name", "Phone", "Email", "OTP Verified", "Last Activity", "Activity Detail", "Last Activity At"].join(","),
    ...rows,
  ].join("\n");
}
