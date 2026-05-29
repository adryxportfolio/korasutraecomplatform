import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { storeFAQs } from "@/data/faqs";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "FAQs", item: "https://korasutra.com/faqs" }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: storeFAQs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
};

export default function FAQs() {
  return (
    <>
      <Helmet>
        <title>FAQs - Korasutra | Frequently Asked Questions About Handcrafted Sarees</title>
        <meta 
          name="description" 
          content="Find answers to common questions about Kora Sutra sarees - shipping, returns, payment methods, saree care, sizing, and more. Get help with your saree purchase." 
        />
        <meta name="keywords" content="Kora Sutra FAQ, saree questions, shipping policy, returns policy, saree care, saree sizing, payment methods" />
        <link rel="canonical" href="https://korasutra.com/faqs" />
        
        <meta property="og:title" content="FAQs - Korasutra | Frequently Asked Questions" />
        <meta property="og:description" content="Find answers to common questions about Kora Sutra sarees - shipping, returns, payment methods, and more." />
        <meta property="og:url" content="https://korasutra.com/faqs" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Frequently Asked Questions</h1>
          <p className="text-muted-foreground font-body mb-12">
            Find answers to common questions about Kora Sutra, our products, and services.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {storeFAQs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="font-heading text-lg text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 p-6 bg-secondary/50 rounded-sm">
            <h2 className="text-xl font-heading mb-4">Still have questions?</h2>
            <p className="text-muted-foreground font-body mb-4">
              Contact our support team and we'll be happy to help.
            </p>
            <a 
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-body text-sm rounded-sm hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}
