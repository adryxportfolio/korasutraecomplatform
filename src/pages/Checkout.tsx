import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Loader2, Lock, MapPin, Phone, ShoppingBag, CreditCard, Banknote, CheckCircle, Tags, X, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";
import {
  clearCustomerSessionToken,
  CUSTOMER_SESSION_CHANGED_EVENT,
  getCustomerSessionProfile,
  getCustomerSessionToken,
  setCustomerSessionProfile,
  setCustomerSessionToken as persistCustomerSessionToken,
} from "@/lib/customerSession";
import { buildCartSnapshotActivityPayload, trackCustomerActivity } from "@/lib/customerActivity";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToStorefrontRealtime } from "@/lib/realtimeTables";
import { toast } from "sonner";
import { buildGa4CartPayload, trackGa4EcommerceEvent } from "@/lib/ga4Ecommerce";
import { calculateCheckoutTotals } from "@/lib/gst";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type AppliedCoupon = {
  coupon: { id: string; code: string; description?: string | null; discountType: string };
  discountAmount: number;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const COD_SURCHARGE = 200;
const ADDRESS_REQUIRED_FIELDS = [
  ["fullName", "full name"],
  ["addressLine1", "address line 1"],
  ["city", "city"],
  ["state", "state"],
  ["postalCode", "PIN code"],
] as const;

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function normalizePhoneInput(phone: string) {
  return phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

function isValidReceiptEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const savedCustomerProfile = getCustomerSessionProfile();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDestination, setOtpDestination] = useState("");
  const [customerSessionToken, setCustomerSessionToken] = useState(() => getCustomerSessionToken());
  const [accordionValue, setAccordionValue] = useState(["contact", "shipping", "payment"]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [contact, setContact] = useState({
    countryCode: savedCustomerProfile?.countryCode || "+91",
    phone: savedCustomerProfile?.phone || "",
    email: savedCustomerProfile?.email || "",
  });
  const [shipping, setShipping] = useState({
    fullName: savedCustomerProfile?.name || "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
  });

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + parseFloat(item.price.amount) * item.quantity, 0),
    [items],
  );
  const codSurcharge = paymentMethod === "cod" ? COD_SURCHARGE : 0;
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const { gstAmount, total } = useMemo(() => calculateCheckoutTotals({
    subtotal,
    discountAmount,
    codSurcharge,
  }), [subtotal, discountAmount, codSurcharge]);
  const contactPhone = normalizePhoneInput(contact.phone);
  const addressComplete = ADDRESS_REQUIRED_FIELDS.every(([field]) => String(shipping[field] || "").trim())
    && contactPhone.length >= 10;
  const checkoutReady = items.length > 0 && Boolean(customerSessionToken) && addressComplete;

  const cartLines = useMemo(() => items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
  })), [items]);
  const cartSignature = JSON.stringify(cartLines);
  const beginCheckoutSignature = useRef("");

  useEffect(() => {
    setAppliedCoupon(null);
  }, [cartSignature]);

  useEffect(() => {
    if (items.length === 0 || beginCheckoutSignature.current === cartSignature) return;
    beginCheckoutSignature.current = cartSignature;
    trackGa4EcommerceEvent("begin_checkout", buildGa4CartPayload(items));
  }, [cartSignature, items]);

  useEffect(() => {
    if (!customerSessionToken || items.length === 0) return;
    const payload = buildCartSnapshotActivityPayload(items);
    trackCustomerActivity("checkout", {
      sku: payload.sku,
      metadata: {
        ...payload.metadata,
        source: "checkout-page",
      },
    });
  }, [customerSessionToken, cartSignature, items]);

  useEffect(() => {
    const syncSession = () => {
      setCustomerSessionToken(getCustomerSessionToken());
      const profile = getCustomerSessionProfile();
      if (profile) {
        setContact((current) => ({
          countryCode: current.countryCode || profile.countryCode || "+91",
          phone: current.phone || profile.phone || "",
          email: current.email || profile.email || "",
        }));
        setShipping((current) => ({
          ...current,
          fullName: current.fullName || profile.name || "",
        }));
      }
    };
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  const resetCustomerVerification = (nextContact = contact) => {
    const phoneChanged = normalizePhoneInput(contact.phone) && normalizePhoneInput(nextContact.phone) !== normalizePhoneInput(contact.phone);
    const countryChanged = contact.countryCode && nextContact.countryCode !== contact.countryCode;
    if (phoneChanged || countryChanged || !customerSessionToken) {
      clearCustomerSessionToken();
      setCustomerSessionToken("");
      setVerificationId("");
      setOtp("");
      setOtpDestination("");
    }
    setContact(nextContact);
  };

  const sendOtp = async () => {
    if (!contact.phone.trim()) {
      toast.error("Enter your mobile number first", { position: "top-center" });
      return;
    }
    setIsSendingOtp(true);
    try {
      const result = await callFunction("whatsapp-send-otp", {
        phone: contact.phone,
        countryCode: contact.countryCode,
        name: shipping.fullName || "Kora Sutra Customer",
      });
      setVerificationId(result.verificationId);
      setOtpDestination(result.destination || "");
      setOtp("");
      toast.success("OTP sent on WhatsApp", {
        description: result.destination,
        position: "top-center",
      });
    } catch (error) {
      toast.error("Unable to send OTP", {
        description: error instanceof Error ? error.message : "Please try again",
        position: "top-center",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!verificationId || otp.length !== 6) {
      toast.error("Enter the 6 digit OTP", { position: "top-center" });
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const result = await callFunction("whatsapp-verify-otp", {
        verificationId,
        phone: contact.phone,
        countryCode: contact.countryCode,
        otp,
        name: shipping.fullName || null,
        email: contact.email || null,
      });
      persistCustomerSessionToken(result.token);
      setCustomerSessionProfile({
        countryCode: result.customer?.country_code || contact.countryCode,
        phone: result.customer?.phone || contact.phone,
        email: result.customer?.email || contact.email,
        name: result.customer?.name || shipping.fullName,
      });
      setCustomerSessionToken(result.token);
      toast.success("WhatsApp number verified", { position: "top-center" });
    } catch (error) {
      toast.error("OTP verification failed", {
        description: error instanceof Error ? error.message : "Please try again",
        position: "top-center",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const callFunction = useCallback(async (name: string, body: Record<string, unknown>) => {
    const activeToken = customerSessionToken || getCustomerSessionToken();
    if (activeToken && activeToken !== customerSessionToken) setCustomerSessionToken(activeToken);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(activeToken ? { "x-session-token": activeToken } : {}),
      },
      body: JSON.stringify(activeToken ? { ...body, customerSessionToken: body.customerSessionToken || activeToken } : body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) throw new Error(data.error || "Request failed");
    return data;
  }, [customerSessionToken]);

  const placeOrder = async (paymentPayload: Record<string, unknown> = {}) => {
    const activeToken = customerSessionToken || getCustomerSessionToken();
    const data = await callFunction("place-order", {
      contact,
      shipping: { ...shipping, phone: shipping.phone || contact.phone },
      paymentMethod,
      items: cartLines,
      customerSessionToken: activeToken,
      couponCode: appliedCoupon?.coupon?.code || couponCode,
      ...paymentPayload,
    });
    trackGa4EcommerceEvent("purchase", buildGa4CartPayload(items, {
      transaction_id: data.order_number,
      value: total,
      coupon: appliedCoupon?.coupon?.code || undefined,
      shipping: codSurcharge,
      tax: gstAmount,
    }));
    clearCart();
    toast.success(`Order ${data.order_number} placed`, {
      description: data.emailResults?.customer?.sent ? "Receipt sent to your email." : undefined,
      position: "top-center",
    });
    navigate(`/thank-you/${data.order_number}`);
  };

  const submitOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty", { position: "top-center" });
      return;
    }
    if (!validateCheckoutDetails()) return;

    const activeToken = customerSessionToken || getCustomerSessionToken();
    if (!activeToken) {
      toast.error("Verify your WhatsApp number first", { position: "top-center" });
      return;
    }
    if (activeToken !== customerSessionToken) setCustomerSessionToken(activeToken);

    setIsPlacingOrder(true);
    try {
      trackGa4EcommerceEvent("add_payment_info", buildGa4CartPayload(items, {
        payment_type: paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay",
        coupon: appliedCoupon?.coupon?.code || undefined,
        value: total,
      }));

      if (paymentMethod === "cod") {
        await placeOrder();
        return;
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) throw new Error("Unable to load Razorpay Checkout");

      const razorpayOrder = await callFunction("razorpay-create-order", {
        contact,
        shipping: { ...shipping, phone: shipping.phone || contact.phone },
        items: cartLines,
        couponCode: appliedCoupon?.coupon?.code || couponCode,
        receipt: `ks_${Date.now()}`,
        customerSessionToken: activeToken,
      });

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: razorpayOrder.key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Kora Sutra",
          description: "Handcrafted sarees",
          order_id: razorpayOrder.order_id,
          prefill: {
            name: shipping.fullName,
            email: contact.email,
            contact: contact.phone,
          },
          theme: { color: "#506d5b" },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              const verification = await callFunction("razorpay-verify", {
                ...response,
                expected_order_id: razorpayOrder.order_id,
              });
              if (!verification.verified) throw new Error("Payment verification failed");
              await placeOrder({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled")),
          },
        });
        checkout.open();
      });
    } catch (error) {
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Please try again",
        position: "top-center",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code", { position: "top-center" });
      return;
    }
    const activeToken = customerSessionToken || getCustomerSessionToken();
    if (!activeToken) {
      toast.error("Verify your WhatsApp number before applying a coupon", { position: "top-center" });
      setAccordionValue(["contact", "shipping", "payment"]);
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty", { position: "top-center" });
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const result = await callFunction("coupon-validate", {
        couponCode,
        items: cartLines,
        customerSessionToken: activeToken,
      });
      setAppliedCoupon(result);
      setCouponCode(result.coupon.code);
      toast.success(`Coupon ${result.coupon.code} applied`, { position: "top-center" });
    } catch (error) {
      setAppliedCoupon(null);
      toast.error("Coupon could not be applied", {
        description: error instanceof Error ? error.message : "Please check the code",
        position: "top-center",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    if (!appliedCoupon || !couponCode || items.length === 0) return;
    let disposed = false;

    const refreshCoupon = async () => {
      const activeToken = customerSessionToken || getCustomerSessionToken();
      if (!activeToken) return;
      try {
        const result = await callFunction("coupon-validate", {
          couponCode,
          items: cartLines,
          customerSessionToken: activeToken,
        });
        if (!disposed) setAppliedCoupon(result);
      } catch {
        if (!disposed) {
          setAppliedCoupon(null);
          toast.warning("Coupon details changed", {
            description: "Please apply the coupon again before checkout.",
            position: "top-center",
          });
        }
      }
    };

    const unsubscribe = subscribeToStorefrontRealtime(supabase, "checkout-pricing-sync", refreshCoupon);
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [appliedCoupon, couponCode, customerSessionToken, cartSignature, callFunction, cartLines, items.length]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const validateCheckoutDetails = () => {
    const activeToken = customerSessionToken || getCustomerSessionToken();
    if (!activeToken) {
      setAccordionValue(["contact", "shipping", "payment"]);
      toast.error("Verify your WhatsApp number first", { position: "top-center" });
      return false;
    }
    if (contactPhone.length < 10) {
      setAccordionValue(["contact", "shipping", "payment"]);
      toast.error("Enter the verified mobile number", {
        description: "It must match the WhatsApp OTP number.",
        position: "top-center",
      });
      return false;
    }
    if (!isValidReceiptEmail(contact.email)) {
      setAccordionValue(["contact", "shipping", "payment"]);
      toast.error("Enter a valid email for your order receipt", { position: "top-center" });
      return false;
    }
    const missingAddressField = ADDRESS_REQUIRED_FIELDS.find(([field]) => !String(shipping[field] || "").trim());
    if (missingAddressField) {
      setAccordionValue(["shipping", "payment"]);
      toast.error("Complete your shipping address", {
        description: `Please add ${missingAddressField[1]} before checkout.`,
        position: "top-center",
      });
      return false;
    }
    return true;
  };

  return (
    <>
      <Helmet>
        <title>Checkout - Korasutra</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen pt-28 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-heading tracking-wide">Checkout</h1>
            <p className="text-sm text-muted-foreground font-body mt-2">
              Review your details and complete payment securely.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 max-w-xl">
              {[
                { label: "OTP", done: Boolean(customerSessionToken), icon: ShieldCheck },
                { label: "Address", done: addressComplete, icon: Truck },
                { label: "Pay", done: false, icon: Sparkles },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className={`border rounded-sm px-2.5 py-2 flex items-center gap-2 text-xs font-body ${step.done ? "border-green-200 bg-green-50 text-green-800" : "border-border bg-card text-muted-foreground"}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue} className="space-y-4">
                <AccordionItem value="contact" className="border border-border rounded-sm px-3 sm:px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2 font-heading text-lg">
                      <Phone className="w-4 h-4" /> Contact
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid sm:grid-cols-[90px_1fr] gap-3">
                      <div>
                        <Label>Code</Label>
                        <Input className="h-12" value={contact.countryCode} onChange={(e) => resetCustomerVerification({ ...contact, countryCode: e.target.value })} />
                      </div>
                      <div>
                        <Label>Mobile number *</Label>
                        <Input className="h-12" value={contact.phone} onChange={(e) => resetCustomerVerification({ ...contact, phone: e.target.value })} placeholder="7995862266" inputMode="tel" aria-invalid={contact.phone ? contactPhone.length < 10 : undefined} />
                      </div>
                    </div>
                    <div>
                      <Label>Email for receipt *</Label>
                      <Input className="h-12" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@example.com" type="email" required />
                    </div>
                    <div className="border border-dashed border-border rounded-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-body font-medium">WhatsApp OTP Verification</p>
                        <p className="text-xs text-muted-foreground">
                          {customerSessionToken ? "Your WhatsApp number is verified for checkout." : otpDestination ? `OTP sent to ${otpDestination}` : "We will send a 6 digit code on WhatsApp."}
                        </p>
                      </div>
                      {customerSessionToken ? (
                        <Button type="button" variant="outline" disabled className="w-full sm:w-auto h-12">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verified
                        </Button>
                      ) : (
                        <Button type="button" onClick={sendOtp} disabled={isSendingOtp} className="w-full sm:w-auto h-12">
                          {isSendingOtp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                          {verificationId ? "Resend OTP" : "Send OTP"}
                        </Button>
                      )}
                    </div>
                    {verificationId && !customerSessionToken && (
                      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                        <div>
                          <Label>Enter OTP</Label>
                          <Input className="h-12 text-lg tracking-[0.3em]" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="123456" />
                        </div>
                        <Button type="button" className="self-end h-12 w-full sm:w-auto" onClick={verifyOtp} disabled={isVerifyingOtp}>
                          {isVerifyingOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Verify
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping" className="border border-border rounded-sm px-3 sm:px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2 font-heading text-lg">
                      <MapPin className="w-4 h-4" /> Shipping Address
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Full name *</Label>
                        <Input className="h-12" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input className="h-12" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder={contact.phone || "Same as contact"} inputMode="tel" />
                      </div>
                    </div>
                    <div>
                      <Label>Address line 1 *</Label>
                      <Input className="h-12" value={shipping.addressLine1} onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Address line 2</Label>
                      <Input className="h-12" value={shipping.addressLine2} onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <Label>City *</Label>
                        <Input className="h-12" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} required />
                      </div>
                      <div>
                        <Label>State *</Label>
                        <Input className="h-12" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} required />
                      </div>
                      <div>
                        <Label>PIN code *</Label>
                        <Input className="h-12" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" required />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={shipping.notes} onChange={(e) => setShipping({ ...shipping, notes: e.target.value })} rows={3} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment" className="border border-border rounded-sm px-3 sm:px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2 font-heading text-lg">
                      <CreditCard className="w-4 h-4" /> Payment
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "razorpay" | "cod")} className="grid sm:grid-cols-2 gap-3">
                      <Label className={`border rounded-sm p-4 cursor-pointer flex gap-3 min-h-24 transition-colors ${paymentMethod === "razorpay" ? "border-accent bg-accent/5" : "border-border"}`}>
                        <RadioGroupItem value="razorpay" />
                        <span>
                          <span className="font-body font-medium flex items-center gap-2"><CreditCard className="w-4 h-4" /> Razorpay</span>
                          <span className="block text-xs text-muted-foreground mt-1">UPI, cards, netbanking, wallets</span>
                        </span>
                      </Label>
                      <Label className={`border rounded-sm p-4 cursor-pointer flex gap-3 min-h-24 transition-colors ${paymentMethod === "cod" ? "border-accent bg-accent/5" : "border-border"}`}>
                        <RadioGroupItem value="cod" />
                        <span>
                          <span className="font-body font-medium flex items-center gap-2"><Banknote className="w-4 h-4" /> Cash on Delivery</span>
                          <span className="block text-xs text-muted-foreground mt-1">Adds {formatPrice(String(COD_SURCHARGE), "INR")}</span>
                        </span>
                      </Label>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.section>

            <aside className="lg:sticky lg:top-28 border border-border rounded-sm p-4 bg-card">
              <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Order Summary
              </h2>
              {items.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground font-body">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex gap-3">
                        <div className="w-16 h-20 bg-secondary/30 rounded-sm overflow-hidden flex-shrink-0">
                          {item.product.node.images.edges[0]?.node && (
                            <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-sm truncate">{item.product.node.title}</p>
                          <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                          <p className="text-sm font-price mt-1">{formatPrice(item.price.amount, item.price.currencyCode)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 space-y-2 font-body text-sm">
                    <div className="space-y-2 pb-3">
                      <Label>Coupon</Label>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Input className="h-12" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase().replace(/\s+/g, "")); setAppliedCoupon(null); }} placeholder="SAVE20" />
                        <Button type="button" variant="outline" onClick={applyCoupon} disabled={isApplyingCoupon || items.length === 0 || !couponCode.trim()} className="h-12 min-w-12">
                          {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tags className="w-4 h-4" />}
                        </Button>
                      </div>
                      {!customerSessionToken && (
                        <p className="text-xs text-muted-foreground">Verify your WhatsApp number to apply customer coupons.</p>
                      )}
                      {appliedCoupon && (
                        <div className="flex items-center justify-between gap-2 text-xs border border-green-200 bg-green-50 text-green-800 rounded-sm px-3 py-2">
                          <span>{appliedCoupon.coupon.code} applied</span>
                          <button type="button" onClick={removeCoupon} aria-label="Remove coupon"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between"><span>Subtotal (excl. GST)</span><span className="font-price">{formatPrice(String(subtotal), "INR")}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                    {codSurcharge > 0 && <div className="flex justify-between"><span>COD surcharge</span><span className="font-price">{formatPrice(String(codSurcharge), "INR")}</span></div>}
                    {discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Coupon discount</span><span className="font-price">-{formatPrice(String(discountAmount), "INR")}</span></div>}
                    <div className="flex justify-between"><span>GST (5%)</span><span className="font-price">{formatPrice(String(gstAmount), "INR")}</span></div>
                    <div className="flex justify-between text-lg font-heading pt-2"><span>Total</span><span className="font-price">{formatPrice(String(total), "INR")}</span></div>
                  </div>
                  <Button onClick={submitOrder} disabled={isPlacingOrder || items.length === 0} className="w-full h-14 text-base" size="lg">
                    {isPlacingOrder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    {paymentMethod === "cod" ? "Place COD Order" : "Pay Securely"}
                  </Button>
                  {!checkoutReady && items.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Complete OTP and shipping details to unlock checkout.
                    </p>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
