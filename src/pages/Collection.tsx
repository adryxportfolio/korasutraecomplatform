import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, SlidersHorizontal, ChevronDown, ChevronRight, Heart, X, Check } from 'lucide-react';
import { fetchProducts, ShopifyProduct, formatPrice } from '@/lib/shopify';
import { toTitleCase } from '@/lib/titleCase';
import { StockIndicator } from '@/components/StockStatus';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToStorefrontRealtime } from '@/lib/realtimeTables';
import { buildGa4CartPayload, trackGa4EcommerceEvent } from '@/lib/ga4Ecommerce';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Collection configuration
const collectionConfig: Record<string, { title: string; description: string; query?: string }> = {
  'tussar': { title: 'Tussar Silk Sarees', description: 'Discover our collection of handwoven Tussar silk sarees', query: 'tussar' },
  'matka': { title: 'Matka Silk Sarees', description: 'Elegant Matka silk sarees for every occasion', query: 'matka' },
  'muslin': { title: 'Muslin Sarees', description: 'Lightweight and breathable Muslin sarees', query: 'muslin' },
  'pure-silk': { title: 'Pure Silk Sarees', description: 'Luxurious pure silk sarees', query: 'silk' },
  'katan-silk': { title: 'Katan Silk Sarees', description: 'Traditional Katan silk sarees', query: 'katan' },
  'linen': { title: 'Linen Sarees', description: 'Contemporary linen sarees for modern women', query: 'linen' },
  'cotton': { title: 'Cotton Sarees', description: 'Comfortable cotton sarees for daily wear', query: 'cotton' },
  'jamdani': { title: 'Jamdani Sarees', description: 'Exquisite Jamdani weave sarees', query: 'jamdani' },
  'kantha-stitch': { title: 'Kantha Stitch Sarees', description: 'Beautiful Kantha embroidered sarees', query: 'kantha' },
  'baluchari': { title: 'Baluchari Sarees', description: 'Traditional Baluchari sarees with intricate motifs', query: 'baluchari' },
  'hand-paint': { title: 'Hand Painted Sarees', description: 'Unique hand-painted sarees', query: 'hand paint' },
  'block-print': { title: 'Block Print Sarees', description: 'Traditional block printed sarees', query: 'block print' },
  'batik': { title: 'Batik Sarees', description: 'Artistic Batik print sarees', query: 'batik' },
  'digital-print': { title: 'Digital Print Sarees', description: 'Modern digital print sarees', query: 'digital' },
  'paithani': { title: 'Paithani Sarees', description: 'Royal Paithani sarees from Maharashtra', query: 'paithani' },
  'traditional': { title: 'Traditional Sarees', description: 'Mummy ki Almari - Timeless traditional sarees', query: 'traditional' },
  'casual': { title: 'Casual Sarees', description: 'Bas Yun Hi - Everyday casual sarees', query: 'casual' },
  'office-wear': { title: 'Office Wear Sarees', description: 'Desk Se Dil Tak - Professional office wear sarees', query: 'office' },
  'party-wear': { title: 'Party Wear Sarees', description: 'Aj Main Upar - Glamorous party wear sarees', query: 'party' },
  'best-sellers': { title: 'Best Sellers', description: 'Our most loved sarees' },
  'new-arrivals': { title: 'New Arrivals', description: 'Fresh additions to our collection' },
  'all': { title: 'All Products', description: 'Browse our complete collection' },
};

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';
type BlouseFilter = 'none' | 'all' | 'with-blouse' | 'without-blouse';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

// Collection categories with subcategories - matching Navbar structure
const collectionCategories = {
  fabric: {
    label: 'Shop by Fabric',
    items: [
      { name: 'Tussar', href: '/collections/tussar' },
      { name: 'Matka', href: '/collections/matka' },
      { name: 'Muslin', href: '/collections/muslin' },
      { name: 'Pure Silk', href: '/collections/pure-silk' },
      { name: 'Katan Silk', href: '/collections/katan-silk' },
      { name: 'Linen', href: '/collections/linen' },
      { name: 'Cotton', href: '/collections/cotton' },
    ],
  },
  patterns: {
    label: 'Shop by Patterns',
    items: [
      { name: 'Jamdani', href: '/collections/jamdani' },
      { name: 'Kantha Stitch', href: '/collections/kantha-stitch' },
      { name: 'Baluchari', href: '/collections/baluchari' },
      { name: 'Hand Paint', href: '/collections/hand-paint' },
      { name: 'Block Print', href: '/collections/block-print' },
      { name: 'Batik', href: '/collections/batik' },
      { name: 'Digital Print', href: '/collections/digital-print' },
      { name: 'Paithani', href: '/collections/paithani' },
    ],
  },
  occasions: {
    label: 'Shop by Occasions',
    items: [
      { name: 'Mummy ki Almari (Traditional)', href: '/collections/traditional' },
      { name: 'Bas Yun Hi (Casual)', href: '/collections/casual' },
      { name: 'Desk Se Dil Tak (Office Wear)', href: '/collections/office-wear' },
      { name: 'Aj Main Upar (Party Wear)', href: '/collections/party-wear' },
    ],
  },
};

