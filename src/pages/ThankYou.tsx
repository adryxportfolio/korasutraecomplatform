/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getCustomerSessionToken } from "@/lib/customerSession";
import { formatPrice } from "@/lib/shopify";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function ThankYou() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderNumber) return;
    const sessionToken = getCustomerSessionToken();
    if (!sessionToken) return;

    fetch(`${SUPABASE_URL}/functions/v1/track-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": sessionToken,
      },
      body: JSON.stringify({ orderNumber }),
    })
      .then((response) => response.json().then((data) => (response.ok ? data.order : null)))
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [orderNumber]);

  return (
    <>
      <Helmet>
        <title>Thank You - Korasutra</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <section className="text-center border border-border rounded-sm bg-card p-6 md:p-10">
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9" />
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-body mb-3">Order Confirmed</p>
            <h1 className="text-3xl md:text-4xl font-heading mb-3">Thank you for your purchase</h1>
            <p className="text-muted-foreground font-body">
              {orderNumber ? `Your order ${orderNumber} has been placed successfully.` : "Your order has been placed successfully."}
            </p>

            {order ? (
              <div className="mt-8 text-left border border-border rounded-sm p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="font-price text-xl">{formatPrice(String(order.total), "INR")}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground capitalize">
                    {String(order.payment_method).replace("_", " ")} - {String(order.payment_status).replace("_", " ")}
                  </div>
                </div>
                <div className="space-y-3">
                  {(order.order_items || []).map((item: any) => (
                    <div key={item.id} className="flex gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
                      <div className="w-14 h-16 bg-secondary/30 rounded-sm overflow-hidden flex-shrink-0">
                        {item.image_url && <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-sm">{item.product_title}</p>
                        {item.variant_title && item.variant_title !== "Default" && (
                          <p className="text-xs font-medium">{item.variant_title}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                      <p className="font-price text-sm">{formatPrice(String(item.line_total), "INR")}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button asChild>
                <Link to={orderNumber ? `/order-tracking/${orderNumber}` : "/order-tracking"}>
                  <Package className="w-4 h-4 mr-2" />
                  Track Order
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/collections/all">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
