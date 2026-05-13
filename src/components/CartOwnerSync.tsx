import { useEffect } from "react";
import {
  CUSTOMER_SESSION_CHANGED_EVENT,
  getCustomerSessionToken,
} from "@/lib/customerSession";
import { scopedCartOwnerKey } from "@/lib/cartOwner";
import { useCartStore } from "@/stores/cartStore";

export function CartOwnerSync() {
  const syncCartOwner = useCartStore((state) => state.syncCartOwner);

  useEffect(() => {
    const sync = () => {
      syncCartOwner(scopedCartOwnerKey(getCustomerSessionToken()));
    };

    sync();
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [syncCartOwner]);

  return null;
}
