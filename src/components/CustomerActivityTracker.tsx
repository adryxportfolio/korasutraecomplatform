import { useEffect, useRef } from "react";
import { CUSTOMER_SESSION_CHANGED_EVENT } from "@/lib/customerSession";
import { trackCustomerActivity } from "@/lib/customerActivity";
import { useCartStore, type CartItem } from "@/stores/cartStore";

function itemSku(item: CartItem) {
  return item.product.node.variants.edges.find((edge) => edge.node.id === item.variantId)?.node.sku || item.variantTitle || item.variantId;
}

export function CustomerActivityTracker() {
  const previousQuantities = useRef(new Map<string, number>());

  useEffect(() => {
    trackCustomerActivity("just_visit");
    const syncVisit = () => trackCustomerActivity("just_visit");
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncVisit);

    previousQuantities.current = new Map(useCartStore.getState().items.map((item) => [item.variantId, item.quantity]));
    const unsubscribe = useCartStore.subscribe((state) => {
      const previous = previousQuantities.current;
      state.items.forEach((item) => {
        const oldQuantity = previous.get(item.variantId) || 0;
        if (item.quantity > oldQuantity) {
          trackCustomerActivity("product_added_to_cart", {
            sku: itemSku(item),
            metadata: {
              variantId: item.variantId,
              productHandle: item.product.node.handle,
              productTitle: item.product.node.title,
              quantity: item.quantity,
            },
          });
        }
      });
      previousQuantities.current = new Map(state.items.map((item) => [item.variantId, item.quantity]));
    });

    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncVisit);
      unsubscribe();
    };
  }, []);

  return null;
}
