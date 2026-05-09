import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import blockPrintImg from '@/assets/block-print.jpeg';
import kanthaImg from '@/assets/kantha.jpeg';
import muslinImg from '@/assets/muslin.jpeg';
import tussarImg from '@/assets/tussar.jpeg';
import jamdaniImg from '@/assets/jamdani.jpeg';
import linenImg from '@/assets/linen.jpeg';

// Internal routes only - no external links
const collections = [{
  id: 1,
  name: 'Block Print',
  description: 'Hand-printed artistry on fine fabrics',
  image: blockPrintImg,
  href: '/collections/block-print'
}, {
  id: 2,
  name: 'Kantha Stitch',
  description: 'Traditional embroidery meets modern elegance',
  image: kanthaImg,
  href: '/collections/kantha-stitch'
}, {
  id: 3,
  name: 'Muslin',
  description: 'Feather-light fabric with timeless grace',
  image: muslinImg,
  href: '/collections/muslin'
}, {
  id: 4,
  name: 'Tussar',
  description: 'Natural tussar silk with earthy elegance',
  image: tussarImg,
  href: '/collections/tussar'
}, {
  id: 5,
  name: 'Jamdani',
  description: 'Intricate muslin weaves from Bengal',
  image: jamdaniImg,
  href: '/collections/jamdani'
}, {
  id: 6,
  name: 'Linen',
  description: 'Breathable comfort with refined style',
  image: linenImg,
  href: '/collections/linen'
}];
function CollectionCard({
  collection,
  isMobile = false
}: {
  collection: typeof collections[0];
  isMobile?: boolean;
}) {
  return <Link to={collection.href} className={`block flex-shrink-0 ${isMobile ? 'w-[75vw] max-w-[280px]' : 'w-full md:w-[calc(33.333%-1rem)]'}`}>
      <div className="group relative cursor-pointer">
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
          {/* Image */}
          <img 
            src={collection.image} 
            alt={`${collection.name} Sarees - ${collection.description} | Kora Sutra Collection`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-6">
            {/* Blur background for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-20 md:h-24 bg-gradient-to-t from-foreground/60 to-transparent backdrop-blur-[2px] -z-0" />
            
            <div className="relative z-10">
              <span className="text-xs tracking-[0.15em] md:tracking-[0.2em] text-primary-foreground/80 uppercase mb-1 md:mb-2 font-body font-medium block">
                Collection
              </span>
              
              <h3 className="text-xl md:text-2xl font-heading font-bold text-primary-foreground mb-1 md:mb-2 break-words hyphens-auto drop-shadow-lg lg:text-2xl">
                {collection.name}
              </h3>
              
              <p className={`text-xs md:text-sm text-primary-foreground/90 font-body font-medium mb-2 md:mb-4 line-clamp-2 drop-shadow-md ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500'}`}>
                {collection.description}
              </p>
              
              <div className={`flex items-center gap-2 text-primary-foreground/90 text-xs md:text-sm font-body tracking-wide ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100'}`}>
                <span>View Collection</span>
                <motion.span animate={{
                x: [0, 5, 0]
              }} transition={{
                duration: 1.5,
                repeat: Infinity
              }}>
                  →
                </motion.span>
              </div>
            </div>
          </div>

          {/* Decorative Corner */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-primary-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
    </Link>;
}
export function CollectionsSection() {
  const ref = useRef(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px'
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const totalSlides = isMobile ? collections.length : Math.ceil(collections.length / 3);

  // Auto-slide
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  // Reset index when switching between mobile/desktop
  useEffect(() => {
    setCurrentIndex(0);
  }, [isMobile]);
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  const goToPrev = () => {
    goToSlide((currentIndex - 1 + totalSlides) % totalSlides);
  };
  const goToNext = () => {
    goToSlide((currentIndex + 1) % totalSlides);
  };

  // Touch handlers for swipe
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };
  return <section ref={ref} className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
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
      }} className="text-center mb-10 md:mb-16">
          <span className="text-sm tracking-[0.3em] text-muted-foreground uppercase mb-4 block font-body">
            Curated Collections
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading">
            Experience <span className="italic">Elegance</span>
          </h2>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows - Desktop Only */}
          <button onClick={goToPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-background/90 backdrop-blur-sm rounded-full items-center justify-center shadow-lg hover:bg-background transition-colors hidden md:flex" aria-label="Previous">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button onClick={goToNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-background/90 backdrop-blur-sm rounded-full items-center justify-center shadow-lg hover:bg-background transition-colors hidden md:flex" aria-label="Next">
            <ChevronRight className="w-6 h-6" />
          </button>
          
          {/* Mobile Slider - Swipeable single cards */}
          {isMobile ? <div ref={sliderRef} className="overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <motion.div className="flex gap-3 px-4" animate={{
            x: `calc(-${currentIndex * 75}vw - ${currentIndex * 12}px + ${currentIndex > 0 ? '12.5vw' : '0px'})`
          }} transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}>
                {collections.map(collection => <CollectionCard key={collection.id} collection={collection} isMobile={true} />)}
              </motion.div>
            </div> : (/* Desktop Slider - 3 cards per slide */
        <div className="overflow-hidden">
              <motion.div className="flex gap-6" animate={{
            x: `-${currentIndex * 100}%`
          }} transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}>
                {/* Slide Groups */}
                {Array.from({
              length: totalSlides
            }).map((_, slideIndex) => <div key={slideIndex} className="flex gap-6 min-w-full">
                    {collections.slice(slideIndex * 3, slideIndex * 3 + 3).map(collection => <CollectionCard key={collection.id} collection={collection} />)}
                  </div>)}
              </motion.div>
            </div>)}
          
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6 md:mt-8">
            {Array.from({
            length: totalSlides
          }).map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'}`} aria-label={`Go to slide ${index + 1}`} />)}
          </div>
          
          {/* Swipe Hint - Mobile Only */}
          {isMobile && <p className="text-center text-xs text-muted-foreground mt-4 font-body">
              Swipe to explore collections
            </p>}
        </div>

        {/* Explore Collection Button */}
        <div className="text-center mt-10">
          <Link to="/collections/all" className="inline-block px-10 py-4 bg-primary text-primary-foreground font-body font-semibold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors rounded-sm shadow-md">
            Shop all   
          </Link>
        </div>
      </div>
    </section>;
}