import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'The Brown Tussar Baluchari I received was absolutely stunning. The craftsmanship is impeccable and the fabric feels so luxurious. Kora Sutra has earned a customer for life!',
    product: 'Brown Tussar Baluchari'
  },
  {
    id: 2,
    name: 'Ananya Reddy',
    location: 'Hyderabad',
    rating: 5,
    text: 'I was looking for a special saree for my sister\'s wedding and found the perfect one here. The quality exceeded my expectations and the delivery was prompt. Highly recommend!',
    product: 'Pink Tissue Muslin'
  },
  {
    id: 3,
    name: 'Meera Iyer',
    location: 'Chennai',
    rating: 5,
    text: 'Such beautiful weaves! You can feel the love and care that goes into each piece. The saree I bought has received so many compliments. Thank you, Kora Sutra!',
    product: 'Jamdani Silk'
  },
  {
    id: 4,
    name: 'Kavitha Das',
    location: 'Kolkata',
    rating: 5,
    text: 'As someone who appreciates traditional handloom, I\'m truly impressed. The Kantha stitch saree is a work of art. Worth every penny!',
    product: 'Kantha Stitch'
  },
  {
    id: 5,
    name: 'Rashmi Patel',
    location: 'Ahmedabad',
    rating: 5,
    text: 'The customer service was exceptional. They helped me choose the perfect saree for a special occasion. The quality is outstanding!',
    product: 'Linen Saree'
  },
  {
    id: 6,
    name: 'Deepika Nair',
    location: 'Bangalore',
    rating: 5,
    text: 'I\'ve bought multiple sarees from Kora Sutra and each one has been a treasure. The attention to detail and authenticity is what keeps me coming back.',
    product: 'Block Print'
  },
  {
    id: 7,
    name: 'Sunita Menon',
    location: 'Kochi',
    rating: 5,
    text: 'The Muslin saree I ordered was simply divine! The softness and drape are unmatched. I felt like royalty wearing it to my daughter\'s engagement.',
    product: 'Muslin Saree'
  },
  {
    id: 8,
    name: 'Lakshmi Venkatesh',
    location: 'Delhi',
    rating: 5,
    text: 'Finally found authentic handloom sarees online! The colors are exactly as shown and the fabric quality is premium. Already planning my next purchase.',
    product: 'Tussar Silk'
  },
  {
    id: 9,
    name: 'Sneha Kulkarni',
    location: 'Pune',
    rating: 5,
    text: 'Gifted my mother a beautiful Jamdani and she was in tears of joy. The intricate work and premium packaging made it extra special. Thank you!',
    product: 'Jamdani Cotton'
  },
  {
    id: 10,
    name: 'Rina Chatterjee',
    location: 'Jaipur',
    rating: 5,
    text: 'The attention to preserving traditional weaving techniques while keeping designs contemporary is remarkable. My Block Print saree is a conversation starter!',
    product: 'Block Print Cotton'
  },
  {
    id: 11,
    name: 'Pooja Agarwal',
    location: 'Lucknow',
    rating: 5,
    text: 'Ordered for Diwali and was amazed by the craftsmanship. The saree looked even more beautiful in person. Kora Sutra truly celebrates Indian heritage.',
    product: 'Chanderi Silk'
  },
  {
    id: 12,
    name: 'Divya Krishnamurthy',
    location: 'Coimbatore',
    rating: 5,
    text: 'As a collector of handloom sarees, I can confidently say Kora Sutra offers museum-quality pieces. Each saree tells a story of our rich textile tradition.',
    product: 'Kanjivaram Silk'
  }
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="bg-background rounded-sm p-6 shadow-soft hover:shadow-lg transition-all duration-300 group cursor-default"
    >
      <motion.div
        initial={{ rotate: 0 }}
        whileHover={{ rotate: 12, scale: 1.1 }}
        transition={{ duration: 0.3 }}
      >
        <Quote className="w-8 h-8 text-primary/30 mb-4 group-hover:text-primary/50 transition-colors duration-300" />
      </motion.div>
      
      <p className="text-muted-foreground font-body leading-relaxed mb-6">
        "{testimonial.text}"
      </p>
      
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: (index * 0.08) + 0.5 + (i * 0.05),
              type: "spring",
              stiffness: 300
            }}
          >
            <Star className="w-4 h-4 fill-primary text-primary" />
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        className="border-t border-border pt-4"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: (index * 0.08) + 0.6 }}
      >
        <p className="font-heading text-foreground group-hover:text-primary transition-colors duration-300">{testimonial.name}</p>
        <p className="text-sm text-muted-foreground font-body">{testimonial.location}</p>
        <p className="text-xs text-primary font-body mt-1">Purchased: {testimonial.product}</p>
      </motion.div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [showAll, setShowAll] = useState(false);

  // Show 4 on mobile initially, all on desktop
  const visibleTestimonials = showAll ? testimonials : testimonials.slice(0, 6);

  return (
    <section ref={ref} className="py-24 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="text-sm tracking-[0.3em] text-muted-foreground uppercase mb-4 block font-body"
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={isInView ? { opacity: 1, letterSpacing: '0.3em' } : { opacity: 0, letterSpacing: '0.1em' }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            What Our Customers Say
          </motion.span>
          <motion.h2 
            className="text-4xl md:text-5xl font-heading font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Loved by <motion.span 
              className="italic text-accent inline-block"
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >Women</motion.span> Everywhere
          </motion.h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {visibleTestimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Load More on mobile */}
        {!showAll && testimonials.length > 6 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="px-6 py-2 border border-border rounded-sm text-sm font-body text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              Show More Reviews
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
