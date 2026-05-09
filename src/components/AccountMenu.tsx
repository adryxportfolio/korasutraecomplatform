import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Headphones, History, Loader2, LogOut, PackageSearch, RefreshCcw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerAccountLinks, type CustomerAccountLink } from "@/lib/accountMenuLinks";
import { FunctionRequestError, requestJson } from "@/lib/functionClient";
import {
  clearCustomerSessionToken,
  CUSTOMER_SESSION_CHANGED_EVENT,
  getCustomerSessionToken,
  setCustomerSessionProfile,
  setCustomerSessionToken as persistCustomerSessionToken,
} from "@/lib/customerSession";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ACCOUNT_REQUEST_TIMEOUT_MS = 12_000;
const OTP_REQUEST_TIMEOUT_MS = 20_000;

type AccountOrder = {
  order_number: string;
  status: string;
  payment_status: string;
  total: number | string;
  created_at: string;
};

type AccountData = {
  customer: {
    name: string | null;
    email: string | null;
    phone: string;
    country_code: string;
  };
  orders: AccountOrder[];
};

const accountLinkIcons: Record<CustomerAccountLink["icon"], typeof PackageSearch> = {
  status: PackageSearch,
  history: History,
  refund: RefreshCcw,
  support: Headphones,
};

function maskPhone(countryCode?: string, phone?: string) {
  if (!phone) return "Verified customer";
  return `${countryCode || "+91"} ******${phone.slice(-4)}`;
}

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => getCustomerSessionToken());
  const [account, setAccount] = useState<AccountData | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otpDestination, setOtpDestination] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountLoadError, setAccountLoadError] = useState("");

  const callFunction = useCallback(async (name: string, body: Record<string, unknown> = {}, token = sessionToken, timeoutMs = ACCOUNT_REQUEST_TIMEOUT_MS) => {
    return requestJson(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-session-token": token } : {}),
      },
      body,
      timeoutMs,
    });
  }, [sessionToken]);

  const loadAccount = useCallback(async (token = sessionToken) => {
    if (!token) return;
    setIsLoadingAccount(true);
    setAccountLoadError("");
    try {
      const data = await callFunction("my-account", {}, token);
      setAccount(data);
      setCustomerSessionProfile({
        countryCode: data.customer?.country_code || countryCode,
        phone: data.customer?.phone || phone,
        email: data.customer?.email || "",
        name: data.customer?.name || "",
      });
    } catch (error) {
      const shouldClearSession = error instanceof FunctionRequestError && error.status === 401;
      if (shouldClearSession) {
        setAccount(null);
        clearCustomerSessionToken();
        setSessionToken("");
      } else {
        setAccount((current) => current);
        setAccountLoadError(error instanceof Error ? error.message : "Unable to load your account");
      }
      if (open && shouldClearSession) {
        toast.error("Please sign in again", {
          description: error instanceof Error ? error.message : undefined,
          position: "top-center",
        });
      }
    } finally {
      setIsLoadingAccount(false);
    }
  }, [callFunction, countryCode, open, phone, sessionToken]);

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
    if (open && sessionToken) loadAccount(sessionToken);
  }, [loadAccount, open, sessionToken]);

  const sendOtp = async () => {
    if (!phone.trim()) {
      toast.error("Enter your mobile number first", { position: "top-center" });
      return;
    }
    setIsSendingOtp(true);
    try {
      const result = await callFunction("whatsapp-send-otp", {
        phone,
        countryCode,
        name: "Kora Sutra Customer",
      }, "", OTP_REQUEST_TIMEOUT_MS);
      setVerificationId(result.verificationId);
      setOtpDestination(result.destination || "");
      setOtp("");
      toast.success("OTP sent on WhatsApp", { description: result.destination, position: "top-center" });
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
        phone,
        countryCode,
        otp,
      }, "", OTP_REQUEST_TIMEOUT_MS);
      persistCustomerSessionToken(result.token);
      setAccountLoadError("");
      setCustomerSessionProfile({
        countryCode: result.customer?.country_code || countryCode,
        phone: result.customer?.phone || phone,
        email: result.customer?.email || "",
        name: result.customer?.name || "",
      });
      setSessionToken(result.token);
      setAccount({
        customer: {
          name: result.customer?.name || null,
          email: result.customer?.email || null,
          phone: result.customer?.phone || phone,
          country_code: result.customer?.country_code || countryCode,
        },
        orders: [],
      });
      setVerificationId("");
      setOtp("");
      setOtpDestination("");
      toast.success("Signed in with WhatsApp OTP", { position: "top-center" });
      await loadAccount(result.token);
    } catch (error) {
      toast.error("OTP verification failed", {
        description: error instanceof Error ? error.message : "Please try again",
        position: "top-center",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const signOut = () => {
    clearCustomerSessionToken();
    setSessionToken("");
    setAccount(null);
    setAccountLoadError("");
    setVerificationId("");
    setOtp("");
  };

  const signedIn = Boolean(sessionToken && account);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 hover:bg-secondary/50 rounded-full transition-colors relative"
          aria-label={sessionToken ? "Manage account" : "Sign in with WhatsApp OTP"}
        >
          <UserRound className="w-6 h-6" aria-hidden="true" />
          {sessionToken && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-light">Your Account</DialogTitle>
          <DialogDescription>
            Sign in with an OTP on WhatsApp to manage your account, track orders, and contact support.
          </DialogDescription>
        </DialogHeader>

        {sessionToken && isLoadingAccount ? (
          <div className="py-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading account...
          </div>
        ) : sessionToken && accountLoadError ? (
          <div className="space-y-4 py-4">
            <div className="border border-dashed border-border rounded-sm p-4 text-sm text-muted-foreground">
              {accountLoadError}
            </div>
            <Button type="button" className="w-full" onClick={() => loadAccount(sessionToken)}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry Account
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : signedIn ? (
          <div className="space-y-5">
            <div className="border border-border rounded-sm p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-1">Signed in</p>
              <p className="font-heading text-xl">{account.customer.name || "Kora Sutra Customer"}</p>
              <p className="text-sm text-muted-foreground">{maskPhone(account.customer.country_code, account.customer.phone)}</p>
              {account.customer.email && <p className="text-sm text-muted-foreground">{account.customer.email}</p>}
            </div>

            <div className="grid gap-2">
              {customerAccountLinks.map((link) => {
                const Icon = accountLinkIcons[link.icon];
                return (
                  <Button key={link.href} asChild variant="outline" className="h-auto justify-start px-3 py-3 text-left">
                    <Link to={link.href} onClick={() => setOpen(false)}>
                      <Icon className="w-4 h-4 mr-2 mt-0.5" />
                      <span>
                        <span className="block">{link.label}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{link.description}</span>
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </div>

            <div>
              <p className="text-sm font-body font-medium mb-2">Order History</p>
              {account.orders.length ? (
                <div className="space-y-2">
                  {account.orders.slice(0, 3).map((order) => (
                    <Link
                      key={order.order_number}
                      to={`/order-tracking/${order.order_number}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between border border-border rounded-sm p-3 hover:bg-secondary/40 transition-colors"
                    >
                      <span>
                        <span className="block font-heading">{order.order_number}</span>
                        <span className="block text-xs text-muted-foreground capitalize">{order.status.replace("_", " ")}</span>
                      </span>
                      <PackageSearch className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-sm p-3">
                  Your recent orders will appear here after checkout.
                </p>
              )}
            </div>

            <Button type="button" variant="ghost" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-[88px_1fr] gap-3">
              <div>
                <Label>Code</Label>
                <Input value={countryCode} onChange={(event) => setCountryCode(event.target.value)} />
              </div>
              <div>
                <Label>Mobile number</Label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="7995862266" />
              </div>
            </div>

            <div className="border border-dashed border-border rounded-sm p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-body font-medium">OTP on WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  {otpDestination ? `OTP sent to ${otpDestination}` : "We will send a 6 digit code on WhatsApp."}
                </p>
              </div>
              <Button type="button" onClick={sendOtp} disabled={isSendingOtp}>
                {isSendingOtp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {verificationId ? "Resend" : "Send OTP"}
              </Button>
            </div>

            {verificationId && (
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <Label>Enter OTP</Label>
                  <Input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="123456" />
                </div>
                <Button type="button" className="self-end" onClick={verifyOtp} disabled={isVerifyingOtp}>
                  {isVerifyingOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
