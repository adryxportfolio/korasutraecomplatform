import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle } from "@/lib/shopify";
import { parseAddToCartParams } from "@/lib/addToCartUrl";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { buildGa4CartPayload, trackGa4EcommerceEvent } from "@/lib/ga4Ecommerce";

export default function AddToCartRedirect() {
  const { handle } = useParams<{ handle: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const didRun = useRef(false);
  const [status, setStatus] = useState("Adding item to cart...");

  useEffect(() => {
    if (!handle || didRun.current) return;
    didRun.current = true;

    const addFromUrl = async () => {
      const params = parseAddToCartParams(searchParams);
      const product = await fetchProductByHandle(handle);
      if (!product) {
        setStatus("Product not found.");
        toast.error("Product not found", { position: "top-center" });
        return;
      }

      const variant = params.variantId
        ? product.variants.edges.find((edge) => edge.node.id === params.variantId)?.node
        : product.variants.edges[0]?.node;

      if (!variant) {
        setStatus("Variant not found.");
        toast.error("Variant not found", { position: "top-center" });
        return;
      }

      if (!variant.availableForSale) {
        setStatus("This item is out of stock.");
        toast.error("This item is out of stock", { description: product.title, position: "top-center" });
        navigate(`/products/${product.handle}`, { replace: true });
        return;
      }

      const maxQuantity = variant.quantityAvailable && variant.quantityAvailable > 0 ? variant.quantityAvailable : 1;
      const cartItem = {
        product: { node: product },
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: Math.min(params.quantity, maxQuantity),
        maxQuantity,
        selectedOptions: variant.selectedOptions,
      };
      addItem(cartItem);
      trackGa4EcommerceEvent("add_to_cart", buildGa4CartPayload([cartItem]));

      toast.success("Added to cart", { description: product.title, position: "top-center" });
      navigate(params.checkout ? "/checkout" : `/products/${product.handle}`, { replace: true });
    };

    addFromUrl().catch((error) => {
      console.error("Add-to-cart URL failed:", error);
      setStatus("Unable to add this item to cart.");
      toast.error("Unable to add this item to cart", {
        description: error instanceof Error ? error.message : undefined,
        position: "top-center",
      });
    });
  }, [addItem, handle, navigate, searchParams]);

  return (
    <>
      <Helmet>
        <title>Add to Cart - Kora Sutra</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16">
        <div className="container mx-auto px-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-heading mb-3">Add to Cart</h1>
          <p className="text-sm text-muted-foreground mb-6 flex items-center justify-center gap-2">
            {status === "Adding item to cart..." && <Loader2 className="w-4 h-4 animate-spin" />}
            {status}
          </p>
          <Button asChild variant="outline">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
