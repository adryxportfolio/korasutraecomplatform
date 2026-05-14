export const GST_RATE = 0.05;

export type CheckoutTotalInput = {
  subtotal: number;
  discountAmount?: number;
  codSurcharge?: number;
};

export type CheckoutTotals = {
  taxableAmount: number;
  gstAmount: number;
  total: number;
};

export function calculateCheckoutTotals({
  subtotal,
  discountAmount = 0,
  codSurcharge = 0,
}: CheckoutTotalInput): CheckoutTotals {
  const taxableAmount = roundMoney(Math.max(0, Number(subtotal || 0) - Number(discountAmount || 0)));
  const gstAmount = roundMoney(taxableAmount * GST_RATE);
  const total = roundMoney(taxableAmount + gstAmount + Number(codSurcharge || 0));

  return {
    taxableAmount,
    gstAmount,
    total,
  };
}

export function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
