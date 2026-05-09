import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Heart, ChevronRight } from 'lucide-react';
import brownTussarImg from '@/assets/brown-tussar-baluchari.png';
import pinkTissueImg from '@/assets/pink-tissue-muslin-sequins.png';
import saree3 from '@/assets/saree-3.jpg';
import saree4 from '@/assets/saree-4.jpg';
const DUKAAN_STORE = 'https://shop.korasutra.com';
const products = [{
  id: 1,
  name: 'Brown Tussar Baluchari',
  price: 12500,
  originalPrice: 15000,
  image: brownTussarImg,
  tag: 'Bestseller',
  fabric: 'Tussar Silk',
  productUrl: DUKAAN_STORE
}, {
  id: 2,
  name: 'Pink Tissue Muslin Sequins',
  price: 12113,
  originalPrice: 14250,
  image: pinkTissueImg,
  tag: 'New',
  fabric: 'Tissue Muslin',
  productUrl: DUKAAN_STORE
}, {
  id: 3,
  name: 'Royal Blue Banarasi',
  price: 28000,
  image: saree3,
  tag: 'Premium',
  fabric: 'Banarasi Silk',
  productUrl: DUKAAN_STORE
}, {
  id: 4,
  name: 'Golden Tissue Saree',
  price: 18500,
  originalPrice: 22000,
  image: saree4,
  tag: 'Sale',
  fabric: 'Tissue',
  productUrl: DUKAAN_STORE
}];
function ProductCard({
  product,
  index,
  isBlurred = false
}: {
  product: typeof products[0];
  index: number;
  isBlurred?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-50px'
  });
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };
  return <motion.div ref={ref} initial={{
    opacity: 0,
    y: 40
  }} animate={isInView ? {
    opacity: 1,
    y: 0
  } : {
    opacity: 0,
    y: 40
  }} transition={{
    duration: 0.6,
    delay: index * 0.1
  }} className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary mb-4">
        {/* Product Image */}
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

        {/* Tag */}
        <div className={`absolute top-4 left-4 px-3 py-1 text-xs tracking-wider uppercase font-body rounded-sm ${product.tag === 'Sale' ? 'bg-destructive text-destructive-foreground' : product.tag === 'Premium' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
          {product.tag}
        </div>

        {/* Wishlist Button */}
        {!isBlurred && <button className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110">
            <Heart className="w-4 h-4" />
          </button>}

        {/* Quick Buy */}
        {!isBlurred && <motion.div initial={{
        y: 20,
        opacity: 0
      }} whileInView={{
        y: 0,
        opacity: 1
      }} className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <a href={product.productUrl} className="w-full flex items-center justify-center gap-2 py-2 bg-background text-foreground text-sm font-body rounded-sm hover:bg-background/90 transition-colors">
              Buy Securely
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <span className="text-xs tracking-wider text-muted-foreground uppercase font-body">
          {product.fabric}
        </span>
        <h3 className="font-heading text-lg group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-price font-medium">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-sm text-muted-foreground line-through font-price">
              {formatPrice(product.originalPrice)}
            </span>}
        </div>
      </div>
    </motion.div>;
}
export function FeaturedProducts() {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px'
  });
  return <section ref={ref} className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {
        opacity: 0,
        y: 30
      }} transition={{
        duration: 0.8
      }} className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="text-sm tracking-[0.3em] text-muted-foreground uppercase mb-4 block font-body">
              Featured Sarees
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-light">
              Explore <span className="italic text-[#332000]">Collections</span>
            </h2>
          </div>
          <a href={DUKAAN_STORE} className="mt-6 md:mt-0 inline-flex items-center gap-2 px-6 py-3 border border-foreground text-foreground text-sm font-body tracking-wide rounded-sm hover:bg-foreground hover:text-background transition-colors">
            View All
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Products Grid - 2 Featured Products Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {products.slice(0, 2).map((product, index) => <a key={product.id} href={product.productUrl} className="block">
              <motion.div initial={{
            opacity: 0,
            y: 40
          }} animate={isInView ? {
            opacity: 1,
            y: 0
          } : {
            opacity: 0,
            y: 40
          }} transition={{
            duration: 0.6,
            delay: index * 0.15
          }} className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {/* Tag */}
                  <div className={`absolute top-6 left-6 px-4 py-2 text-xs tracking-wider uppercase font-body rounded-sm ${product.tag === 'Sale' ? 'bg-destructive text-destructive-foreground' : product.tag === 'Premium' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                    {product.tag}
                  </div>

                  {/* Wishlist Button */}
                  <button className="absolute top-6 right-6 w-12 h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110">
                    <Heart className="w-5 h-5" />
                  </button>

                  {/* Overlay with Product Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-background/95 via-background/70 to-transparent">
                    <span className="text-xs tracking-wider text-muted-foreground uppercase font-body block mb-2">
                      {product.fabric}
                    </span>
                    <h3 className="font-heading text-xl md:text-2xl mb-3 group-hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-price font-medium text-lg">
                          {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      }).format(product.price)}
                        </span>
                        {product.originalPrice && <span className="text-sm text-muted-foreground line-through font-price">
                            {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      }).format(product.originalPrice)}
                          </span>}
                      </div>
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-body rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Buy Now
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </a>)}
        </div>

        {/* Blur Overlay Section */}
        <a href={DUKAAN_STORE} className="block mt-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 blur-sm opacity-60 pointer-events-none">
            {products.slice(2).map((product, index) => <ProductCard key={product.id} product={product} index={index + 2} isBlurred />)}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 rounded-sm">
            <p className="text-center font-body text-foreground mb-4 px-4">
              Full collection available in our official store
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-body tracking-wide rounded-sm hover:bg-primary/90 transition-colors">
              Continue to Store
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </a>
      </div>
    </section>;
}