export type CouponDiscountType = "percentage" | "fixed_amount" | "free_shipping" | "buy_x_get_y";
export type CouponStatus = "active" | "inactive";
export type CouponAppliesTo = "all" | "specific_products" | "specific_categories" | "specific_fabrics" | "specific_patterns" | "specific_occasions";

export type Coupon = {
  code: string;
  description?: string | null;
  status: CouponStatus;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountCap?: number | null;
  minOrderValue?: number | null;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer?: number | null;
  usageCount?: number | null;
  customerUsageCount?: number | null;
  firstOrderOnly?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  neverExpires?: boolean;
  appliesTo?: CouponAppliesTo;
  includedProductIds?: string[];
  includedCategorySlugs?: string[];
  includedTags?: string[];
  excludedProductIds?: string[];
  excludedCategorySlugs?: string[];
  excludeSaleItems?: boolean;
  canCombineWithSalePrices?: boolean;
  buyQuantity?: number | null;
  getQuantity?: number | null;
};

export type CouponCartItem = {
  productId: string;
  categorySlug?: string | null;
  unitPrice: number;
  quantity: number;
  isSaleItem?: boolean;
  tags?: string[];
};

export type CouponValidationContext = {
  items: CouponCartItem[];
  subtotal: number;
  shippingAmount: number;
  customerOrderCount?: number;
};

export type CouponDiscountResult = {
  valid: boolean;
  reason?: string;
  discountAmount: number;
  shippingDiscountAmount: number;
  eligibleSubtotal: number;
};

export function normalizeCouponCode(code: string) {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

export function isCouponCurrentlyValid(coupon: Coupon, now = new Date()): { valid: boolean; reason?: string } {
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

export function calculateCouponDiscount(coupon: Coupon, context: CouponValidationContext, now = new Date()): CouponDiscountResult {
  const current = isCouponCurrentlyValid(coupon, now);
  if (!current.valid) return invalid(current.reason);

  if (coupon.firstOrderOnly && Number(context.customerOrderCount || 0) > 0) {
    return invalid("Coupon is valid only on first orders");
  }

  if (coupon.minOrderValue != null && context.subtotal < Number(coupon.minOrderValue)) {
    return invalid(`Minimum order value is ${Number(coupon.minOrderValue).toFixed(0)}`);
  }

  const eligibleItems = context.items.filter((item) => itemIsEligible(coupon, item));
  const eligibleSubtotal = roundMoney(eligibleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  if (eligibleSubtotal <= 0 && coupon.discountType !== "free_shipping") {
    return invalid("Coupon does not apply to these items");
  }

  let discountAmount = 0;
  let shippingDiscountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = eligibleSubtotal * (Number(coupon.discountValue) / 100);
    if (coupon.maxDiscountCap != null) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountCap));
  }

  if (coupon.discountType === "fixed_amount") {
    discountAmount = Math.min(Number(coupon.discountValue), eligibleSubtotal);
  }

  if (coupon.discountType === "free_shipping") {
    shippingDiscountAmount = Math.max(0, Number(context.shippingAmount || 0));
  }

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

function invalid(reason = "Coupon is invalid"): CouponDiscountResult {
  return { valid: false, reason, discountAmount: 0, shippingDiscountAmount: 0, eligibleSubtotal: 0 };
}

function itemIsEligible(coupon: Coupon, item: CouponCartItem) {
  if (coupon.excludedProductIds?.includes(item.productId)) return false;
  if (item.categorySlug && coupon.excludedCategorySlugs?.includes(item.categorySlug)) return false;
  if ((coupon.excludeSaleItems || coupon.canCombineWithSalePrices === false) && item.isSaleItem) return false;

  const appliesTo = coupon.appliesTo || "all";
  if (appliesTo === "all") return true;
  if (appliesTo === "specific_products") return Boolean(coupon.includedProductIds?.includes(item.productId));
  if (appliesTo === "specific_categories") return Boolean(item.categorySlug && coupon.includedCategorySlugs?.includes(item.categorySlug));

  const tags = new Set(item.tags || []);
  return Boolean(coupon.includedTags?.some((tag) => tags.has(tag)));
}

function calculateBuyXGetYDiscount(items: CouponCartItem[], buyQuantity: number, getQuantity: number) {
  if (buyQuantity < 1 || getQuantity < 1) return 0;
  const unitPrices = items.flatMap((item) => Array.from({ length: item.quantity }, () => item.unitPrice)).sort((a, b) => a - b);
  const groupSize = buyQuantity + getQuantity;
  const freeUnits = Math.floor(unitPrices.length / groupSize) * getQuantity;
  return roundMoney(unitPrices.slice(0, freeUnits).reduce((sum, price) => sum + price, 0));
}

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
