export type PriceDisplay = {
  priceAmount: number;
  compareAtAmount: number | null;
  discountPercentage: number | null;
  savingsAmount: number | null;
  isDiscounted: boolean;
};

const COMPARE_AT_ERROR = "Compare-at Price must be higher than Price";

function toMoneyNumber(value: string | number | null | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round((amount + Number.EPSILON) * 100) / 100 : 0;
}

export function getPriceDisplay(
  price: string | number | null | undefined,
  compareAtPrice?: string | number | null,
): PriceDisplay {
  const priceAmount = toMoneyNumber(price);
  const compareAtAmount = compareAtPrice === null || compareAtPrice === undefined || compareAtPrice === ""
    ? null
    : toMoneyNumber(compareAtPrice);
  const isDiscounted = compareAtAmount !== null && compareAtAmount > priceAmount;
  const savingsAmount = isDiscounted ? toMoneyNumber(compareAtAmount - priceAmount) : null;

  return {
    priceAmount,
    compareAtAmount: isDiscounted ? compareAtAmount : null,
    discountPercentage: isDiscounted ? Math.round(((compareAtAmount - priceAmount) / compareAtAmount) * 100) : null,
    savingsAmount,
    isDiscounted,
  };
}

export function validateCompareAtPrice(
  price: string | number | null | undefined,
  compareAtPrice?: string | number | null,
) {
  if (compareAtPrice === null || compareAtPrice === undefined || compareAtPrice === "") return null;
  const priceAmount = toMoneyNumber(price);
  const compareAtAmount = toMoneyNumber(compareAtPrice);
  return compareAtAmount > priceAmount ? null : COMPARE_AT_ERROR;
}
