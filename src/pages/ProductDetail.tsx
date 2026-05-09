import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ShoppingBag, Loader2, Clock, Heart, Share2, Plus, Bell } from 'lucide-react';
import { StockStatus } from '@/components/StockStatus';
import { fetchProductByHandle, fetchProducts, ShopifyProduct, formatPrice } from '@/lib/shopify';
import { toTitleCase } from '@/lib/titleCase';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SwipeableImageGallery } from '@/components/SwipeableImageGallery';
import { StickyMobileCartBar } from '@/components/StickyMobileCartBar';
import { RecentlyViewed } from '@/components/RecentlyViewed';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductReviews } from '@/components/ProductReviews';
import { SecureCheckoutBadges } from '@/components/SecureCheckoutBadges';
import { supabase } from '@/integrations/supabase/client';
import { buildProductFAQs } from '@/data/faqs';
import { subscribeToStorefrontRealtime } from '@/lib/realtimeTables';

// Extract fabric type from product title
function extractFabricFromTitle(title: string): string {
  const fabricKeywords = [
    'Tissue Tussar', 'Tissue Muslin', 'Tissue', 'Tussar', 'Tussar Silk', 'Muslin', 
    'Jamdani', 'Kantha', 'Linen', 'Cotton', 'Silk', 'Banarasi', 'Chanderi', 
    'Organza', 'Georgette', 'Chiffon', 'Crepe', 'Satin', 'Baluchari'
  ];
  
  const lowerTitle = title.toLowerCase();
  for (const fabric of fabricKeywords) {
    if (lowerTitle.includes(fabric.toLowerCase())) {
      return fabric;
    }
  }
  return 'Handwoven';
}

// Extract product type/category (block print, tussar, kantha, jamdani, etc.)
function extractProductType(title: string): string {
  // Order matters - check more specific types first
  const typeKeywords = [
    'Block Print', 'Kantha Stitch', 'Kantha', 'Jamdani', 'Tussar', 'Muslin', 
    'Baluchari', 'Banarasi', 'Chanderi', 'Ikat', 'Bandhani', 'Batik',
    'Kalamkari', 'Patola', 'Paithani', 'Pochampally', 'Bomkai', 'Sambalpuri',
    'Tant', 'Gadwal', 'Uppada', 'Venkatagiri', 'Mangalagiri', 'Narayanpet'
  ];
  
  const lowerTitle = title.toLowerCase();
  for (const type of typeKeywords) {
    if (lowerTitle.includes(type.toLowerCase())) {
      return type;
    }
  }
  return '';
}

// Extract color from product title
function extractColorFromTitle(title: string): string {
  const colorKeywords = [
    'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 
    'Orange', 'Brown', 'Beige', 'Cream', 'Gold', 'Silver', 'Maroon', 'Navy',
    'Teal', 'Turquoise', 'Coral', 'Peach', 'Lavender', 'Magenta', 'Ivory',
    'Grey', 'Gray', 'Olive', 'Burgundy', 'Rose', 'Mustard', 'Mint'
  ];
  
  const lowerTitle = title.toLowerCase();
  for (const color of colorKeywords) {
    if (lowerTitle.includes(color.toLowerCase())) {
      return color;
    }
  }
  return 'Multi';
}

// Extract pattern from product title or description
function extractPatternFromTitle(title: string, description: string): string {
  const patternKeywords = [
    'Embroidered', 'Printed', 'Woven', 'Block Print', 'Hand Painted', 'Zari',
    'Sequin', 'Mirror Work', 'Thread Work', 'Applique', 'Batik', 'Tie-Dye',
    'Ikat', 'Bandhani', 'Leheriya', 'Paisley', 'Floral', 'Geometric', 
    'Abstract', 'Traditional', 'Contemporary', 'Striped', 'Checked'
  ];
  
  const combined = `${title} ${description}`.toLowerCase();
  for (const pattern of patternKeywords) {
    if (combined.includes(pattern.toLowerCase())) {
      return pattern;
    }
  }
  return 'Handcrafted';
}

