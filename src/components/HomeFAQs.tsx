import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { homepageFAQs } from "@/data/faqs";

export function HomeFAQs() {
  return (
    <section className="py-16 md:py-20 border-t border-border/60">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading font-light tracking-wide">Frequently Asked Questions</h2>
          <p className="text-sm md:text-base text-muted-foreground font-body mt-3">
            Quick answers for shopping, OTP on WhatsApp, payment, shipping, and support.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full border-t border-border">
          {homepageFAQs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`home-faq-${index}`}>
              <AccordionTrigger className="font-heading text-base md:text-lg text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="font-body text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-8">
          <Link
            to="/faqs"
            className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary font-body text-sm rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            View All FAQs
          </Link>
        </div>
      </div>
    </section>
  );
}
