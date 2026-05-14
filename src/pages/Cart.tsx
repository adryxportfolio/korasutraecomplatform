import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Minus, Plus, ShoppingBag, Trash2, Lock, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SecureCheckoutBadges } from "@/components/SecureCheckoutBadges";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";
import {
  buildGa4CartPayload,
  trackGa4EcommerceEvent,
} from "@/lib/ga4Ecommerce";

function withQuantity(item: CartItem, quantity: number): CartItem {
  return { ...item, quantity };
}

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const lastViewedCartSignature = useRef("");
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number.parseFloat(item.price.amount) * item.quantity, 0),
    [items],
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const currencyCode = items[0]?.price.currencyCode || "INR";
  const cartSignature = JSON.stringify(items.map((item) => `${item.variantId}:${item.quantity}`));

  useEffect(() => {
    if (items.length === 0 || lastViewedCartSignature.current === cartSignature) return;
    lastViewedCartSignature.current = cartSignature;
    trackGa4EcommerceEvent("view_cart", buildGa4CartPayload(items));
  }, [cartSignature, items]);

  const handleQuantityChange = (item: CartItem, nextQuantity: number) => {
    const clampedQuantity = Math.min(Math.max(nextQuantity, 0), item.maxQuantity || 1);
    if (clampedQuantity === item.quantity) return;

    const delta = clampedQuantity - item.quantity;
    if (delta > 0) {
      trackGa4EcommerceEvent("add_to_cart", buildGa4CartPayload([withQuantity(item, delta)]));
    } else {
      trackGa4EcommerceEvent("remove_from_cart", buildGa4CartPayload([withQuantity(item, Math.abs(delta))]));
    }

    updateQuantity(item.variantId, clampedQuantity);
  };

  const handleRemove = (item: CartItem) => {
    trackGa4EcommerceEvent("remove_from_cart", buildGa4CartPayload([item]));
    removeItem(item.variantId);
  };

  const handleClearCart = () => {
    items.forEach((item) => {
      trackGa4EcommerceEvent("remove_from_cart", buildGa4CartPayload([item]));
    });
    clearCart();
  };

  return (
    <>
      <Helmet>
        <title>Secure Cart - Kora Sutra</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen pt-28 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-body">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground">Cart</span>
          </nav>

          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading tracking-wide">Shopping Cart</h1>
              <p className="text-sm text-muted-foreground font-body mt-2">
                {items.length === 0 ? "Your cart is empty." : `${totalItems} item${totalItems !== 1 ? "s" : ""} ready for secure checkout.`}
              </p>
            </div>
            {items.length > 0 && (
              <Button type="button" variant="outline" onClick={handleClearCart}>
                Clear Cart
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <section className="border border-border rounded-sm py-16 px-4 text-center bg-card">
              <ShoppingBag className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
              <h2 className="text-xl font-heading mb-2">Your cart is empty</h2>
              <p className="text-sm text-muted-foreground font-body mb-6">
                Explore handcrafted sarees and add your favourites here.
              </p>
              <Button asChild>
                <Link to="/collections/all">Browse Collection</Link>
              </Button>
            </section>
          ) : (
            <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
              <section className="space-y-4">
                {items.map((item) => (
                  <article key={item.variantId} className="border border-border rounded-sm p-3 sm:p-4 bg-card">
                    <div className="grid grid-cols-[88px_1fr] sm:grid-cols-[104px_1fr_auto] gap-4">
                      <Link to={`/products/${item.product.node.handle}`} className="aspect-[3/4] bg-secondary/30 overflow-hidden rounded-sm">
                        {item.product.node.images.edges[0]?.node && (
                          <img
                            src={item.product.node.images.edges[0].node.url}
                            alt={item.product.node.images.edges[0].node.altText || item.product.node.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link to={`/products/${item.product.node.handle}`} className="font-heading text-base sm:text-lg hover:text-accent transition-colors line-clamp-2">
                          {item.product.node.title}
                        </Link>
                        {item.variantTitle !== "Default Title" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.selectedOptions.map((option) => option.value).join(" / ")}
                          </p>
                        )}
                        <p className="text-base font-price mt-2">
                          {formatPrice(item.price.amount, item.price.currencyCode)}
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex sm:flex-col items-center sm:items-end justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            aria-label={`Decrease quantity for ${item.product.node.title}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center text-sm font-body">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={item.quantity >= (item.maxQuantity || 1)}
                            aria-label={`Increase quantity for ${item.product.node.title}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <aside className="lg:sticky lg:top-28 border border-border rounded-sm p-4 bg-card">
                <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Summary
                </h2>
                <div className="space-y-3 font-body text-sm border-b border-border pb-4">
                  <div className="flex justify-between"><span>Subtotal (excl. GST)</span><span className="font-price">{formatPrice(String(subtotal), currencyCode)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                  <div className="flex justify-between text-lg font-heading pt-2"><span>Total before GST</span><span className="font-price">{formatPrice(String(subtotal), currencyCode)}</span></div>
                </div>
                <div className="space-y-4 pt-4">
                  <Button asChild size="lg" className="w-full h-14 text-base">
                    <Link to="/checkout">
                      <Lock className="w-4 h-4 mr-2" />
                      Secure Checkout
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <SecureCheckoutBadges />
                  <p className="text-xs text-muted-foreground text-center">
                    Checkout is protected with WhatsApp OTP verification and Razorpay payment security.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
