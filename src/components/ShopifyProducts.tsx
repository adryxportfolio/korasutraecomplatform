import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProducts, ShopifyProduct, formatPrice } from '@/lib/shopify';
import { toTitleCase } from '@/lib/titleCase';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { StockIndicator } from '@/components/StockStatus';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToStorefrontRealtime } from '@/lib/realtimeTables';

const PRODUCTS_TO_SHOW = 8;

export function ShopifyProducts() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const data = await fetchProducts(PRODUCTS_TO_SHOW);
      setProducts(data);
      setLoading(false);
    }
    loadProducts();

    return subscribeToStorefrontRealtime(supabase, 'home-catalog-products', loadProducts);
  }, []);

  const handleAddToCart = (product: ShopifyProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    if (!variant.availableForSale) {
      toast.error('This item is out of stock', {
        description: product.node.title,
        position: 'top-center',
      });
      return;
    }

    addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      maxQuantity: variant.quantityAvailable && variant.quantityAvailable > 0 ? variant.quantityAvailable : 1,
      selectedOptions: variant.selectedOptions || [],
    });

    toast.success('Added to cart', {
      description: product.node.title,
      position: 'top-center',
    });
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-sm tracking-[0.3em] text-muted-foreground uppercase mb-4 block font-body">
              Our Collection
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-light">
              Shop <span className="italic text-accent">Sarees</span>
            </h2>
          </div>
          
          <div className="text-center py-16 bg-secondary/20 rounded-sm">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-heading mb-2">No products yet</h3>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Products are being added to the store. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm tracking-[0.3em] text-muted-foreground uppercase mb-4 block font-body">
            Our Collection
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-light">
            Shop <span className="italic text-accent">Sarees</span>
          </h2>
        </motion.div>

        {/* Products Grid - Show limited products */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.slice(0, PRODUCTS_TO_SHOW).map((product, index) => (
            <motion.div
              key={product.node.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <Link 
                to={`/products/${product.node.handle}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary/20">
                  {product.node.images.edges[0]?.node && (
                    <img
                      src={product.node.images.edges[0].node.url}
                      alt={`${product.node.title} - Handcrafted Saree by Kora Sutra`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  
                  {/* Fabric Badge */}
                  {(() => {
                    const fabricKeywords = ['Tussar', 'Matka', 'Muslin', 'Silk', 'Katan', 'Linen', 'Cotton', 'Kantha', 'Jamdani', 'Baluchari', 'Batik', 'Paithani', 'Block Print'];
                    const title = product.node.title;
                    const fabric = fabricKeywords.find(f => title.toLowerCase().includes(f.toLowerCase()));
                    return fabric ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-background/90 backdrop-blur-sm text-[10px] md:text-xs font-body tracking-wider uppercase text-foreground/80 rounded-sm">
                        {fabric}
                      </span>
                    ) : null;
                  })()}
                  
                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="absolute bottom-3 left-3 right-3 py-2 bg-background/90 backdrop-blur-sm text-foreground text-sm font-body tracking-wide rounded-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 hover:bg-background"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
                
                <div className="mt-3 space-y-1">
                  <h3 className="font-heading text-sm md:text-base truncate group-hover:text-accent transition-colors">
                    {toTitleCase(product.node.title)}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-price)' }}>
                      {formatPrice(
                        product.node.priceRange.minVariantPrice.amount,
                        product.node.priceRange.minVariantPrice.currencyCode
                      )}
                    </p>
                    {product.node.variants.edges[0]?.node && (
                      <StockIndicator
                        availableForSale={product.node.variants.edges[0].node.availableForSale}
                        quantityAvailable={product.node.variants.edges[0].node.quantityAvailable}
                      />
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="group"
          >
            <Link to="/collections/all">
              View All Sarees
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