// Common color mapping for normalization
const colorMap: Record<string, string> = {
  'red': '#DC2626',
  'pink': '#EC4899',
  'rose': '#F43F5E',
  'orange': '#F97316',
  'yellow': '#EAB308',
  'gold': '#D4AF37',
  'green': '#22C55E',
  'teal': '#14B8A6',
  'blue': '#3B82F6',
  'navy': '#1E3A5A',
  'purple': '#A855F7',
  'violet': '#8B5CF6',
  'maroon': '#800000',
  'brown': '#92400E',
  'beige': '#D4B896',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'white': '#FFFFFF',
  'grey': '#6B7280',
  'gray': '#6B7280',
  'black': '#1F2937',
  'off-white': '#FAF9F6',
  'mustard': '#FFDB58',
  'peach': '#FFCBA4',
  'coral': '#FF7F50',
  'magenta': '#FF00FF',
  'wine': '#722F37',
  'rust': '#B7410E',
  'olive': '#808000',
  'turquoise': '#40E0D0',
  'aqua': '#00FFFF',
  'lavender': '#E6E6FA',
  'mint': '#98FB98',
};

export default function Collection() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [filterOpen, setFilterOpen] = useState(false);
  const [blouseFilter, setBlouseFilter] = useState<BlouseFilter>('none');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Multi-select state for filter sheet (synced with URL)
  const [filterFabrics, setFilterFabrics] = useState<string[]>([]);
  const [filterPatterns, setFilterPatterns] = useState<string[]>([]);
  const [filterOccasions, setFilterOccasions] = useState<string[]>([]);
  
  const addItem = useCartStore(state => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();

  const config = slug ? collectionConfig[slug] : null;
  const searchQuery = searchParams.get('q');
  const colorsParam = searchParams.get('colors');
  const fabricsParam = searchParams.get('fabrics');
  const patternsParam = searchParams.get('patterns');
  const occasionsParam = searchParams.get('occasions');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');

  // Initialize filters from URL params
  useEffect(() => {
    if (colorsParam) {
      setSelectedColors(colorsParam.split(',').filter(c => c.trim()));
    }
    if (fabricsParam) {
      setFilterFabrics(fabricsParam.split(',').filter(f => f.trim()));
    } else {
      setFilterFabrics([]);
    }
    if (patternsParam) {
      setFilterPatterns(patternsParam.split(',').filter(p => p.trim()));
    } else {
      setFilterPatterns([]);
    }
    if (occasionsParam) {
      setFilterOccasions(occasionsParam.split(',').filter(o => o.trim()));
    } else {
      setFilterOccasions([]);
    }
    // Initialize price range from URL params
    const minPrice = minPriceParam ? parseInt(minPriceParam, 10) : 0;
    const maxPrice = maxPriceParam ? parseInt(maxPriceParam, 10) : 50000;
    if (minPriceParam || maxPriceParam) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [colorsParam, fabricsParam, patternsParam, occasionsParam, minPriceParam, maxPriceParam]);

  // Extract available colors from products - derived primarily from title
  const availableColors = useMemo(() => {
    const colorsSet = new Set<string>();
    products.forEach(product => {
      const title = product.node.title.toLowerCase();
      // Check each known color against the title
      Object.keys(colorMap).forEach(color => {
        // Use word boundary to match exact color words
        const regex = new RegExp(`\\b${color}\\b`, 'i');
        if (regex.test(title)) {
          colorsSet.add(color);
        }
      });
    });
    return Array.from(colorsSet).sort();
  }, [products]);

  // Check if product has blouse
  const hasBlouse = (product: ShopifyProduct): boolean => {
    const text = `${product.node.title} ${product.node.description}`.toLowerCase();
    const tags = product.node.tags?.map(t => t.toLowerCase()) || [];
    
    const withBlouseIndicators = ['with blouse', 'blouse included', 'includes blouse', 'blouse piece included', 'running blouse'];
    const withoutBlouseIndicators = ['without blouse', 'no blouse', 'blouse not included', 'saree only'];
    
    for (const tag of tags) {
      for (const indicator of withBlouseIndicators) {
        if (tag.includes(indicator)) return true;
      }
      for (const indicator of withoutBlouseIndicators) {
        if (tag.includes(indicator)) return false;
      }
    }
    
    for (const indicator of withBlouseIndicators) {
      if (text.includes(indicator)) return true;
    }
    for (const indicator of withoutBlouseIndicators) {
      if (text.includes(indicator)) return false;
    }
    
    if (text.includes('blouse') && !text.includes('without blouse')) return true;
    
    return false;
  };

  // Check if product title contains the selected color
  const hasColor = (product: ShopifyProduct, colors: string[]): boolean => {
    if (colors.length === 0) return true;
    
    const title = product.node.title.toLowerCase();
    
    // Product must contain at least one of the selected colors in its title
    return colors.some(selectedColor => {
      const regex = new RegExp(`\\b${selectedColor}\\b`, 'i');
      return regex.test(title);
    });
  };

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const data = await fetchProducts(100, config?.query || searchQuery || undefined);
      
      // Filter products by title to ensure they actually contain the fabric/collection keyword
      let filteredData = data;
      if (config?.query && slug) {
        const queryKeyword = config.query.toLowerCase();
        filteredData = data.filter(product => {
          const title = product.node.title.toLowerCase();
          return title.includes(queryKeyword);
        });
      }
      
      // Track unavailable filters from URL params
      const urlUnavailable: { fabrics: string[]; patterns: string[]; occasions: string[] } = {
        fabrics: [],
        patterns: [],
        occasions: []
      };
      
      // Apply multi-filter from hamburger menu (fabrics, patterns, occasions) with partial matching
      if (fabricsParam || patternsParam || occasionsParam) {
        const fabrics = fabricsParam ? fabricsParam.split(',').map(f => f.trim().toLowerCase()) : [];
        const patterns = patternsParam ? patternsParam.split(',').map(p => p.trim().toLowerCase()) : [];
        const occasions = occasionsParam ? occasionsParam.split(',').map(o => o.trim().toLowerCase()) : [];
        
        // Check which fabrics have matching products
        const fabricsWithMatches: string[] = [];
        fabrics.forEach(fabric => {
          const hasMatch = data.some(product => {
            const regex = new RegExp(`\\b${fabric}\\b`, 'i');
            return regex.test(product.node.title.toLowerCase());
          });
          if (hasMatch) {
            fabricsWithMatches.push(fabric);
          } else {
            urlUnavailable.fabrics.push(fabric);
          }
        });
        
        // Check which patterns have matching products
        const patternsWithMatches: string[] = [];
        patterns.forEach(pattern => {
          const hasMatch = data.some(product => {
            const combined = `${product.node.title} ${product.node.description || ''}`.toLowerCase();
            const regex = new RegExp(`\\b${pattern.replace(' ', '\\s*')}\\b`, 'i');
            return regex.test(combined);
          });
          if (hasMatch) {
            patternsWithMatches.push(pattern);
          } else {
            urlUnavailable.patterns.push(pattern);
          }
        });
        
        // Check which occasions have matching products
        const occasionsWithMatches: string[] = [];
        occasions.forEach(occasion => {
          const occasionKeywords = occasion.match(/\(([^)]+)\)/);
          const keyword = occasionKeywords ? occasionKeywords[1].toLowerCase() : occasion;
          const hasMatch = data.some(product => {
            const combined = `${product.node.title} ${product.node.description || ''}`.toLowerCase();
            return combined.includes(keyword);
          });
          if (hasMatch) {
            occasionsWithMatches.push(occasion);
          } else {
            urlUnavailable.occasions.push(occasion);
          }
        });
        
        // Filter using only the filters that have matches
        filteredData = data.filter(product => {
          const title = product.node.title.toLowerCase();
          const description = (product.node.description || '').toLowerCase();
          const combined = `${title} ${description}`;
          
          // Check if product matches any available fabric (only if we have fabrics with matches)
          const matchesFabric = fabricsWithMatches.length === 0 || fabricsWithMatches.some(fabric => {
            const regex = new RegExp(`\\b${fabric}\\b`, 'i');
            return regex.test(title);
          });
          
          // Check if product matches any available pattern (only if we have patterns with matches)
          const matchesPattern = patternsWithMatches.length === 0 || patternsWithMatches.some(pattern => {
            const regex = new RegExp(`\\b${pattern.replace(' ', '\\s*')}\\b`, 'i');
            return regex.test(combined);
          });
          
          // Check if product matches any available occasion (only if we have occasions with matches)
          const matchesOccasion = occasionsWithMatches.length === 0 || occasionsWithMatches.some(occasion => {
            const occasionKeywords = occasion.match(/\(([^)]+)\)/);
            const keyword = occasionKeywords ? occasionKeywords[1].toLowerCase() : occasion;
            return combined.includes(keyword);
          });
          
          // Product must match at least one filter from each category that has available matches
          return matchesFabric && matchesPattern && matchesOccasion;
        });
      }
      
      // Update unavailable filters state for URL params
      setUnavailableFilters(prev => ({
        ...prev,
        fabrics: urlUnavailable.fabrics,
        patterns: urlUnavailable.patterns,
        occasions: urlUnavailable.occasions
      }));
      
      setProducts(filteredData);
      
      // Set fixed max price of 50,000
      setMaxPrice(50000);
      // Only reset price range if it hasn't been modified by user (initial load)
      // Don't reset on subsequent loads to preserve user's filter selection
      
      setLoading(false);
    }
    loadProducts();

    return subscribeToStorefrontRealtime(supabase, `collection-catalog-${slug || 'all'}`, loadProducts);
  }, [slug, config?.query, searchQuery, fabricsParam, patternsParam, occasionsParam]);

  // Track which filter categories have no matching products
  const [unavailableFilters, setUnavailableFilters] = useState<{
    colors: string[];
    fabrics: string[];
    patterns: string[];
    occasions: string[];
  }>({ colors: [], fabrics: [], patterns: [], occasions: [] });

  // Filter and sort products with partial match logic
  useEffect(() => {
    let result = [...products];
    const unavailable: typeof unavailableFilters = { colors: [], fabrics: [], patterns: [], occasions: [] };
    
    // Price filter (always applied)
    result = result.filter(p => {
      const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Blouse filter - 'none' and 'all' both show all products
    if (blouseFilter === 'with-blouse') {
      result = result.filter(p => hasBlouse(p));
    } else if (blouseFilter === 'without-blouse') {
      result = result.filter(p => !hasBlouse(p));
    }

    // Check which color filters have matching products
    if (selectedColors.length > 0) {
      const colorsWithMatches: string[] = [];
      const colorsWithoutMatches: string[] = [];
      
      selectedColors.forEach(color => {
        const hasMatch = result.some(p => {
          const regex = new RegExp(`\\b${color}\\b`, 'i');
          return regex.test(p.node.title.toLowerCase());
        });
        if (hasMatch) {
          colorsWithMatches.push(color);
        } else {
          colorsWithoutMatches.push(color);
        }
      });
      
      unavailable.colors = colorsWithoutMatches;
      
      // Only filter if there are colors with matches
      if (colorsWithMatches.length > 0) {
        result = result.filter(p => hasColor(p, colorsWithMatches));
      }
      // If no colors have matches, keep showing all products and just mark them unavailable
    }
    
    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => 
          parseFloat(a.node.priceRange.minVariantPrice.amount) - 
          parseFloat(b.node.priceRange.minVariantPrice.amount)
        );
        break;
      case 'price-high':
        result.sort((a, b) => 
          parseFloat(b.node.priceRange.minVariantPrice.amount) - 
          parseFloat(a.node.priceRange.minVariantPrice.amount)
        );
        break;
      case 'newest':
        // Keep original order (assuming newest first from API)
        break;
      default:
        // Featured - keep original order
        break;
    }
    
    setUnavailableFilters(unavailable);
    setFilteredProducts(result);
  }, [products, sortBy, priceRange, blouseFilter, selectedColors]);


  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    if (!variant.availableForSale) {
      toast.error('This item is out of stock', {
        description: product.node.title,
        position: 'top-center',
      });
      return;
    }

    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      maxQuantity: 1, // Sarees are typically one-of-a-kind
      selectedOptions: variant.selectedOptions || [],
    };
    addItem(cartItem);
    trackGa4EcommerceEvent('add_to_cart', buildGa4CartPayload([cartItem]));

    toast.success('Added to cart', {
      description: product.node.title,
      position: 'top-center',
    });
  };

  const handleWishlistToggle = (product: ShopifyProduct) => {
    if (isInWishlist(product.node.id)) {
      removeFromWishlist(product.node.id);
      toast.success('Removed from wishlist', { position: 'top-center' });
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist', { position: 'top-center' });
    }
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Toggle functions for filter sheet multi-select
  const toggleFilterFabric = (value: string) => {
    setFilterFabrics(prev => 
      prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
    );
  };

  const toggleFilterPattern = (value: string) => {
    setFilterPatterns(prev => 
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  const toggleFilterOccasion = (value: string) => {
    setFilterOccasions(prev => 
      prev.includes(value) ? prev.filter(o => o !== value) : [...prev, value]
    );
  };

  const handleFilterApply = () => {
    setFilterOpen(false);
    const params = new URLSearchParams();
    if (filterFabrics.length > 0) params.set('fabrics', filterFabrics.join(','));
    if (filterPatterns.length > 0) params.set('patterns', filterPatterns.join(','));
    if (filterOccasions.length > 0) params.set('occasions', filterOccasions.join(','));
    if (selectedColors.length > 0) params.set('colors', selectedColors.join(','));
    // Persist price range in URL if not default
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < maxPrice) params.set('maxPrice', priceRange[1].toString());
    
    const queryString = params.toString();
    navigate(`/collections/all${queryString ? `?${queryString}` : ''}`);
  };

  // Check if any filters are selected (including colors)
  const hasFilterSelections = filterFabrics.length > 0 || filterPatterns.length > 0 || filterOccasions.length > 0 || selectedColors.length > 0;
  const totalFilterSelections = filterFabrics.length + filterPatterns.length + filterOccasions.length + selectedColors.length;

  const clearFilterSelections = () => {
    setFilterFabrics([]);
    setFilterPatterns([]);
    setFilterOccasions([]);
    setSelectedColors([]);
  };

  const handleCategoryNavigation = (href: string) => {
    setFilterOpen(false);
    navigate(href);
  };

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    setSortBy('featured');
    setBlouseFilter('none');
    setSelectedColors([]);
    setFilterFabrics([]);
    setFilterPatterns([]);
    setFilterOccasions([]);
    navigate('/collections/all');
  };

  // Active URL filters from hamburger menu (including colors)
  const urlFabrics = fabricsParam ? fabricsParam.split(',').map(f => f.trim()) : [];
  const urlPatterns = patternsParam ? patternsParam.split(',').map(p => p.trim()) : [];
  const urlOccasions = occasionsParam ? occasionsParam.split(',').map(o => o.trim()) : [];
  const urlColors = colorsParam ? colorsParam.split(',').map(c => c.trim()) : [];
  const hasUrlFilters = urlFabrics.length > 0 || urlPatterns.length > 0 || urlOccasions.length > 0 || urlColors.length > 0;

  const activeFiltersCount = (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) + 
    (blouseFilter !== 'none' ? 1 : 0) + 
    selectedColors.length +
    urlFabrics.length + urlPatterns.length + urlOccasions.length + urlColors.length;

  const clearUrlFilter = (type: 'fabrics' | 'patterns' | 'occasions' | 'colors', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    const param = newParams.get(type);
    if (param) {
      const values = param.split(',').filter(v => v.trim().toLowerCase() !== value.toLowerCase());
      if (values.length > 0) {
        newParams.set(type, values.join(','));
      } else {
        newParams.delete(type);
      }
    }
    navigate(`/collections/all${newParams.toString() ? `?${newParams.toString()}` : ''}`);
  };

  if (!config && !searchQuery && !hasUrlFilters) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-heading mb-4">Collection not found</h1>
            <Link to="/" className="text-accent hover:underline">
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Dynamic title based on active filters
  const getFilteredTitle = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (hasUrlFilters) {
      const allFilters = [...urlFabrics, ...urlPatterns, ...urlOccasions];
      if (allFilters.length === 1) {
        return allFilters[0].charAt(0).toUpperCase() + allFilters[0].slice(1) + ' Sarees';
      }
      return 'Filtered Collection';
    }
    return config?.title || 'All Products';
  };

  const title = getFilteredTitle();
  const description = searchQuery 
    ? `Showing results for "${searchQuery}"` 
    : hasUrlFilters 
      ? `Showing products matching your selected filters` 
      : config?.description || '';

  // SEO meta content
  const seoTitle = searchQuery 
    ? `Search: ${searchQuery} - Kora Sutra Sarees`
    : `${title} - Kora Sutra | Handcrafted Sarees Online`;
  
  const seoDescription = searchQuery
    ? `Search results for "${searchQuery}" at Kora Sutra. Find handcrafted sarees matching your search.`
    : config?.description 
      ? `${config.description}. Shop authentic handcrafted ${slug} sarees at Kora Sutra. Free shipping across India.`
      : 'Browse our complete collection of handcrafted sarees at Kora Sutra. Tussar, Muslin, Linen, Jamdani, and more.';

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
      { "@type": "ListItem", position: 2, name: title, item: `https://korasutra.com/collections/${slug || 'all'}` }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: seoDescription,
    url: `https://korasutra.com/collections/${slug || 'all'}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.slice(0, 10).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.node.title,
          url: `https://korasutra.com/products/${product.node.handle}`,
          image: product.node.images.edges[0]?.node.url,
          offers: {
            "@type": "Offer",
            price: product.node.priceRange.minVariantPrice.amount,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock"
          }
        }
      }))
    }
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${title}, Kora Sutra, handcrafted sarees, ${slug} sarees, buy sarees online, Indian sarees`} />
        <link rel="canonical" href={`https://korasutra.com/collections/${slug || 'all'}`} />
        
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={`https://korasutra.com/collections/${slug || 'all'}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
      </Helmet>
      
      <Navbar />
      <main className="min-h-screen pt-24 md:pt-28 pb-16 overflow-x-hidden">
        <div className="container mx-auto px-3 md:px-6 max-w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 font-body">
            <Link to="/" className="hover:text-foreground transition-colors flex-shrink-0">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground truncate">{title}</span>
          </nav>

          {/* Collection Header */}
          <div className="text-center mb-4 md:mb-8">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-heading tracking-wide mb-2 md:mb-4">
              {title}
            </h1>
            <p className="text-xs md:text-base text-muted-foreground font-body max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Active URL Filter Chips */}
          {hasUrlFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground font-body">Active filters:</span>
              {urlFabrics.map(fabric => (
                <button
                  key={`fabric-${fabric}`}
                  onClick={() => clearUrlFilter('fabrics', fabric)}
                  className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-full hover:bg-accent/20 transition-colors"
                >
                  {fabric.charAt(0).toUpperCase() + fabric.slice(1)}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {urlPatterns.map(pattern => (
                <button
                  key={`pattern-${pattern}`}
                  onClick={() => clearUrlFilter('patterns', pattern)}
                  className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-full hover:bg-accent/20 transition-colors"
                >
                  {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {urlOccasions.map(occasion => (
                <button
                  key={`occasion-${occasion}`}
                  onClick={() => clearUrlFilter('occasions', occasion)}
                  className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-full hover:bg-accent/20 transition-colors"
                >
                  {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {urlColors.map(color => (
                <button
                  key={`color-${color}`}
                  onClick={() => clearUrlFilter('colors', color)}
                  className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-full hover:bg-accent/20 transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-border/50"
                    style={{ backgroundColor: colorMap[color] || '#888' }}
                  />
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={() => navigate('/collections/all')}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Filter & Sort Bar */}
          <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b border-border gap-2">
            <div className="flex items-center gap-3">
              {/* Filter Button - Mobile Sheet */}
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filter
                    {activeFiltersCount > 0 && (
                      <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="font-heading">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    {/* Price Range Filter */}
                    <div>
                      <h3 className="text-sm font-body uppercase tracking-wide mb-4">Price Range</h3>
                      <Slider
                        value={priceRange}
                        min={0}
                        max={maxPrice}
                        step={500}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        className="mb-4"
                        showMarks
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
                        <span>₹{priceRange[0].toLocaleString()}</span>
                        <span>to</span>
                        <span>₹{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Blouse Piece Filter */}
                    <div>
                      <h3 className="text-sm font-body uppercase tracking-wide mb-4">Blouse Piece</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={slug === 'all'}
                            onCheckedChange={() => {
                              setFilterOpen(false);
                              navigate('/collections/all');
                            }}
                          />
                          <span className="text-sm">All Sarees</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={blouseFilter === 'with-blouse'}
                            onCheckedChange={() => setBlouseFilter('with-blouse')}
                          />
                          <span className="text-sm">With Blouse</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={blouseFilter === 'without-blouse'}
                            onCheckedChange={() => setBlouseFilter('without-blouse')}
                          />
                          <span className="text-sm">Without Blouse</span>
                        </label>
                      </div>
                    </div>

                    {/* Color Filter */}
                    {availableColors.length > 0 && (
                      <div>
                        <h3 className="text-sm font-body uppercase tracking-wide mb-4 flex items-center gap-2">
                          Colors
                          {selectedColors.length > 0 && (
                            <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                              {selectedColors.length}
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map(color => (
                            <button
                              key={color}
                              onClick={() => toggleColor(color)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs capitalize transition-all ${
                                selectedColors.includes(color)
                                  ? 'border-foreground bg-foreground text-background'
                                  : 'border-border hover:border-foreground'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-border/50"
                                style={{ backgroundColor: colorMap[color] }}
                              />
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shop by Fabric */}
                    <div>
                      <button
                        onClick={() => toggleCategory('fabric')}
                        className="flex items-center justify-between w-full text-sm font-body uppercase tracking-wide mb-2"
                      >
                        <span className="flex items-center gap-2">
                          Shop by Fabric
                          {filterFabrics.length > 0 && (
                            <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                              {filterFabrics.length}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedCategory === 'fabric' ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {expandedCategory === 'fabric' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 pt-2">
                              {collectionCategories.fabric.items.map((item) => {
                                const value = item.name.toLowerCase();
                                const isSelected = filterFabrics.includes(value);
                                return (
                                  <button
                                    key={item.name}
                                    onClick={() => toggleFilterFabric(value)}
                                    className="flex items-center gap-3 w-full text-left py-1.5 text-sm text-muted-foreground hover:text-accent transition-colors pl-2"
                                  >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                      isSelected ? 'bg-accent border-accent' : 'border-border'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 text-accent-foreground" />}
                                    </div>
                                    {item.name}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Shop by Patterns */}
                    <div>
                      <button
                        onClick={() => toggleCategory('patterns')}
                        className="flex items-center justify-between w-full text-sm font-body uppercase tracking-wide mb-2"
                      >
                        <span className="flex items-center gap-2">
                          Shop by Patterns
                          {filterPatterns.length > 0 && (
                            <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                              {filterPatterns.length}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedCategory === 'patterns' ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {expandedCategory === 'patterns' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 pt-2">
                              {collectionCategories.patterns.items.map((item) => {
                                const value = item.name.toLowerCase();
                                const isSelected = filterPatterns.includes(value);
                                return (
                                  <button
                                    key={item.name}
                                    onClick={() => toggleFilterPattern(value)}
                                    className="flex items-center gap-3 w-full text-left py-1.5 text-sm text-muted-foreground hover:text-accent transition-colors pl-2"
                                  >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                      isSelected ? 'bg-accent border-accent' : 'border-border'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 text-accent-foreground" />}
                                    </div>
                                    {item.name}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Shop by Occasions */}
                    <div>
                      <button
                        onClick={() => toggleCategory('occasions')}
                        className="flex items-center justify-between w-full text-sm font-body uppercase tracking-wide mb-2"
                      >
                        <span className="flex items-center gap-2">
                          Shop by Occasions
                          {filterOccasions.length > 0 && (
                            <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                              {filterOccasions.length}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedCategory === 'occasions' ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {expandedCategory === 'occasions' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 pt-2">
                              {collectionCategories.occasions.items.map((item) => {
                                const value = item.name.toLowerCase();
                                const isSelected = filterOccasions.includes(value);
                                return (
                                  <button
                                    key={item.name}
                                    onClick={() => toggleFilterOccasion(value)}
                                    className="flex items-center gap-3 w-full text-left py-1.5 text-sm text-muted-foreground hover:text-accent transition-colors pl-2"
                                  >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                      isSelected ? 'bg-accent border-accent' : 'border-border'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 text-accent-foreground" />}
                                    </div>
                                    {item.name}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Apply & Clear Buttons - Show when any filters are selected */}
                    {hasFilterSelections && (
                      <div className="pt-4 space-y-2 border-t border-border">
                        <Button
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-3"
                          onClick={handleFilterApply}
                        >
                          Apply Filters ({totalFilterSelections})
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-muted-foreground"
                          onClick={clearFilterSelections}
                        >
                          Clear All Selections
                        </Button>
                      </div>
                    )}

                    {/* Clear All Filters */}
                    <Button
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        clearFilters();
                        setFilterOpen(false);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Active Filters Display */}
              {activeFiltersCount > 0 && (
                <div className="hidden md:flex items-center gap-2 flex-wrap">
                  {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                    <span className="text-xs bg-secondary px-2 py-1 rounded flex items-center gap-1">
                      ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                      <button onClick={() => setPriceRange([0, maxPrice])}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {blouseFilter !== 'none' && (
                    <span className="text-xs bg-secondary px-2 py-1 rounded flex items-center gap-1 capitalize">
                      {blouseFilter === 'all' ? 'All Sarees' : blouseFilter === 'with-blouse' ? 'With Blouse' : 'Without Blouse'}
                      <button onClick={() => setBlouseFilter('none')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedColors.map(color => (
                    <span key={color} className="text-xs bg-secondary px-2 py-1 rounded flex items-center gap-1 capitalize">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-border/50"
                        style={{ backgroundColor: colorMap[color] }}
                      />
                      {color}
                      <button onClick={() => toggleColor(color)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {urlFabrics.map(fabric => (
                    <span key={`fabric-${fabric}`} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded flex items-center gap-1 capitalize">
                      {fabric}
                      <button onClick={() => clearUrlFilter('fabrics', fabric)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {urlPatterns.map(pattern => (
                    <span key={`pattern-${pattern}`} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded flex items-center gap-1 capitalize">
                      {pattern}
                      <button onClick={() => clearUrlFilter('patterns', pattern)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {urlOccasions.map(occasion => (
                    <span key={`occasion-${occasion}`} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded flex items-center gap-1 capitalize">
                      {occasion}
                      <button onClick={() => clearUrlFilter('occasions', occasion)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Product Count */}
              <span className="text-sm text-muted-foreground hidden md:block">
                {filteredProducts.length} products
              </span>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Sort
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={sortBy === option.value ? 'bg-secondary' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>


          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body mb-4">
                No products found matching your criteria.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Unavailable filter notices */}
              {(unavailableFilters.colors.length > 0 || unavailableFilters.fabrics.length > 0 || 
                unavailableFilters.patterns.length > 0 || unavailableFilters.occasions.length > 0) && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-body">
                    <span className="font-medium text-foreground">Some selections are currently unavailable:</span>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {unavailableFilters.colors.map(color => (
                      <span key={`unavail-color-${color}`} className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-border/50"
                          style={{ backgroundColor: colorMap[color] || '#888' }}
                        />
                        {color.charAt(0).toUpperCase() + color.slice(1)} (color)
                        <button onClick={() => clearUrlFilter('colors', color)} className="ml-1 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {unavailableFilters.fabrics.map(fabric => (
                      <span key={`unavail-fabric-${fabric}`} className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                        {fabric.charAt(0).toUpperCase() + fabric.slice(1)} (fabric)
                        <button onClick={() => clearUrlFilter('fabrics', fabric)} className="ml-1 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {unavailableFilters.patterns.map(pattern => (
                      <span key={`unavail-pattern-${pattern}`} className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                        {pattern.charAt(0).toUpperCase() + pattern.slice(1)} (pattern)
                        <button onClick={() => clearUrlFilter('patterns', pattern)} className="ml-1 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {unavailableFilters.occasions.map(occasion => (
                      <span key={`unavail-occasion-${occasion}`} className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                        {occasion.charAt(0).toUpperCase() + occasion.slice(1)} (occasion)
                        <button onClick={() => clearUrlFilter('occasions', occasion)} className="ml-1 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing {filteredProducts.length} products from your other selections.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
              {filteredProducts.map(({ node }, index) => {
                const productHasBlouse = hasBlouse({ node });
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    <div className="relative">
                      <Link to={`/products/${node.handle}`}>
                        <div className="aspect-[3/4] overflow-hidden bg-secondary/20 mb-2 relative rounded-sm">
                          {node.images.edges[0]?.node && (
                            <img
                              src={node.images.edges[0].node.url}
                              alt={node.images.edges[0].node.altText || `${node.title} - Handcrafted Saree by Kora Sutra`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          )}
                          
                          {/* Fabric Badge */}
                          {(() => {
                            const fabricKeywords = ['Tussar', 'Matka', 'Muslin', 'Silk', 'Katan', 'Linen', 'Cotton', 'Kantha', 'Jamdani', 'Baluchari', 'Batik', 'Paithani', 'Block Print'];
                            const fabric = fabricKeywords.find(f => node.title.toLowerCase().includes(f.toLowerCase()));
                            return fabric ? (
                              <span className="absolute top-2 left-2 px-2 py-0.5 bg-background/90 backdrop-blur-sm text-[10px] md:text-xs font-body tracking-wider uppercase text-foreground/80 rounded-sm">
                                {fabric}
                              </span>
                            ) : null;
                          })()}
                          
                          {/* View Button - bottom right */}
                          <div className="absolute bottom-2 right-2">
                            <span className="flex items-center gap-1 bg-background/90 backdrop-blur-sm text-foreground text-[10px] md:text-xs px-2 py-1 rounded-full font-body">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7-3.636-7-10-7z"/>
                              </svg>
                              view
                            </span>
                          </div>
                        </div>
                      </Link>
                      
                      {/* Wishlist Button */}
                      <button
                        onClick={() => handleWishlistToggle({ node })}
                        className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-full transition-all shadow-sm ${
                          isInWishlist(node.id) ? 'text-red-500' : 'text-foreground'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(node.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <Link to={`/products/${node.handle}`} className="block">
                      <h3 className="font-heading text-xs md:text-sm text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                        {toTitleCase(node.title)}
                      </h3>
                      
                      {/* Blouse Badge */}
                      {productHasBlouse && (
                        <span className="inline-block mt-1 text-[10px] md:text-xs px-2 py-0.5 border border-border text-muted-foreground font-body">
                          Saree with blouse piece
                        </span>
                      )}
                      
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-sm md:text-base font-price">
                          {formatPrice(node.priceRange.minVariantPrice.amount, node.priceRange.minVariantPrice.currencyCode)}
                        </p>
                        {node.variants.edges[0]?.node && (
                          <StockIndicator
                            availableForSale={node.variants.edges[0].node.availableForSale}
                          />
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
