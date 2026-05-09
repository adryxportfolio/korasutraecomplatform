export const customerAccountLinks = [
  {
    label: "Order Status",
    href: "/order-tracking",
    description: "Track fulfilment, payment, and shipment progress.",
    icon: "status",
  },
  {
    label: "Order History",
    href: "/order-tracking?view=history",
    description: "Review recent purchases from your verified account.",
    icon: "history",
  },
  {
    label: "Refund Status",
    href: "/returns",
    description: "Check return and refund policy details.",
    icon: "refund",
  },
  {
    label: "Support",
    href: "/contact",
    description: "Get help from the Kora Sutra support team.",
    icon: "support",
  },
] as const;

export type CustomerAccountLink = (typeof customerAccountLinks)[number];
