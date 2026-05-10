import { useEffect, useRef } from "react";
import { CUSTOMER_SESSION_CHANGED_EVENT } from "@/lib/customerSession";
import { buildCartSnapshotActivityPayload, trackCustomerActivity } from "@/lib/customerActivity";
import { useCartStore, type CartItem } from "@/stores/cartStore";

function itemSku(item: CartItem) {
  return item.product.node.variants.edges.find((edge) => edge.node.id === item.variantId)?.node.sku || item.variantTitle || item.variantId;
}

export function CustomerActivityTracker() {
  const previousQuantities = useRef(new Map<string, number>());

  useEffect(() => {
    const syncCartSnapshot = (items = useCartStore.getState().items, includeEmpty = false) => {
      if (items.length > 0 || includeEmpty) {
        trackCustomerActivity("cart_snapshot", buildCartSnapshotActivityPayload(items));
      }
    };

    trackCustomerActivity("just_visit");
    syncCartSnapshot();
    const syncSessionActivity = () => {
      trackCustomerActivity("just_visit");
      syncCartSnapshot();
    };
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncSessionActivity);

    previousQuantities.current = new Map(useCartStore.getState().items.map((item) => [item.variantId, item.quantity]));
    const unsubscribe = useCartStore.subscribe((state) => {
      const previous = previousQuantities.current;
      const nextQuantities = new Map(state.items.map((item) => [item.variantId, item.quantity]));
      let cartChanged = previous.size !== nextQuantities.size;
      state.items.forEach((item) => {
        const oldQuantity = previous.get(item.variantId) || 0;
        if (item.quantity !== oldQuantity) cartChanged = true;
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
      if (cartChanged) {
        syncCartSnapshot(state.items, previous.size > 0);
      }
      previousQuantities.current = nextQuantities;
    });

    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncSessionActivity);
      unsubscribe();
    };
  }, []);

  return null;
}
