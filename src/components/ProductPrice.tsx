import { formatPrice } from "@/lib/shopify";
import { cn } from "@/lib/utils";
import { getPriceDisplay } from "@/lib/productPricing";

type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductPriceProps = {
  price: Money;
  compareAtPrice?: Money | null;
  showDiscount?: boolean;
  className?: string;
  priceClassName?: string;
  compareAtClassName?: string;
  discountClassName?: string;
};

export function ProductPrice({
  price,
  compareAtPrice,
  showDiscount = true,
  className,
  priceClassName,
  compareAtClassName,
  discountClassName,
}: ProductPriceProps) {
  const display = getPriceDisplay(price.amount, compareAtPrice?.amount);
  const currencyCode = price.currencyCode || compareAtPrice?.currencyCode || "INR";

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1 font-price", className)}>
      {display.isDiscounted && display.compareAtAmount !== null && (
        <span className={cn("text-muted-foreground line-through", compareAtClassName)}>
          {formatPrice(String(display.compareAtAmount), currencyCode)}
        </span>
      )}
      <span className={cn("font-medium text-foreground", priceClassName)}>
        {formatPrice(String(display.priceAmount), currencyCode)}
      </span>
      {showDiscount && display.discountPercentage !== null && (
        <span className={cn("text-xs font-body font-medium text-green-700", discountClassName)}>
          ({display.discountPercentage}% off)
        </span>
      )}
    </div>
  );
}
