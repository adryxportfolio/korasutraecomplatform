/* eslint-disable @typescript-eslint/no-explicit-any */
export type CouponLine = {
  productId: string;
  categorySlug?: string | null;
  unitPrice: number;
  quantity: number;
  isSaleItem?: boolean;
  tags?: string[];
};

export type CouponEvaluationContext = {
  items: CouponLine[];
  subtotal: number;
  shippingAmount: number;
  customerOrderCount: number;
  customerUsageCount: number;
};

export function normalizeCouponCode(code: string) {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

export function couponRowToDomain(row: any, customerUsageCount = 0) {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value || 0),
    maxDiscountCap: row.max_discount_cap == null ? null : Number(row.max_discount_cap),
    minOrderValue: row.min_order_value == null ? null : Number(row.min_order_value),
    usageLimitTotal: row.usage_limit_total,
    usageLimitPerCustomer: row.usage_limit_per_customer,
    usageCount: Number(row.usage_count || 0),
    customerUsageCount,
    firstOrderOnly: Boolean(row.first_order_only),
    startAt: row.start_at,
    endAt: row.end_at,
    neverExpires: Boolean(row.never_expires),
    appliesTo: row.applies_to || "all",
    includedProductIds: row.included_product_ids || [],
    includedCategorySlugs: row.included_category_slugs || [],
    includedTags: row.included_tags || [],
    excludedProductIds: row.excluded_product_ids || [],
    excludedCategorySlugs: row.excluded_category_slugs || [],
    excludeSaleItems: Boolean(row.exclude_sale_items),
    canCombineWithSalePrices: row.can_combine_with_sale_prices !== false,
    buyQuantity: row.buy_quantity,
    getQuantity: row.get_quantity,
  };
}

export function evaluateCoupon(coupon: ReturnType<typeof couponRowToDomain>, context: CouponEvaluationContext, now = new Date()) {
  const current = isCouponCurrentlyValid(coupon, now);
  if (!current.valid) return invalid(current.reason);

  if (coupon.firstOrderOnly && context.customerOrderCount > 0) return invalid("Coupon is valid only on first orders");
  if (coupon.minOrderValue != null && context.subtotal < Number(coupon.minOrderValue)) {
    return invalid(`Minimum order value is ${Number(coupon.minOrderValue).toFixed(0)}`);
  }

  const eligibleItems = context.items.filter((item) => itemIsEligible(coupon, item));
  const eligibleSubtotal = roundMoney(eligibleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  if (eligibleSubtotal <= 0 && coupon.discountType !== "free_shipping") return invalid("Coupon does not apply to these items");

  let discountAmount = 0;
  let shippingDiscountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = eligibleSubtotal * (Number(coupon.discountValue) / 100);
    if (coupon.maxDiscountCap != null) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountCap));
  }
  if (coupon.discountType === "fixed_amount") discountAmount = Math.min(Number(coupon.discountValue), eligibleSubtotal);
  if (coupon.discountType === "free_shipping") shippingDiscountAmount = Math.max(0, Number(context.shippingAmount || 0));
  if (coupon.discountType === "buy_x_get_y") {
    discountAmount = calculateBuyXGetYDiscount(eligibleItems, Number(coupon.buyQuantity || 0), Number(coupon.getQuantity || 0));
  }

  return {
    valid: true,
    discountAmount: roundMoney(discountAmount),
    shippingDiscountAmount: roundMoney(shippingDiscountAmount),
    eligibleSubtotal,
  };
}

function isCouponCurrentlyValid(coupon: ReturnType<typeof couponRowToDomain>, now: Date) {
  if (coupon.status !== "active") return { valid: false, reason: "Coupon is inactive" };
  if (coupon.startAt && new Date(coupon.startAt) > now) return { valid: false, reason: "Coupon is not active yet" };
  if (!coupon.neverExpires && coupon.endAt && new Date(coupon.endAt) < now) return { valid: false, reason: "Coupon has expired" };
  if (coupon.usageLimitTotal != null && Number(coupon.usageCount || 0) >= Number(coupon.usageLimitTotal)) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }
  if (coupon.usageLimitPerCustomer != null && Number(coupon.customerUsageCount || 0) >= Number(coupon.usageLimitPerCustomer)) {
    return { valid: false, reason: "Customer usage limit reached" };
  }
  return { valid: true };
}

function itemIsEligible(coupon: ReturnType<typeof couponRowToDomain>, item: CouponLine) {
  if (coupon.excludedProductIds.includes(item.productId)) return false;
  if (item.categorySlug && coupon.excludedCategorySlugs.includes(item.categorySlug)) return false;
  if ((coupon.excludeSaleItems || coupon.canCombineWithSalePrices === false) && item.isSaleItem) return false;

  if (coupon.appliesTo === "all") return true;
  if (coupon.appliesTo === "specific_products") return coupon.includedProductIds.includes(item.productId);
  if (coupon.appliesTo === "specific_categories") return Boolean(item.categorySlug && coupon.includedCategorySlugs.includes(item.categorySlug));

  const tags = new Set(item.tags || []);
  return coupon.includedTags.some((tag: string) => tags.has(tag));
}

function calculateBuyXGetYDiscount(items: CouponLine[], buyQuantity: number, getQuantity: number) {
  if (buyQuantity < 1 || getQuantity < 1) return 0;
  const unitPrices = items.flatMap((item) => Array.from({ length: item.quantity }, () => item.unitPrice)).sort((a, b) => a - b);
  const freeUnits = Math.floor(unitPrices.length / (buyQuantity + getQuantity)) * getQuantity;
  return roundMoney(unitPrices.slice(0, freeUnits).reduce((sum, price) => sum + price, 0));
}

function invalid(reason = "Coupon is invalid") {
  return { valid: false, reason, discountAmount: 0, shippingDiscountAmount: 0, eligibleSubtotal: 0 };
}

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
