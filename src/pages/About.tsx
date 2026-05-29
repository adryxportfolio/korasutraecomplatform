import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ChevronRight } from 'lucide-react';

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "About Us", item: "https://korasutra.com/about" }
  ]
};

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Korasutra | Our Story & Heritage - Handcrafted Sarees from Bengal</title>
        <meta 
          name="description" 
          content="Discover the story behind Kora Sutra. We celebrate Bengal's rich textile heritage through handcrafted sarees - where artisans, weaves, and stories meet with honesty." 
        />
        <meta name="keywords" content="Kora Sutra story, about Kora Sutra, Bengal textile heritage, handcrafted sarees story, artisan sarees, Indian textile tradition" />
        <link rel="canonical" href="https://korasutra.com/about" />
        
        <meta property="og:title" content="About Korasutra | Our Story & Heritage" />
        <meta property="og:description" content="Discover the story behind Kora Sutra - celebrating Bengal's rich textile heritage through handcrafted sarees." />
        <meta property="og:url" content="https://korasutra.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <span className="text-sm tracking-[0.3em] text-muted-foreground uppercase mb-4 block font-body">
                Our Story
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-light mb-6">
                Weaving Dreams Into
                <br />
                <span className="italic text-accent">Timeless Elegance</span>
              </h1>
            </div>

            {/* Story Content */}
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8 text-muted-foreground font-body leading-relaxed">
                <p className="text-xl">
                  It started long ago…
                </p>
                
                <p>
                  in the rustle of Ma's saree,
                  <br />
                  in Dida's quiet embroideries,
                  <br />
                  and in those childhood afternoons when we wrapped ourselves in whatever fabric we found,
                  <br />
                  hoping to look like the women we admired.
                </p>

                <p>
                  Somewhere in those small, ordinary moments,
                  <br />
                  a deep love for sarees took root—steady, quiet, unforgettable.
                </p>

                <p>
                  What began as simple fascination slowly became a dream that gently kept me awake…
                </p>

                <p>
                  Today, that dream finds its life in Kora Sutra—
                  <br />
                  a space where artisans, weaves, and stories meet with honesty.
                </p>

                <p className="text-foreground font-heading text-xl">
                  Where a saree is not just worn, but chosen… cherished… and passed on.
                </p>
              </div>
            </div>

            {/* Values Section */}
            <div className="mt-20 grid md:grid-cols-2 gap-8">
              <div className="bg-secondary/50 rounded-sm p-8">
                <span className="text-3xl mb-4 block">🧵</span>
                <h3 className="font-heading text-xl mb-3">Artisan Crafted</h3>
                <p className="text-muted-foreground font-body">
                  Woven by master craftsmen whose skills have been passed down through five generations of dedicated artisans.
                </p>
              </div>
              
              <div className="bg-secondary/50 rounded-sm p-8">
                <span className="text-3xl mb-4 block">✨</span>
                <h3 className="font-heading text-xl mb-3">Pure Fabrics</h3>
                <p className="text-muted-foreground font-body">
                  Sourced from the finest silk farms and cotton fields across India, ensuring unparalleled quality.
                </p>
              </div>
              
              <div className="bg-secondary/50 rounded-sm p-8">
                <span className="text-3xl mb-4 block">🌿</span>
                <h3 className="font-heading text-xl mb-3">Ethically Made</h3>
                <p className="text-muted-foreground font-body">
                  Supporting fair wages and sustainable practices that honor both people and planet.
                </p>
              </div>
              
              <div className="bg-secondary/50 rounded-sm p-8">
                <span className="text-3xl mb-4 block">🎁</span>
                <h3 className="font-heading text-xl mb-3">Heirloom Quality</h3>
                <p className="text-muted-foreground font-body">
                  Designed to be treasured and passed down through generations as precious keepsakes.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-20 text-center">
              <p className="text-muted-foreground font-body mb-6">
                Explore our curated collection of handcrafted sarees
              </p>
              <a
                href="/collections/all"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-body tracking-wide rounded-sm hover:bg-primary/90 transition-colors"
              >
                Shop The Collection
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
