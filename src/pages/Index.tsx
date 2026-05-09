import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { CollectionsSection } from "@/components/CollectionsSection";
import { ShopifyProducts } from "@/components/ShopifyProducts";
import { AboutSection } from "@/components/AboutSection";
import { ArtisanSection } from "@/components/ArtisanSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { JournalsSection } from "@/components/JournalsSection";
import { NewsletterSection } from "@/components/NewsletterSection";
import { HomeFAQs } from "@/components/HomeFAQs";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PromotionalPopup } from "@/components/PromotionalPopup";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://korasutra.com/#organization",
  name: "Kora Sutra",
  alternateName: ["KoraSutra", "Kora Sutra Sarees"],
  url: "https://korasutra.com",
  logo: {
    "@type": "ImageObject",
    url: "https://korasutra.com/favicon.png",
    width: 512,
    height: 512
  },
  image: "https://korasutra.com/og-image.png",
  description: "Premium handcrafted sarees celebrating Bengal's rich textile heritage. Shop Tussar silk, Muslin, Linen, Jamdani, Kantha stitch & Block print sarees.",
  foundingDate: "2024",
  founders: [{ "@type": "Person", name: "Kora Sutra Team" }],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN"
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+91-79958-62266",
      contactType: "customer service",
      email: "customer.support@korasutra.com",
      availableLanguage: ["English", "Hindi"],
      areaServed: "IN"
    }
  ],
  sameAs: [
    "https://www.instagram.com/korasutraofficial/",
    "https://www.facebook.com/people/Korasutraofficial/61585129572992"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://korasutra.com/#website",
  url: "https://korasutra.com",
  name: "Kora Sutra",
  description: "Shop handcrafted sarees online - Tussar, Muslin, Silk, Linen & more",
  publisher: { "@id": "https://korasutra.com/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://korasutra.com/collections/all?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "@id": "https://korasutra.com/#localbusiness",
  name: "Kora Sutra",
  image: "https://korasutra.com/og-image.png",
  url: "https://korasutra.com",
  telephone: "+91-79958-62266",
  email: "customer.support@korasutra.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500001",
    addressCountry: "IN"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 17.385044,
    longitude: 78.486671
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "18:00"
    }
  ],
  priceRange: "₹₹₹",
  paymentAccepted: "Cash, Credit Card, Debit Card, UPI",
  currenciesAccepted: "INR"
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://korasutra.com"
    }
  ]
};

const Index = () => {
  const siteSettings = useSiteSettings();

  return (
    <>
      <Helmet>
        <title>Kora Sutra | Handcrafted Tussar, Muslin & Silk Sarees</title>
        <meta
          name="description"
          content="Shop authentic handcrafted sarees at Kora Sutra. Discover premium Tussar silk, Muslin, Linen, Jamdani, Kantha stitch & Block print sarees. Free shipping across India. Celebrating Bengal's rich textile heritage."
        />
        <meta
          name="keywords"
          content="Kora Sutra, KoraSutra, kora sutra sarees, kora sutra official, korasutra.com, buy sarees online, handcrafted sarees, tussar silk sarees, muslin sarees, linen sarees, jamdani sarees, kantha stitch sarees, block print sarees, batik sarees, Bengal sarees, Indian sarees, handloom sarees, luxury sarees, designer sarees, silk sarees online, buy sarees online India, traditional sarees, wedding sarees, party wear sarees, office wear sarees, casual sarees, festive sarees, Durga Puja sarees, Diwali sarees, bridal sarees, pure silk saree, handwoven sarees, artisan sarees, sustainable fashion India, eco-friendly sarees, organic sarees, saree shop online India, best saree brand India, premium sarees India, saree for women, saree collection online, Bengal handloom, Baluchari sarees, Bishnupur silk, Bhagalpur silk, Shantipur saree, cotton sarees, matka silk, katan silk, tissue tussar, tissue muslin, zari saree, zari border saree, hand painted saree, Paithani saree, saree with blouse, running blouse saree, free shipping sarees India, COD sarees, cash on delivery sarees, saree gift, saree for mother, saree for wedding guest, lightweight saree, summer saree, winter saree, monsoon saree, silk saree care, how to drape saree, saree styling, handloom vs powerloom, authentic handloom India, handloom mark, GI tagged sarees, geographical indication sarees, Hyderabad saree shop, saree store Telangana, Indian ethnic wear, traditional Indian clothing, six yards of elegance, handloom revival, support artisans India, weaver community, Bengal weaving, Birbhum handloom, Nadia handloom, bird motif saree, floral motif saree, leaf motif saree, geometric pattern saree, paisley saree, lotus motif saree"
        />
        <link rel="canonical" href="https://korasutra.com/" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://korasutra.com" />
        <meta property="og:title" content="Kora Sutra | Handcrafted Sarees - Premium Tussar, Muslin & Silk Sarees" />
        <meta property="og:description" content="Shop authentic handcrafted sarees at Kora Sutra. Discover premium Tussar silk, Muslin, Linen, Jamdani & Kantha stitch sarees." />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        <meta property="og:site_name" content="Kora Sutra" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kora Sutra | Handcrafted Sarees" />
        <meta name="twitter:description" content="Shop authentic handcrafted sarees - Tussar, Muslin, Silk & more" />
        <meta name="twitter:image" content="https://korasutra.com/og-image.png" />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar settings={siteSettings} />
        <main>
          <HeroSection settings={siteSettings} />
          <CollectionsSection />
          <ShopifyProducts />
          <ArtisanSection />
          <AboutSection />
          <TestimonialsSection />
          <HomeFAQs />
          <JournalsSection />
          <NewsletterSection />
        </main>
        <Footer />
        <WhatsAppButton />
        <PromotionalPopup settings={siteSettings.promoPopup} />
      </div>
    </>
  );
};

export default Index;
