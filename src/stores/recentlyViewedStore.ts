import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ShopifyProduct } from '@/lib/shopify';

interface RecentlyViewedStore {
  products: ShopifyProduct[];
  addProduct: (product: ShopifyProduct) => void;
  clearProducts: () => void;
}

const MAX_RECENT_PRODUCTS = 10;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        const { products } = get();
        // Remove if already exists
        const filtered = products.filter(p => p.node.id !== product.node.id);
        // Add to beginning
        const updated = [product, ...filtered].slice(0, MAX_RECENT_PRODUCTS);
        set({ products: updated });
      },

      clearProducts: () => {
        set({ products: [] });
      },
    }),
    {
      name: 'korasutra-recently-viewed',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
