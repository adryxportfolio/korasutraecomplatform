import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { toTitleCase } from '@/lib/titleCase';
import { ProductPrice } from '@/components/ProductPrice';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { buildGa4CartPayload, trackGa4EcommerceEvent } from '@/lib/ga4Ecommerce';

export default function Wishlist() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addToCart = useCartStore(state => state.addItem);

  const handleAddToCart = (item: typeof items[0]) => {
    const variant = item.node.variants.edges[0]?.node;
    if (!variant) return;

    const cartItem = {
      product: item,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      maxQuantity: 1, // Sarees are typically one-of-a-kind
      selectedOptions: variant.selectedOptions || [],
    };
    addToCart(cartItem);
    trackGa4EcommerceEvent('add_to_cart', buildGa4CartPayload([cartItem]));

    toast.success('Added to cart', {
      description: item.node.title,
      position: 'top-center',
    });
  };

  const handleRemove = (productId: string, title: string) => {
    removeItem(productId);
    toast.success('Removed from wishlist', {
      description: title,
      position: 'top-center',
    });
  };

  return (
    <>
      <Helmet>
        <title>My Wishlist - Kora Sutra | Saved Handcrafted Sarees</title>
        <meta name="description" content="View your saved sarees at Kora Sutra. Keep track of your favorite handcrafted sarees and add them to cart when ready." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <Navbar />
      <main className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-body">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Wishlist</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-heading tracking-wide">
              My Wishlist
            </h1>
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearWishlist();
                  toast.success('Wishlist cleared', { position: 'top-center' });
                }}
              >
                Clear All
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="text-xl font-heading mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground font-body mb-6">
                Save items you love by clicking the heart icon
              </p>
              <Link to="/collections/all">
                <Button>Browse Collection</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map(({ node }, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <Link to={`/products/${node.handle}`}>
                    <div className="aspect-[3/4] overflow-hidden bg-secondary/20 mb-3">
                      {node.images.edges[0]?.node && (
                        <img
                          src={node.images.edges[0].node.url}
                          alt={node.images.edges[0].node.altText || node.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h3 className="font-heading text-sm md:text-base text-foreground group-hover:text-accent transition-colors line-clamp-2">
                      {toTitleCase(node.title)}
                    </h3>
                    <ProductPrice
                      price={node.priceRange.minVariantPrice}
                      compareAtPrice={node.priceRange.minVariantCompareAtPrice}
                      className="mt-1"
                      priceClassName="text-sm"
                      compareAtClassName="text-xs"
                      discountClassName="text-[11px]"
                    />
                  </Link>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleAddToCart({ node })}
                    >
                      <ShoppingBag className="w-3 h-3 mr-1" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3"
                      onClick={() => handleRemove(node.id, node.title)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
