import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Collection from "./pages/Collection";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import FAQs from "./pages/FAQs";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import SizeGuide from "./pages/SizeGuide";
import Contact from "./pages/Contact";
import About from "./pages/About";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Legal from "./pages/Legal";
import OrderTracking from "./pages/OrderTracking";
import Admin from "./pages/Admin";
import Journals from "./pages/Journals";
import JournalArticle from "./pages/JournalArticle";
import Checkout from "./pages/Checkout";
import AddToCartRedirect from "./pages/AddToCartRedirect";
import ThankYou from "./pages/ThankYou";
import { CustomerActivityTracker } from "./components/CustomerActivityTracker";
import { CartOwnerSync } from "./components/CartOwnerSync";
import Cart from "./pages/Cart";
import { RouteSeoPolicy } from "./components/seo/RouteSeoPolicy";
import { MetaPixelPageViewTracker } from "./components/MetaPixelPageViewTracker";

const queryClient = new QueryClient();

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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
