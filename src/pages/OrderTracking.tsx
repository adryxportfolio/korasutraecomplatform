/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { CheckCircle, Clock, ExternalLink, MapPin, Package, Search, Truck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAccountHistoryView } from "@/lib/accountHistoryView";
import { CUSTOMER_SESSION_CHANGED_EVENT, getCustomerSessionToken } from "@/lib/customerSession";
import { formatPrice } from "@/lib/shopify";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const statusSteps = [
  { key: "pending_payment", label: "Payment", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

type AccountHistoryOrder = {
  order_number: string;
  status: string;
  payment_status: string;
  total: number | string;
  created_at: string;
};

export default function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState(orderNumber || "");
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [sessionToken, setSessionToken] = useState(() => getCustomerSessionToken());
  const [order, setOrder] = useState<any>(null);
  const [accountOrders, setAccountOrders] = useState<AccountHistoryOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [loading, setLoading] = useState(Boolean(orderNumber));
  const [errorMessage, setErrorMessage] = useState("");
  const showHistory = isAccountHistoryView(searchParams.toString());

  useEffect(() => {
    const syncSession = () => setSessionToken(getCustomerSessionToken());
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  useEffect(() => {
    async function loadOrder(showSpinner = false) {
      if (!orderNumber) return;
      if (!sessionToken && !submittedPhone) {
        setLoading(false);
        setOrder(null);
        setErrorMessage("Enter the phone number used for this order.");
        return;
      }
      if (showSpinner) setLoading(true);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/track-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { "x-session-token": sessionToken } : {}),
        },
        body: JSON.stringify({ orderNumber, phone: submittedPhone }),
      });
      const data = await response.json().catch(() => ({}));
      setOrder(response.ok ? data.order || null : null);
      setErrorMessage(response.ok ? "" : data.error || "Order not found");
      setLoading(false);
    }
    loadOrder(true);
    const interval = window.setInterval(() => loadOrder(false), 10_000);
    return () => window.clearInterval(interval);
  }, [orderNumber, sessionToken, submittedPhone]);

  useEffect(() => {
    async function loadAccountOrders() {
      if (!showHistory) return;
      if (!sessionToken) {
        setAccountOrders([]);
        setHistoryError("Sign in with WhatsApp OTP from the account button to view your order history.");
        return;
      }

      setHistoryLoading(true);
      setHistoryError("");
      const response = await fetch(`${SUPABASE_URL}/functions/v1/my-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      setAccountOrders(response.ok ? data.orders || [] : []);
      setHistoryError(response.ok ? "" : data.error || "Unable to load order history");
      setHistoryLoading(false);
    }

    loadAccountOrders();
  }, [sessionToken, showHistory]);

  const activeIndex = useMemo(() => {
    if (!order?.status) return 0;
    return Math.max(0, statusSteps.findIndex((step) => step.key === order.status));
  }, [order?.status]);

  const submitLookup = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedPhone(phone.trim());
    if (lookup.trim()) navigate(`/order-tracking/${lookup.trim().toUpperCase()}`);
  };

  return (
    <>
      <Helmet>
        <title>Track Your Order - Kora Sutra</title>
        <meta name="description" content="Track your Kora Sutra order status, shipment details, and delivery progress." />
        <link rel="canonical" href="https://korasutra.com/order-tracking" />
      </Helmet>

      <Navbar />
      <main className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading mb-4">Track Your Order</h1>
            <p className="text-muted-foreground font-body">
              Enter your order number to see the current fulfilment status.
            </p>
          </motion.div>

          <form onSubmit={submitLookup} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mb-8">
            <Input value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="KS-100001" className="uppercase" />
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={sessionToken ? "Signed in with WhatsApp OTP" : "Verified phone number"}
              inputMode="tel"
              disabled={Boolean(sessionToken)}
            />
            <Button type="submit">
              <Search className="w-4 h-4 mr-2" />
              Track
            </Button>
          </form>

          {showHistory ? (
            <section className="border border-border rounded-sm bg-card mb-8">
              <div className="p-5 border-b border-border flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-body">Your Account</p>
                  <h2 className="font-heading text-2xl">Order History</h2>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/contact">Support</Link>
                </Button>
              </div>

              {historyLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading order history...</div>
              ) : historyError ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">{historyError}</p>
                  <Button asChild variant="outline"><Link to="/contact">Contact Support</Link></Button>
                </div>
              ) : accountOrders.length ? (
                <div className="divide-y divide-border">
                  {accountOrders.map((historyOrder) => (
                    <Link
                      key={historyOrder.order_number}
                      to={`/order-tracking/${historyOrder.order_number}`}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-secondary/40 transition-colors"
                    >
                      <span>
                        <span className="block font-heading text-lg">{historyOrder.order_number}</span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(historyOrder.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-price">{formatPrice(String(historyOrder.total), "INR")}</span>
                        <span className="block text-xs text-muted-foreground capitalize">
                          {historyOrder.status.replace("_", " ")} - {historyOrder.payment_status.replace("_", " ")}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Your orders will appear here after checkout.
                </div>
              )}
            </section>
          ) : null}

          {loading ? (
            <div className="border border-border rounded-sm p-10 text-center text-muted-foreground">Loading order...</div>
          ) : order ? (
            <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-sm bg-card">
              <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-body">Order</p>
                  <h2 className="font-heading text-2xl">{order.order_number}</h2>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-price text-xl">{formatPrice(String(order.total), "INR")}</p>
                  <p className="text-xs text-muted-foreground capitalize">{String(order.payment_method).replace("_", " ")} - {String(order.payment_status).replace("_", " ")}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-5 gap-2 mb-8">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= activeIndex;
                    return (
                      <div key={step.key} className="text-center">
                        <div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center border ${isActive ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className={`text-[11px] md:text-xs mt-2 font-body ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>

                {order.tracking_number || order.tracking_url || order.carrier ? (
                  <div className="border border-border rounded-sm p-4 mb-6">
                    <p className="font-heading text-lg mb-1">Shipment Details</p>
                    {order.carrier && <p className="text-sm text-muted-foreground">Carrier: {order.carrier}</p>}
                    {order.tracking_number && <p className="text-sm text-muted-foreground">Tracking: {order.tracking_number}</p>}
                    {order.tracking_url && (
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <a href={order.tracking_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Track on carrier
                        </a>
                      </Button>
                    )}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {(order.order_items || []).map((item: any) => (
                    <div key={item.id} className="flex gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                      <div className="w-14 h-16 bg-secondary/30 rounded-sm overflow-hidden flex-shrink-0">
                        {item.image_url && <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-sm">{item.product_title}</p>
                        <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                      <p className="font-price text-sm">{formatPrice(String(item.line_total), "INR")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          ) : orderNumber ? (
            <div className="border border-border rounded-sm p-10 text-center">
              <h2 className="font-heading text-xl mb-2">Order not found</h2>
              <p className="text-sm text-muted-foreground mb-6">{errorMessage || "Please check the order number and try again."}</p>
              <Button asChild variant="outline"><Link to="/contact">Contact Support</Link></Button>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