// Check if blouse piece is included - returns true/false/null (null = not specified)
function hasBlousePiece(title: string, description: string): boolean | null {
  const combined = `${title} ${description}`.toLowerCase();
  // Check for explicit mentions of NO blouse
  if (combined.includes('without blouse') || combined.includes('no blouse') || combined.includes('blouse not included') || combined.includes('blouse piece: no') || combined.includes('blouse: no')) {
    return false;
  }
  // Check for explicit mentions of WITH blouse
  if (combined.includes('with blouse') || combined.includes('blouse piece') || combined.includes('blouse included') || combined.includes('blouse piece: yes') || combined.includes('blouse: yes') || combined.includes('includes blouse')) {
    return true;
  }
  // Return null if nothing is mentioned
  return null;
}

// Extract length from description - returns the length or null if not specified
function extractLength(title: string, description: string): string | null {
  const combined = `${title} ${description}`.toLowerCase();
  
  // Look for explicit length mentions in various formats
  const lengthPatterns = [
    /length[:\s]+(\d+(?:\.\d+)?)\s*(?:meters?|m|mtr)?/i,  // "Length: 6.25" or "Length 6.25 meters"
    /(\d+(?:\.\d+)?)\s*(?:meters?|m|mtr)\s*(?:length|long)/i,
    /saree\s*length[:\s]+(\d+(?:\.\d+)?)\s*(?:meters?|m|mtr)?/i,
    /(\d+(?:\.\d+)?)\s*(?:meters?|m|mtr)\s*saree/i,
    /size[:\s]+(\d+(?:\.\d+)?)\s*(?:meters?|m|mtr)/i,
    /(\d+(?:\.\d+)?)\s*meters?\s*(?:with|including)/i,
  ];
  
  for (const pattern of lengthPatterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      return `${match[1]} meters`;
    }
  }
  
  // Check for common saree lengths mentioned as text
  if (combined.includes('6.5 meters') || combined.includes('6.5m') || combined.includes('6.5 m')) {
    return '6.5 meters';
  }
  if (combined.includes('5.5 meters') || combined.includes('5.5m') || combined.includes('5.5 m')) {
    return '5.5 meters';
  }
  if (combined.includes('6 meters') || combined.includes('6m ') || combined.includes('6 m ')) {
    return '6 meters';
  }
  
  return null;
}

// Parse product description to extract structured details
function parseProductDetails(title: string, description: string): Record<string, string | boolean | null> {
  const details: Record<string, string | boolean | null> = {};
  
  // Extract Fabric from title
  details['Fabric'] = extractFabricFromTitle(title);
  
  // Extract Color from title
  details['Colour'] = extractColorFromTitle(title);
  
  // Extract Pattern
  details['Pattern'] = extractPatternFromTitle(title, description);
  
  // Extract Length from description - derived from catalog input
  details['Length'] = extractLength(title, description);
  
  // Blouse Piece - derived from catalog input, null if not specified
  details['Blouse Piece'] = hasBlousePiece(title, description);
  
  // Always set Wash Care to Dry clean
  details['Wash Care'] = 'Dry clean';

  return details;
}

const STANDARD_PRODUCT_DESCRIPTION =
  "Drape yourself in timeless elegance with a Kora Sutra saree crafted for grace, comfort, and everyday celebration. Each piece is selected with attention to textile character, drape, and finish, making it a thoughtful addition to your ethnic wardrobe.";

// Format SKU for display - returns SKU or fallback message
function formatSKU(sku: string | null | undefined): string {
  return sku || 'Waiting For Admin Changes';
}

