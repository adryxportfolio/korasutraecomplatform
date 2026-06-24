import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "@/components/ScrollToTop";
// The landing page is eagerly imported so the most-visited route renders
// without an extra network round-trip. Every other route is code-split so the
// initial bundle stays small and the site loads fast on mobile connections.
import Index from "./pages/Index";

const NotFound = lazy(() => import("./pages/NotFound"));
const Collection = lazy(() => import("./pages/Collection"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const SizeGuide = lazy(() => import("./pages/SizeGuide"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Legal = lazy(() => import("./pages/Legal"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Admin = lazy(() => import("./pages/Admin"));
const Journals = lazy(() => import("./pages/Journals"));
const JournalArticle = lazy(() => import("./pages/JournalArticle"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AddToCartRedirect = lazy(() => import("./pages/AddToCartRedirect"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Cart = lazy(() => import("./pages/Cart"));

import { CustomerActivityTracker } from "./components/CustomerActivityTracker";
import { CartOwnerSync } from "./components/CartOwnerSync";
import { RouteSeoPolicy } from "./components/seo/RouteSeoPolicy";
import { MetaPixelPageViewTracker } from "./components/MetaPixelPageViewTracker";

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-accent" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteSeoPolicy />
          <MetaPixelPageViewTracker />
          <ScrollToTop />
          <CartOwnerSync />
          <CustomerActivityTracker />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products/:handle" element={<ProductDetail />} />
              <Route path="/collections/:slug" element={<Collection />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/size-guide" element={<SizeGuide />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/order-tracking/:orderNumber" element={<OrderTracking />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/cart/add/:handle" element={<AddToCartRedirect />} />
              <Route path="/thank-you/:orderNumber" element={<ThankYou />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/journals" element={<Journals />} />
              <Route path="/journals/:slug" element={<JournalArticle />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
