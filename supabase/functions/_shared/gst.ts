export const GST_RATE = 0.05;

export function calculateCheckoutTotals(input: {
  subtotal: number;
  discountAmount?: number;
  codSurcharge?: number;
}) {
  const taxableAmount = roundMoney(Math.max(0, Number(input.subtotal || 0) - Number(input.discountAmount || 0)));
  const gstAmount = roundMoney(taxableAmount * GST_RATE);
  const total = roundMoney(taxableAmount + gstAmount + Number(input.codSurcharge || 0));

  return { taxableAmount, gstAmount, total };
}

export function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
