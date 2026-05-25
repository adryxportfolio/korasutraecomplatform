import { BLOUSE_STYLING_DISCLAIMER } from "@/lib/productPresentation";

export type FAQItem = {
  question: string;
  answer: string;
};

export const storeFAQs: FAQItem[] = [
  {
    question: "How do I buy a Kora Sutra saree?",
    answer: "Add your saree to cart, verify your mobile number with an OTP on WhatsApp, add your shipping details, and complete checkout with Razorpay or Cash on Delivery.",
  },
  {
    question: "Why do I need OTP verification on WhatsApp?",
    answer: "WhatsApp OTP verification protects your order, keeps delivery updates tied to the right phone number, and helps you access your account and order history.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept UPI, credit cards, debit cards, net banking, wallets through Razorpay, and Cash on Delivery where available. COD includes the surcharge shown at checkout.",
  },
  {
    question: "How long does shipping take?",
    answer: "Most orders within India are delivered in 5-7 business days after confirmation. Tracking details are updated on your order page when the shipment is dispatched.",
  },
  {
    question: "Can I return or exchange a saree?",
    answer: "Returns and exchanges are accepted within the policy window when the saree is unused, tags are intact, and an unboxing video is available for verification.",
  },
  {
    question: "How can I track my order?",
    answer: "Use the account icon to sign in with OTP on WhatsApp and view recent orders, or use Track Order with your order number and verified phone number.",
  },
  {
    question: "How do I contact support?",
    answer: "You can contact support from the account menu, the Contact page, WhatsApp, email, or phone during support hours.",
  },
  {
    question: "Do you ship internationally?",
    answer: "We currently ship within India. International shipping options will be announced when available.",
  },
];

export const homepageFAQs = storeFAQs.slice(0, 6);

export function buildProductFAQs(productTitle: string, fabric: string, productType: string): FAQItem[] {
  const productName = productTitle || "this saree";
  const craft = productType || fabric || "handcrafted saree";

  return [
    {
      question: `Is ${productName} ready to ship?`,
      answer: "If the product shows as in stock, you can place the order immediately. Dispatch and delivery updates will appear on your order tracking page.",
    },
    {
      question: `What should I know about this ${craft}?`,
      answer: `${fabric || "The fabric"} is selected for drape, texture, and finish. Please review the product details, images, and care guidance before checkout.`,
    },
    {
      question: "Is the blouse included?",
      answer: `Blouse inclusion depends on the product details shown above. ${BLOUSE_STYLING_DISCLAIMER}`,
    },
    {
      question: "How should I care for this saree?",
      answer: "Dry clean is recommended for most Kora Sutra sarees to preserve color, weave, and finish. Store folded in a breathable fabric cover away from direct sunlight.",
    },
    {
      question: "Can I return this product?",
      answer: "Returns follow the store return policy. Keep tags intact, avoid using the product, and record an unboxing video so support can process requests smoothly.",
    },
  ];
}
