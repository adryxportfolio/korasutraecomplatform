import { Link } from 'react-router-dom';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { formatPrice } from '@/lib/shopify';

interface RecentlyViewedProps {
  currentHandle?: string;
}

export function RecentlyViewed({ currentHandle }: RecentlyViewedProps) {
  const { products } = useRecentlyViewedStore();
  
  // Filter out current product and get up to 8
  const recentProducts = products
    .filter(p => p.node.handle !== currentHandle)
    .slice(0, 8);

  if (recentProducts.length === 0) return null;

  return (
    <section className="mt-12 md:mt-16 border-t border-border pt-8 md:pt-12">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-heading text-center mb-6 md:mb-8 tracking-wide uppercase">
        Recently Viewed
      </h2>
      
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto pb-4 -mx-3 px-3 scrollbar-hide">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {recentProducts.map(({ node }) => (
            <Link
              key={node.id}
              to={`/products/${node.handle}`}
              className="group flex-shrink-0 w-36"
            >
              <div className="aspect-[3/4] overflow-hidden bg-secondary/20 mb-2 rounded-sm">
                {node.images.edges[0]?.node && (
                  <img
                    src={node.images.edges[0].node.url}
                    alt={node.images.edges[0].node.altText || node.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
              </div>
              <h3 className="font-heading text-xs text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                {node.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-price">
                {formatPrice(node.priceRange.minVariantPrice.amount, node.priceRange.minVariantPrice.currencyCode)}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
        {recentProducts.slice(0, 4).map(({ node }) => (
          <Link
            key={node.id}
            to={`/products/${node.handle}`}
            className="group"
          >
            <div className="aspect-[3/4] overflow-hidden bg-secondary/20 mb-3 rounded-sm">
              {node.images.edges[0]?.node && (
                <img
                  src={node.images.edges[0].node.url}
                  alt={node.images.edges[0].node.altText || node.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              )}
            </div>
            <h3 className="font-heading text-sm md:text-base text-foreground group-hover:text-accent transition-colors truncate">
              {node.title}
            </h3>
            <p className="text-sm text-muted-foreground font-price">
              {formatPrice(node.priceRange.minVariantPrice.amount, node.priceRange.minVariantPrice.currencyCode)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