// Product Details Table Component with Blouse Piece display
function ProductDetailsTable({ 
  details
}: { 
  details: Record<string, string | boolean | null>;
}) {
  const entries = Object.entries(details);
  
  if (entries.length === 0) return null;

  const renderValue = (key: string, value: string | boolean | null) => {
    // Handle Blouse Piece - show status derived from catalog data
    if (key === 'Blouse Piece') {
      if (value === null) {
        return (
          <span className="text-amber-600 italic text-xs">
            Waiting For Admin Input
          </span>
        );
      }
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === true 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {value === true ? 'Yes' : 'No'}
        </span>
      );
    }
    
    // Handle Length - show value or waiting message
    if (key === 'Length') {
      if (value === null) {
        return (
          <span className="text-amber-600 italic text-xs">
            Waiting For Admin Input
          </span>
        );
      }
      return value;
    }
    
    // Default rendering for other fields
    return value?.toString() || '';
  };

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      {entries.map(([key, value], index) => (
        <div
          key={key}
          className={`flex ${index !== entries.length - 1 ? 'border-b border-border' : ''}`}
        >
          <div className="w-1/3 px-4 py-3 bg-secondary/30 font-medium text-sm text-foreground">
            {key}
          </div>
          <div className="w-2/3 px-4 py-3 text-sm text-foreground/80 flex items-center">
            {renderValue(key, value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Similar Products Component - filters by same product type OR fabric
function SimilarProducts({ currentHandle, currentProductType, currentFabric, products }: { currentHandle: string; currentProductType: string; currentFabric: string; products: ShopifyProduct[] }) {
  // Filter out current product first
  const otherProducts = products.filter(p => p.node.handle !== currentHandle);
  
  // Try to filter by same product type first, then fall back to fabric
  let filteredProducts: ShopifyProduct[] = [];
  let sectionTitle = "Similar Products";
  
  // First priority: Match by product type (technique like Block Print, Kantha, etc.)
  if (currentProductType) {
    const sameTypeProducts = otherProducts.filter(p => {
      const productType = extractProductType(p.node.title);
      return productType.toLowerCase() === currentProductType.toLowerCase();
    });
    
    if (sameTypeProducts.length > 0) {
      filteredProducts = sameTypeProducts.slice(0, 4);
      sectionTitle = `More in ${currentProductType}`;
    }
  }
  
  // Second priority: Match by fabric (Linen, Tussar, Muslin, etc.)
  if (filteredProducts.length === 0 && currentFabric && currentFabric !== 'Handwoven') {
    const sameFabricProducts = otherProducts.filter(p => {
      const productFabric = extractFabricFromTitle(p.node.title);
      return productFabric.toLowerCase() === currentFabric.toLowerCase();
    });
    
    if (sameFabricProducts.length > 0) {
      filteredProducts = sameFabricProducts.slice(0, 4);
      sectionTitle = `More in ${currentFabric}`;
    }
  }
  
  // Fallback to showing any other products if no matching products found
  if (filteredProducts.length === 0) {
    filteredProducts = otherProducts.slice(0, 4);
    sectionTitle = "Similar Products";
  }
  
  if (filteredProducts.length === 0) return null;

  return (
    <div className="border border-border rounded-sm p-4 mt-6">
      <h3 className="text-center text-sm font-body uppercase tracking-widest mb-4 border-b border-border pb-3">
        {sectionTitle}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {filteredProducts.map(({ node }) => (
          <Link
            key={node.id}
            to={`/products/${node.handle}`}
            className="flex-shrink-0 w-24"
          >
            <div className="aspect-[3/4] overflow-hidden bg-secondary/20 rounded-sm">
              {node.images.edges[0]?.node && (
                <img
                  src={node.images.edges[0].node.url}
                  alt={node.images.edges[0].node.altText || node.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// You May Also Like Section - filters by same product type OR fabric
function RelatedProducts({ currentHandle, currentProductType, currentFabric, products }: { currentHandle: string; currentProductType: string; currentFabric: string; products: ShopifyProduct[] }) {
  // Filter out current product first
  const otherProducts = products.filter(p => p.node.handle !== currentHandle);
  
  // Try to filter by same product type first, then fall back to fabric
  let filteredProducts: ShopifyProduct[] = [];
  let sectionTitle = "YOU MAY ALSO LIKE";
  
  // First priority: Match by product type (technique like Block Print, Kantha, etc.)
  if (currentProductType) {
    const sameTypeProducts = otherProducts.filter(p => {
      const productType = extractProductType(p.node.title);
      return productType.toLowerCase() === currentProductType.toLowerCase();
    });
    
    if (sameTypeProducts.length > 0) {
      filteredProducts = sameTypeProducts.slice(0, 8);
      sectionTitle = `MORE IN ${currentProductType.toUpperCase()}`;
    }
  }
  
  // Second priority: Match by fabric (Linen, Tussar, Muslin, etc.)
  if (filteredProducts.length === 0 && currentFabric && currentFabric !== 'Handwoven') {
    const sameFabricProducts = otherProducts.filter(p => {
      const productFabric = extractFabricFromTitle(p.node.title);
      return productFabric.toLowerCase() === currentFabric.toLowerCase();
    });
    
    if (sameFabricProducts.length > 0) {
      filteredProducts = sameFabricProducts.slice(0, 8);
      sectionTitle = `MORE IN ${currentFabric.toUpperCase()}`;
    }
  }
  
  // Fallback to showing any other products if no matching products found
  if (filteredProducts.length === 0) {
    filteredProducts = otherProducts.slice(0, 8);
    sectionTitle = "YOU MAY ALSO LIKE";
  }
  
  if (filteredProducts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="text-2xl md:text-3xl font-heading text-center mb-8 tracking-wide">
        {sectionTitle}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map(({ node }) => (
          <Link
            key={node.id}
            to={`/products/${node.handle}`}
            className="group"
          >
            <div className="aspect-[3/4] overflow-hidden bg-secondary/20 mb-3">
              {node.images.edges[0]?.node && (
                <img
                  src={node.images.edges[0].node.url}
                  alt={node.images.edges[0].node.altText || `${node.title} - Handcrafted Saree by Kora Sutra`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              )}
            </div>
            <h3 className="font-heading text-sm md:text-base text-foreground group-hover:text-accent transition-colors truncate">
              {toTitleCase(node.title)}
            </h3>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-price)' }}>
              {formatPrice(node.priceRange.minVariantPrice.amount, node.priceRange.minVariantPrice.currencyCode)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const addItem = useCartStore(state => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const addToRecentlyViewed = useRecentlyViewedStore(state => state.addProduct);
  

  const isWishlisted = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    async function loadProduct() {
      if (!handle) return;
      setLoading(true);
      
      const [productData, allProducts] = await Promise.all([
        fetchProductByHandle(handle),
        fetchProducts(20)
      ]);
      
      setProduct(productData);
      setRelatedProducts(allProducts);
      
      if (productData?.variants.edges[0]) {
        setSelectedVariant(productData.variants.edges[0].node.id);
        const initialOptions: Record<string, string> = {};
        productData.variants.edges[0].node.selectedOptions.forEach(opt => {
          initialOptions[opt.name] = opt.value;
        });
        setSelectedOptions(initialOptions);
        
        // Add to recently viewed
        addToRecentlyViewed({ node: productData });
      }
      setLoading(false);
    }
    loadProduct();

    return subscribeToStorefrontRealtime(supabase, `pdp-catalog-${handle || 'unknown'}`, loadProduct);
  }, [handle, addToRecentlyViewed]);

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);
    
    const matchingVariant = product?.variants.edges.find(({ node }) => 
      node.selectedOptions.every(opt => newOptions[opt.name] === opt.value)
    );
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.node.id);
    }
  };

  const getCurrentVariant = () => {
    return product?.variants.edges.find(({ node }) => node.id === selectedVariant)?.node;
  };

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleBuyNow = async () => {
    if (!product || !selectedVariant) {
      toast.error('Please select a variant', { position: 'top-center' });
      return;
    }

    const variant = product.variants.edges.find(
      (e) => e.node.id === selectedVariant
    )?.node;

    if (!variant) return;

    setIsCheckingOut(true);
    try {
      addItem({
        product: { node: product },
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        maxQuantity: 1,
        selectedOptions: variant.selectedOptions,
      });
      toast.success('Opening secure checkout...', { position: 'top-center' });
      navigate('/checkout');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.', { position: 'top-center' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      toast.error('Please select a variant', { position: 'top-center' });
      return;
    }
    
    const variant = getCurrentVariant();
    if (!variant) {
      toast.error('Variant not found', { position: 'top-center' });
      return;
    }

    addItem({
      product: { node: product },
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      maxQuantity: 1, // Sarees are typically one-of-a-kind
      selectedOptions: variant.selectedOptions,
    });
    
    toast.success('Added to cart!', { 
      description: product.title,
      position: 'top-center' 
    });
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist', { position: 'top-center' });
    } else {
      addToWishlist({ node: product });
      toast.success('Added to wishlist', { position: 'top-center' });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          url: url,
        });
      } catch {
        navigator.clipboard.writeText(url);
        toast.success('Link copied!', { position: 'top-center' });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!', { position: 'top-center' });
    }
  };

  const handleEnquiry = () => {
    const variant = getCurrentVariant();
    const sku = formatSKU(variant?.sku);
    const message = `Hi, I'm interested in ${product?.title}.\n\nSKU: ${sku}\n\nCould you provide more details?`;
    window.open(`https://wa.me/917995862266?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-heading mb-4">Product not found</h1>
            <Link to="/" className="text-accent hover:underline">
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentVariant = getCurrentVariant();
  const images = product.images.edges;
  const videos = product.videos?.edges || [];
  const productDetails = parseProductDetails(product.title, product.description);
  const productFAQs = buildProductFAQs(
    toTitleCase(product.title),
    String(productDetails['Fabric'] || ''),
    extractProductType(product.title),
  );
  const priceAmount = parseFloat(currentVariant?.price.amount || '0');
  const currentSKU = formatSKU(currentVariant?.sku);

  // Generate SEO data
  const productDescription = product.description 
    ? product.description.slice(0, 155).replace(/<[^>]*>/g, '') + '...'
    : `Shop ${product.title} at Kora Sutra. Premium handcrafted saree from Bengal. Free shipping across India.`;
  
  const productImage = images[0]?.node.url || 'https://korasutra.com/og-image.png';
  const productPriceValue = currentVariant?.price.amount || '0';
  
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: productDescription,
    image: images.map(img => img.node.url),
    brand: {
      "@type": "Brand",
      name: "Kora Sutra"
    },
    sku: currentSKU,
    offers: {
      "@type": "Offer",
      url: `https://korasutra.com/products/${handle}`,
      priceCurrency: "INR",
      price: productPriceValue,
      availability: currentVariant?.availableForSale 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Kora Sutra"
      }
    }
  };

  const breadcrumbSchemaPDP = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://korasutra.com/collections/all" },
      { "@type": "ListItem", position: 3, name: product.title, item: `https://korasutra.com/products/${handle}` }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{product.title} | Kora Sutra - Handcrafted Sarees</title>
        <meta name="description" content={productDescription} />
        <meta name="keywords" content={`${product.title}, Kora Sutra, handcrafted saree, buy saree online, ${extractFabricFromTitle(product.title)} saree, Indian saree`} />
        <link rel="canonical" href={`https://korasutra.com/products/${handle}`} />
        
        <meta property="og:title" content={`${product.title} | Kora Sutra`} />
        <meta property="og:description" content={productDescription} />
        <meta property="og:image" content={productImage} />
        <meta property="og:url" content={`https://korasutra.com/products/${handle}`} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={productPriceValue} />
        <meta property="product:price:currency" content="INR" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.title} | Kora Sutra`} />
        <meta name="twitter:description" content={productDescription} />
        <meta name="twitter:image" content={productImage} />
        
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchemaPDP)}</script>
      </Helmet>
      
      <Navbar />
      <main className="min-h-screen pt-28 pb-24 md:pb-16 overflow-x-hidden">
        <div className="container mx-auto px-3 md:px-6 max-w-full overflow-hidden">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 font-body overflow-hidden">
            <Link to="/" className="hover:text-foreground transition-colors flex-shrink-0">
              Home
            </Link>
            <span className="flex-shrink-0">/</span>
            <span className="text-foreground truncate">{product.title}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-4 md:gap-8 lg:gap-12">
            {/* Left Side - Image Gallery with Swipe */}
            <SwipeableImageGallery images={images} videos={videos} productTitle={product.title} />

            {/* Right Side - Product Info SUTA Style */}
            <div className="space-y-3 md:space-y-4">
              {/* Title Row with Share & Wishlist */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-heading tracking-wide flex-1 leading-tight">
                  {toTitleCase(product.title)}
                </h1>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-secondary/50 rounded-full transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-2 hover:bg-secondary/50 rounded-full transition-colors ${isWishlisted ? 'text-red-500' : ''}`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Tags / Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                <span className="px-2 md:px-3 py-1 border border-border text-xs font-body tracking-wide">
                  Saree
                </span>
                {productDetails['Fabric'] && (
                  <span className="px-2 md:px-3 py-1 border border-border text-xs font-body tracking-wide">
                    {productDetails['Fabric']}
                  </span>
                )}
              </div>

              {/* Short Description */}
              <p className="text-xs md:text-sm text-muted-foreground font-body line-clamp-2">
                {product.description?.substring(0, 100) || 'Handcrafted saree with exquisite detailing'}
              </p>

              {/* Price, Stock Status & Top Rated Badge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xl md:text-2xl font-heading" style={{ fontFamily: 'var(--font-price)' }}>
                      {currentVariant && formatPrice(currentVariant.price.amount, currentVariant.price.currencyCode)}
                    </p>
                    <p className="text-xs text-muted-foreground">MRP Inclusive of all taxes</p>
                  </div>
                  <span className="px-3 py-1 bg-foreground text-background text-xs font-body uppercase tracking-wide">
                    Top Rated
                  </span>
                </div>
                {/* Stock Status */}
                {currentVariant && (
                  <StockStatus 
                    availableForSale={currentVariant.availableForSale}
                    size="sm"
                  />
                )}
              </div>


              {/* Variant Options */}
              {product.options.filter(opt => opt.name !== 'Title').map((option) => (
                <div key={option.name} className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs md:text-sm font-body uppercase tracking-wide">
                      {option.name}:
                    </label>
                    {option.name.toLowerCase() === 'size' && (
                      <Link to="/size-guide" className="text-xs md:text-sm text-accent hover:underline">
                        Size chart
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[option.name] === value;
                      return (
                        <button
                          key={value}
                          onClick={() => handleOptionChange(option.name, value)}
                          className={`min-w-[36px] md:min-w-[40px] px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-body border transition-all ${
                            isSelected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border hover:border-foreground'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Add-Ons Section - Buy Now & Add to Cart or Notify Me */}
              <div className="border border-border rounded-sm overflow-hidden">
                <div className="p-3 md:p-4 bg-accent/5 border-b border-border">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {currentVariant?.availableForSale ? (
                      <>
                        {/* Buy Now Button */}
                        <Button
                          onClick={handleBuyNow}
                          disabled={isCheckingOut}
                          className="w-full h-11 md:h-12 text-sm md:text-base font-body uppercase tracking-widest bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full"
                        >
                          {isCheckingOut ? (
                            <>
                              <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                              Buy Now
                            </>
                          )}
                        </Button>
                        
                        {/* Add to Cart Button */}
                        <Button
                          onClick={handleAddToCart}
                          variant="outline"
                          className="w-full h-11 md:h-12 text-sm md:text-base font-body uppercase tracking-widest rounded-full border-foreground hover:bg-foreground hover:text-background"
                        >
                          <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Add to Cart
                        </Button>
                      </>
                    ) : (
                      /* Notify Me Button - for out of stock items */
                      <Button
                        onClick={() => {
                          const variant = getCurrentVariant();
                          const sku = formatSKU(variant?.sku);
                          const message = `Hi, I'd like to be notified when this product is back in stock:\n\n*${product?.title}*\nSKU: ${sku}\n\nPlease notify me when it's available again.`;
                          window.open(`https://wa.me/917995862266?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="w-full h-11 md:h-12 text-sm md:text-base font-body uppercase tracking-widest bg-[#25D366] hover:bg-[#1da851] text-white rounded-full"
                      >
                        <Bell className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Notify Me on WhatsApp
                      </Button>
                    )}
                  </div>
                  
                  {/* Secure Checkout Badges */}
                  <SecureCheckoutBadges />
                </div>
                
                {/* Size Chart Link */}
                <div className="p-3 md:p-4">
                  <Link to="/size-guide" className="text-sm text-accent hover:underline font-body">
                    Size chart
                  </Link>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="flex items-center gap-2 text-xs md:text-sm text-accent py-2">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="font-body tracking-wide">5-7 DAYS DELIVERY WITHIN INDIA</span>
              </div>

              {/* Offers Section */}
              <div className="border border-border rounded-sm p-3 md:p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm">🎁</span>
                  <span className="text-xs md:text-sm font-body font-medium">Offers</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-body font-semibold">FREE Delivery 🚚</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Free delivery on all orders within India</p>
                  </div>
                </div>
              </div>

              {/* Similar Products */}
              <SimilarProducts currentHandle={handle || ''} currentProductType={extractProductType(product.title)} currentFabric={extractFabricFromTitle(product.title)} products={relatedProducts} />

              {/* Accordion Sections - SUTA Style */}
              <Accordion type="multiple" className="w-full border-t border-border mt-4 md:mt-6">
                <AccordionItem value="details" className="border-b border-border">
                  <AccordionTrigger className="text-xs md:text-sm font-body uppercase tracking-widest py-3 md:py-4 hover:no-underline">
                    Details
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ProductDetailsTable 
                      details={productDetails} 
                    />
                    {Object.keys(productDetails).length === 0 && (
                      <p className="text-sm text-muted-foreground font-body">
                        Product details will be available soon.
                      </p>
                    )}
                    <p className="font-body text-foreground/80 leading-relaxed text-xs mt-3 italic">
                      <strong>Note:</strong> The blouse showcased in the images is from our in-house wardrobe and has been used only for styling.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="story" className="border-b border-border">
                  <AccordionTrigger className="text-xs md:text-sm font-body uppercase tracking-widest py-3 md:py-4 hover:no-underline">
                    Story
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="font-body text-foreground/80 leading-relaxed text-sm">
                      Each saree tells a story of tradition, craftsmanship, and the skilled artisans who create these masterpieces. 
                      This piece is handcrafted with love and dedication, preserving centuries-old techniques.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="description" className="border-b border-border">
                  <AccordionTrigger className="text-xs md:text-sm font-body uppercase tracking-widest py-3 md:py-4 hover:no-underline">
                    Description
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="font-body text-foreground/80 leading-relaxed text-sm">
                      {STANDARD_PRODUCT_DESCRIPTION}
                    </p>
                    <p className="font-body text-foreground/80 leading-relaxed text-sm mt-3 italic">
                      <strong>Blouse:</strong> The blouse showcased in the images is from our in-house wardrobe and has been used only for styling.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faqs" className="border-b border-border">
                  <AccordionTrigger className="text-xs md:text-sm font-body uppercase tracking-widest py-3 md:py-4 hover:no-underline">
                    Product FAQs
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4">
                      {productFAQs.map((faq) => (
                        <div key={faq.question}>
                          <p className="font-body text-sm font-semibold text-foreground mb-1">{faq.question}</p>
                          <p className="font-body text-sm text-foreground/80 leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="manufacturing" className="border-b border-border">
                  <AccordionTrigger className="text-xs md:text-sm font-body uppercase tracking-widest py-3 md:py-4 hover:no-underline">
                    Manufacturing Information
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-2 text-sm font-body text-foreground/80">
                      <p><strong>Country of Origin:</strong> India</p>
                      <p><strong>Manufactured & Packed By:</strong> Kora Sutra</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="return" className="border-b border-border">
                  <AccordionTrigger className="text-xs md:text-sm font-body uppercase tracking-widest py-3 md:py-4 hover:no-underline">
                    Return & Exchange Policy
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3 text-sm font-body text-foreground/80">
                      <p>
                        We offer easy returns and exchanges within 10 days of delivery. 
                        Items must be unused with all tags attached.
                      </p>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm">
                        <p className="font-semibold text-amber-800 flex items-center gap-2">
                          <span>📹</span> Video Proof Required
                        </p>
                        <p className="text-amber-700 text-xs mt-1">
                          An unboxing video is mandatory for all return and exchange requests. 
                          Please record while opening the package to ensure smooth processing.
                        </p>
                      </div>
                      <Link to="/returns" className="text-accent hover:underline inline-block">
                        Learn more about our return policy
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="disclaimer" className="border-b border-border">
                  <AccordionTrigger className="text-xs md:text-sm font-body uppercase tracking-widest py-3 md:py-4 hover:no-underline">
                    Disclaimer
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3 text-sm font-body text-foreground/80">
                      <p>
                        Some images on this page use AI-generated models to showcase styling and drape.
                      </p>
                      <p>
                        <strong>Blouse:</strong> The blouse showcased in the images is from our in-house wardrobe and has been used only for styling.
                      </p>
                      <p>
                        While we strive for accuracy, the actual saree may differ slightly in color tone, weave, border detailing, or finish due to fabric nature, lighting, and digital rendering.
                      </p>
                      <p className="font-medium text-foreground">
                        Video proof is required for any returns.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Customer Reviews Section */}
          {product && (
            <ProductReviews 
              productId={product.id}
              productHandle={product.handle}
              productTitle={product.title}
            />
          )}

          {/* Recently Viewed Section */}
          <RecentlyViewed currentHandle={handle} />

          {/* Related Products - Bottom */}
          <RelatedProducts currentHandle={handle || ''} currentProductType={extractProductType(product.title)} currentFabric={extractFabricFromTitle(product.title)} products={relatedProducts} />
        </div>
        
        {/* Sticky Mobile Cart Bar - add bottom padding to main content */}
        {currentVariant && (
          <StickyMobileCartBar
            price={currentVariant.price}
            isAvailable={currentVariant.availableForSale}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddToCart}
            productTitle={product.title}
            isLoading={isCheckingOut}
            sku={currentVariant.sku}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
