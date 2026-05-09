import { ShoppingBag, MessageCircle, Loader2, Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/shopify';

export interface StickyMobileCartBarProps {
  price: {
    amount: string;
    currencyCode: string;
  };
  isAvailable: boolean;
  onBuyNow: () => void;
  onAddToCart: () => void;
  productTitle: string;
  isLoading?: boolean;
  sku?: string | null;
}

const WHATSAPP_NUMBER = '917995862266';

export function StickyMobileCartBar({ 
  price, 
  isAvailable,
  onBuyNow,
  onAddToCart,
  productTitle,
  isLoading = false,
  sku
}: StickyMobileCartBarProps) {
  const formattedSKU = sku || 'Waiting For Admin Changes';
  
  const handleEnquiry = () => {
    const message = `Hi, I'm interested in ${productTitle}.\n\nSKU: ${formattedSKU}\n\nCould you provide more details?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNotifyMe = () => {
    const message = `Hi, I'd like to be notified when this product is back in stock:\n\n*${productTitle}*\nSKU: ${formattedSKU}\n\nPlease notify me when it's available again.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border shadow-lg safe-area-inset-bottom">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Price */}
        <div className="flex-shrink-0 min-w-0">
          <p className="text-base font-price font-semibold leading-tight">
            {formatPrice(price.amount, price.currencyCode)}
          </p>
          {!isAvailable && (
            <p className="text-xs text-destructive font-body">Out of Stock</p>
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex-1 flex items-center gap-1.5 justify-end">
          {isAvailable ? (
            <>
              {/* WhatsApp Enquiry - Icon only on mobile for space */}
              <Button
                onClick={handleEnquiry}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              
              {/* Add to Cart */}
              <Button
                onClick={onAddToCart}
                variant="outline"
                className="h-10 px-3 text-xs font-body uppercase tracking-wider rounded-full border-foreground hover:bg-foreground hover:text-background"
              >
                <Plus className="w-4 h-4 mr-1" />
                Cart
              </Button>
              
              {/* Buy Now */}
              <Button
                onClick={onBuyNow}
                disabled={isLoading}
                className="h-10 px-3 text-xs font-body uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Buy Now
                  </>
                )}
              </Button>
            </>
          ) : (
            /* Notify Me Button - for out of stock items */
            <Button
              onClick={handleNotifyMe}
              className="h-10 px-4 text-xs font-body uppercase tracking-wider bg-[#25D366] hover:bg-[#1da851] text-white rounded-full"
            >
              <Bell className="w-4 h-4 mr-1.5" />
              Notify Me
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
