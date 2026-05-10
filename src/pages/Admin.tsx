/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  Download,
  Edit3,
  FileText,
  Image as ImageIcon,
  IndianRupee,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Megaphone,
  Package,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShoppingBag,
  Tags,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatPrice } from "@/lib/shopify";
import { supabase } from "@/integrations/supabase/client";
import { AdminImportProduct, parseShopifyProductsCsv } from "@/lib/shopifyCsv";
import {
  adjustLocalInventory,
  canUseLocalAdmin,
  changeLocalAdminPassword,
  importLocalProducts,
  loadLocalAdminData,
  deleteLocalCoupon,
  saveLocalSiteSettings,
  saveLocalProduct,
  saveLocalCoupon,
} from "@/lib/localCommerce";
import { CatalogTaxonomyGroup, catalogTaxonomy, selectionFromTags, tagsForCatalogSelection } from "@/lib/catalogTaxonomy";
import { broadcastCommerceChange, subscribeToCommerceRealtime, type CommerceRealtimeStatus } from "@/lib/realtimeTables";
import {
  buildCustomerExportCsv,
  calculateAdminStats,
  calculateSalesSummary,
  customerActivityLabel,
  shouldUseLocalAdminFallback,
} from "@/lib/adminAnalytics";
import {
  SITE_SETTINGS_BROADCAST_EVENT,
  SITE_SETTINGS_REALTIME_CHANNEL,
  cacheSiteSettings,
  defaultSiteSettings,
  normalizeSiteSettings,
  siteSettingsToRow,
  type SiteSettings,
} from "@/lib/siteSettings";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AdminSection = "dashboard" | "products" | "inventory" | "orders" | "customers" | "coupons" | "sales" | "journals" | "settings";

const navItems: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "coupons", label: "Coupons", icon: Tags },
  { id: "sales", label: "Sales", icon: BarChart3 },
  { id: "journals", label: "Journals", icon: FileText },
  { id: "settings", label: "Settings", icon: Shield },
];

const orderStatuses = ["pending_payment", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];
const LOCAL_ADMIN_TOKEN_PREFIX = "local-admin-";

function statusBadge(status: string) {
  if (["paid", "confirmed", "delivered"].includes(status)) return "bg-green-100 text-green-800 border-green-200";
  if (["processing", "shipped"].includes(status)) return "bg-blue-100 text-blue-800 border-blue-200";
  if (["cancelled", "refunded", "failed"].includes(status)) return "bg-red-100 text-red-800 border-red-200";
  return "bg-secondary text-muted-foreground border-border";
}

function realtimeBadge(status: CommerceRealtimeStatus) {
  if (status === "connected") return "bg-green-100 text-green-800 border-green-200";
  if (status === "reconnecting" || status === "connecting") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function realtimeLabel(status: CommerceRealtimeStatus) {
  if (status === "connected") return "Realtime connected";
  if (status === "reconnecting") return "Realtime reconnecting";
  if (status === "connecting") return "Realtime connecting";
  return "Realtime offline";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Admin() {
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem("ks_admin_token"));
  const [adminUsername, setAdminUsername] = useState(() => localStorage.getItem("ks_admin_user") || "Admin");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [data, setData] = useState<any>({ orders: [], products: [], customers: [], customerActivities: [], inventory: [], categories: [], coupons: [], journals: [], siteSettings: defaultSiteSettings });
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<CommerceRealtimeStatus>("connecting");
  const [query, setQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [productTab, setProductTab] = useState("list");
  const [couponTab, setCouponTab] = useState("list");
  const [journalTab, setJournalTab] = useState("list");
  const [isImporting, setIsImporting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [salesRange, setSalesRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });
  const [siteSettingsForm, setSiteSettingsForm] = useState<SiteSettings>(defaultSiteSettings);
  const [heroDesktopFile, setHeroDesktopFile] = useState<{ dataUrl: string; fileName: string; contentType: string } | null>(null);
  const [heroMobileFile, setHeroMobileFile] = useState<{ dataUrl: string; fileName: string; contentType: string } | null>(null);
  const [productForm, setProductForm] = useState({
    title: "",
    handle: "",
    categorySlug: "sarees",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    fabric: "",
    technique: "",
    color: "",
    status: "active",
    hasBlousePiece: false,
    imageUrl: "",
    imageDataUrl: "",
    imageFileName: "",
    imageContentType: "",
    videoUrl: "",
    videoDataUrl: "",
    videoFileName: "",
    videoContentType: "",
    sku: "",
    inventoryQty: "1",
    catalogSelection: { fabric: [] as string[], pattern: [] as string[], occasion: [] as string[] },
  });
  const [couponForm, setCouponForm] = useState({
    id: "",
    code: "",
    description: "",
    status: "active",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxDiscountCap: "",
    usageLimitTotal: "",
    usageLimitPerCustomer: "",
    firstOrderOnly: false,
    startAt: "",
    endAt: "",
    neverExpires: false,
    appliesTo: "all",
    includedProductIds: "",
    includedCategorySlugs: "",
    includedTags: "",
    excludedProductIds: "",
    excludedCategorySlugs: "",
    excludeSaleItems: false,
    canCombineWithCoupons: false,
    canCombineWithSalePrices: true,
    autoApply: false,
    displayOnWebsite: false,
    priority: "0",
    buyQuantity: "",
    getQuantity: "",
  });
  const [journalForm, setJournalForm] = useState({
    id: "",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    imageUrl: "",
    imageDataUrl: "",
    imageFileName: "",
    imageContentType: "",
    category: "Journal",
    author: "Kora Sutra",
    readTime: "3 min read",
    keywords: "",
    seoTitle: "",
    seoDescription: "",
    status: "draft",
    publishedAt: "",
  });

  const resetProductForm = () => setProductForm({ title: "", handle: "", categorySlug: "sarees", description: "", shortDescription: "", price: "", compareAtPrice: "", fabric: "", technique: "", color: "", status: "active", hasBlousePiece: false, imageUrl: "", imageDataUrl: "", imageFileName: "", imageContentType: "", videoUrl: "", videoDataUrl: "", videoFileName: "", videoContentType: "", sku: "", inventoryQty: "1", catalogSelection: { fabric: [], pattern: [], occasion: [] } });
  const resetCouponForm = () => setCouponForm({ id: "", code: "", description: "", status: "active", discountType: "percentage", discountValue: "", minOrderValue: "", maxDiscountCap: "", usageLimitTotal: "", usageLimitPerCustomer: "", firstOrderOnly: false, startAt: "", endAt: "", neverExpires: false, appliesTo: "all", includedProductIds: "", includedCategorySlugs: "", includedTags: "", excludedProductIds: "", excludedCategorySlugs: "", excludeSaleItems: false, canCombineWithCoupons: false, canCombineWithSalePrices: true, autoApply: false, displayOnWebsite: false, priority: "0", buyQuantity: "", getQuantity: "" });
  const resetJournalForm = () => setJournalForm({ id: "", title: "", slug: "", excerpt: "", content: "", imageUrl: "", imageDataUrl: "", imageFileName: "", imageContentType: "", category: "Journal", author: "Kora Sutra", readTime: "3 min read", keywords: "", seoTitle: "", seoDescription: "", status: "draft", publishedAt: "" });
  const isLocalAdmin = Boolean(adminToken?.startsWith(LOCAL_ADMIN_TOKEN_PREFIX));

  const api = useCallback(async (options?: { method?: string; body?: Record<string, unknown> }) => {
    if (!adminToken) throw new Error("Missing admin token");
    if (adminToken.startsWith(LOCAL_ADMIN_TOKEN_PREFIX)) {
      const action = options?.body?.action;
      if (!action) return loadLocalAdminData();
      if (action === "upsert-product") {
        const productId = await saveLocalProduct(options.body?.product || {});
        return { success: true, productId };
      }
      if (action === "bulk-import-products") {
        return importLocalProducts((options.body?.products || []) as AdminImportProduct[]);
      }
      if (action === "change-password") {
        return changeLocalAdminPassword(String(options.body?.currentPassword || ""), String(options.body?.newPassword || ""));
      }
      if (action === "adjust-inventory") {
        return adjustLocalInventory(String(options.body?.variantId || ""), Number(options.body?.delta || 0));
      }
      if (action === "upsert-coupon") {
        const couponId = await saveLocalCoupon(options.body?.coupon || {});
        return { success: true, couponId };
      }
      if (action === "delete-coupon") return deleteLocalCoupon(String(options.body?.couponId || ""));
      if (action === "upsert-site-settings") {
        return saveLocalSiteSettings(normalizeSiteSettings(options.body?.settings as any));
      }
      if (action === "upsert-journal") return { success: true, journalId: `local-journal-${Date.now()}` };
      if (action === "delete-journal") return { success: true };
      if (action === "update-order") return { success: true };
      throw new Error("Unsupported local admin action");
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-commerce`, {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    const result = await response.json().catch(() => ({ error: "Admin service is unavailable" }));
    if (!response.ok || result.error) throw new Error(result.error || "Admin request failed");
    return result;
  }, [adminToken]);

  const broadcastSiteSettingsUpdate = useCallback(async (nextSettings: SiteSettings) => {
    if (isLocalAdmin) return;

    await new Promise<void>((resolve) => {
      const channel = supabase.channel(SITE_SETTINGS_REALTIME_CHANNEL, { config: { broadcast: { self: true, ack: true } } });
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        supabase.removeChannel(channel);
        resolve();
      };
      const timeout = window.setTimeout(finish, 2500);

      channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        try {
          await channel.send({
            type: "broadcast",
            event: SITE_SETTINGS_BROADCAST_EVENT,
            payload: { settings: siteSettingsToRow(nextSettings), savedAt: new Date().toISOString() },
          });
        } finally {
          finish();
        }
      });
    });
  }, [isLocalAdmin]);

  const fetchAdminData = useCallback(async () => {
    if (!adminToken) return;
    setIsLoading(true);
    try {
      let result = await api();
      if (shouldUseLocalAdminFallback({ isLocalAdmin, hadRemoteError: false, remoteProducts: result.products })) {
        result = await loadLocalAdminData();
      }
      const normalizedSiteSettings = normalizeSiteSettings(
        result.siteSettings?.promo_popup !== undefined
          ? result.siteSettings
          : result.siteSettings
            ? siteSettingsToRow(result.siteSettings)
            : result.site_settings || result.siteSettingsRow || null,
      );
      setData({
        ...result,
        orders: result.orders || [],
        products: result.products || [],
        customers: result.customers || [],
        customerActivities: result.customerActivities || [],
        inventory: result.inventory || [],
        categories: result.categories || [],
        coupons: result.coupons || [],
        journals: result.journals || [],
        siteSettings: normalizedSiteSettings,
      });
      setSiteSettingsForm(normalizedSiteSettings);
      if (result.admin?.username) {
        setAdminUsername(result.admin.username);
        localStorage.setItem("ks_admin_user", result.admin.username);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") handleLogout();
      toast.error("Unable to load admin data", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, api, isLocalAdmin]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  useEffect(() => {
    if (!adminToken) return;
    const interval = window.setInterval(fetchAdminData, 5_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") fetchAdminData();
    };
    document.addEventListener("visibilitychange", refreshOnFocus);
    if (isLocalAdmin) {
      setRealtimeStatus("disconnected");
      return () => {
        window.clearInterval(interval);
        document.removeEventListener("visibilitychange", refreshOnFocus);
      };
    }

    const unsubscribe = subscribeToCommerceRealtime(supabase, "admin-commerce-sync", fetchAdminData, undefined, {
      debounceMs: 250,
      onStatusChange: setRealtimeStatus,
    });

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      unsubscribe();
    };
  }, [adminToken, fetchAdminData, isLocalAdmin]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const result = await response.json().catch(() => ({ error: "Admin service is unavailable" }));
      if (!response.ok || result.error) throw new Error(result.error || "Login failed");
      localStorage.setItem("ks_admin_token", result.token);
      localStorage.setItem("ks_admin_user", result.username);
      setAdminToken(result.token);
      setAdminUsername(result.username);
      setLoginPassword("");
      toast.success("Welcome to Kora Sutra Admin");
    } catch (error) {
      if (await canUseLocalAdmin(loginUsername, loginPassword)) {
        const token = `${LOCAL_ADMIN_TOKEN_PREFIX}${crypto.randomUUID()}`;
        localStorage.setItem("ks_admin_token", token);
        localStorage.setItem("ks_admin_user", loginUsername.trim().toLowerCase());
        setAdminToken(token);
        setAdminUsername(loginUsername.trim().toLowerCase());
        setLoginPassword("");
        toast.success("Welcome to Kora Sutra Admin");
      } else {
        toast.error("Login failed", { description: error instanceof Error ? error.message : undefined });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ks_admin_token");
    localStorage.removeItem("ks_admin_user");
    setAdminToken(null);
    setData({ orders: [], products: [], customers: [], customerActivities: [], inventory: [], categories: [], coupons: [], journals: [], siteSettings: defaultSiteSettings });
  };

  const stats = useMemo(() => calculateAdminStats(data), [data]);
  const salesSummary = useMemo(() => calculateSalesSummary(data.orders, salesRange), [data.orders, salesRange]);

  const filteredProducts = data.products.filter((product: any) => {
    const q = query.toLowerCase();
    return !q || product.title?.toLowerCase().includes(q) || product.handle?.toLowerCase().includes(q);
  });

  const filteredOrders = data.orders.filter((order: any) => {
    const q = query.toLowerCase();
    return !q || order.order_number?.toLowerCase().includes(q) || order.contact_phone?.includes(q) || order.ship_full_name?.toLowerCase().includes(q);
  });
  const filteredCoupons = (data.coupons || []).filter((coupon: any) => {
    const q = query.toLowerCase();
    return !q || coupon.code?.toLowerCase().includes(q) || coupon.description?.toLowerCase().includes(q);
  });
  const filteredJournals = (data.journals || []).filter((journal: any) => {
    const q = query.toLowerCase();
    return !q || journal.title?.toLowerCase().includes(q) || journal.slug?.toLowerCase().includes(q) || journal.category?.toLowerCase().includes(q);
  });
  const categoryOptions = data.categories.length ? data.categories : [
    { slug: "sarees", name: "Sarees" },
    { slug: "blouses", name: "Blouses" },
  ];

  const toggleCatalogSelection = (group: CatalogTaxonomyGroup, slug: string) => {
    const current = productForm.catalogSelection[group];
    setProductForm({
      ...productForm,
      catalogSelection: {
        ...productForm.catalogSelection,
        [group]: current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
      },
    });
  };

  const uploadProductMedia = async (media: "image" | "video") => {
    const dataUrl = media === "image" ? productForm.imageDataUrl : productForm.videoDataUrl;
    const storedUrl = media === "image" ? productForm.imageUrl : productForm.videoUrl;
    if (!dataUrl) return { url: storedUrl, path: "", contentType: media === "image" ? productForm.imageContentType : productForm.videoContentType };
    if (media === "image" && isLocalAdmin) return { url: dataUrl, path: "", contentType: productForm.imageContentType };
    if (media === "video" && isLocalAdmin) return { url: dataUrl, path: "", contentType: productForm.videoContentType };
    if (!adminToken) throw new Error("Missing admin token");

    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({
        dataUrl,
        fileName: media === "image" ? productForm.imageFileName : productForm.videoFileName,
        contentType: media === "image" ? productForm.imageContentType : productForm.videoContentType,
        productHandle: productForm.handle || slugify(productForm.title),
      }),
    });
    const result = await response.json().catch(() => ({ error: "Media upload failed" }));
    if (!response.ok || result.error) throw new Error(result.error || "Media upload failed");
    return { url: result.url, path: result.path || "", contentType: result.contentType || (media === "image" ? productForm.imageContentType : productForm.videoContentType) };
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const uploadedImage = await uploadProductMedia("image");
      const uploadedVideo = await uploadProductMedia("video");
      if (uploadedImage.url.includes("shopify.com") || uploadedVideo.url.includes("shopify.com")) throw new Error("Please upload product media to Kora Sutra storage instead of Shopify CDN");
      const catalogTags = tagsForCatalogSelection(productForm.catalogSelection);
      const result = await api({
        method: "POST",
        body: {
          action: "upsert-product",
          product: {
            ...productForm,
            handle: productForm.handle || slugify(productForm.title),
            tags: catalogTags,
            images: uploadedImage.url ? [{ url: uploadedImage.url, altText: productForm.title, storageKey: uploadedImage.path }] : [],
            videos: uploadedVideo.url ? [{ url: uploadedVideo.url, altText: `${productForm.title} video`, contentType: uploadedVideo.contentType, storageKey: uploadedVideo.path }] : [],
            variant: {
              sku: productForm.sku || `KS-${Date.now()}`,
              title: "Default",
              price: Number(productForm.price || 0),
              compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : null,
              inventoryQty: Number(productForm.inventoryQty || 0),
              trackInventory: true,
            },
          },
        },
      });
      await broadcastCommerceChange(supabase, { action: "product-updated", table: "products", productId: result.productId });
      toast.success("Product saved");
      resetProductForm();
      fetchAdminData();
      setProductTab("list");
    } catch (error) {
      toast.error("Unable to save product", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const editProduct = (product: any) => {
    const firstVariant = product.product_variants?.[0];
    const firstImage = [...(product.product_images || [])].sort((a: any, b: any) => a.position - b.position)[0];
    const firstVideo = [...(product.product_videos || [])].sort((a: any, b: any) => a.position - b.position)[0];
    setProductForm({
      title: product.title || "",
      handle: product.handle || "",
      categorySlug: product.category?.slug || "sarees",
      description: product.description || "",
      shortDescription: product.short_description || "",
      price: String(product.price || ""),
      compareAtPrice: String(product.compare_at_price || ""),
      fabric: product.fabric || "",
      technique: product.technique || "",
      color: product.color || "",
      status: product.status || "draft",
      hasBlousePiece: Boolean(product.has_blouse_piece),
      imageUrl: firstImage?.url || "",
      imageDataUrl: "",
      imageFileName: "",
      imageContentType: "",
      videoUrl: firstVideo?.url || "",
      videoDataUrl: "",
      videoFileName: "",
      videoContentType: firstVideo?.content_type || "",
      sku: firstVariant?.sku || "",
      inventoryQty: String(firstVariant?.inventory_qty ?? 1),
      catalogSelection: selectionFromTags(product.tags || []),
    });
    setProductTab("add");
  };

  const selectMediaFile = (file: File | null, media: "image" | "video") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (media === "image") {
        setProductForm({
          ...productForm,
          imageDataUrl: String(reader.result || ""),
          imageFileName: file.name,
          imageContentType: file.type || "image/jpeg",
        });
      } else {
        setProductForm({
          ...productForm,
          videoDataUrl: String(reader.result || ""),
          videoFileName: file.name,
          videoContentType: file.type || "video/mp4",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const selectSiteImage = (file: File | null, target: "desktop" | "mobile") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const payload = {
        dataUrl: String(reader.result || ""),
        fileName: file.name,
        contentType: file.type || "image/jpeg",
      };
      if (target === "desktop") setHeroDesktopFile(payload);
      else setHeroMobileFile(payload);
    };
    reader.readAsDataURL(file);
  };

  const selectJournalImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJournalForm({
        ...journalForm,
        imageDataUrl: String(reader.result || ""),
        imageFileName: file.name,
        imageContentType: file.type || "image/jpeg",
      });
    };
    reader.readAsDataURL(file);
  };

  const uploadSiteImage = async (file: { dataUrl: string; fileName: string; contentType: string } | null, fallbackUrl: string) => {
    if (!file) return fallbackUrl;
    if (isLocalAdmin) return file.dataUrl;
    if (!adminToken) throw new Error("Missing admin token");

    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({
        dataUrl: file.dataUrl,
        fileName: file.fileName,
        contentType: file.contentType,
        productHandle: "site-hero",
      }),
    });
    const result = await response.json().catch(() => ({ error: "Hero image upload failed" }));
    if (!response.ok || result.error) throw new Error(result.error || "Hero image upload failed");
    return result.url || fallbackUrl;
  };

  const uploadJournalImage = async () => {
    if (!journalForm.imageDataUrl) return journalForm.imageUrl;
    if (isLocalAdmin) return journalForm.imageDataUrl;
    if (!adminToken) throw new Error("Missing admin token");

    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({
        dataUrl: journalForm.imageDataUrl,
        fileName: journalForm.imageFileName,
        contentType: journalForm.imageContentType,
        productHandle: `journal-${journalForm.slug || slugify(journalForm.title)}`,
      }),
    });
    const result = await response.json().catch(() => ({ error: "Journal image upload failed" }));
    if (!response.ok || result.error) throw new Error(result.error || "Journal image upload failed");
    return result.url || journalForm.imageUrl;
  };

  const updateNavLink = (index: number, updates: Partial<{ label: string; href: string; enabled: boolean }>) => {
    const nextLinks = [...siteSettingsForm.navbar.navLinks];
    nextLinks[index] = { ...nextLinks[index], ...updates };
    setSiteSettingsForm({
      ...siteSettingsForm,
      navbar: { ...siteSettingsForm.navbar, navLinks: nextLinks },
    });
  };

  const addNavLink = () => {
    setSiteSettingsForm({
      ...siteSettingsForm,
      navbar: {
        ...siteSettingsForm.navbar,
        navLinks: [...siteSettingsForm.navbar.navLinks, { label: "New Link", href: "/collections/all", enabled: true }],
      },
    });
  };

  const removeNavLink = (index: number) => {
    setSiteSettingsForm({
      ...siteSettingsForm,
      navbar: {
        ...siteSettingsForm.navbar,
        navLinks: siteSettingsForm.navbar.navLinks.filter((_, linkIndex) => linkIndex !== index),
      },
    });
  };

  const importShopifyCsv = async (file: File | null) => {
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const products: AdminImportProduct[] = parseShopifyProductsCsv(text);
      if (!products.length) throw new Error("No importable products found in CSV");

      const result = await api({
        method: "POST",
        body: { action: "bulk-import-products", products },
      });

      if (result.failed?.length) {
        toast.warning(`Imported ${result.imported} products with ${result.failed.length} failures`);
      } else {
        toast.success(`Imported ${result.imported} products`);
      }
      fetchAdminData();
    } catch (error) {
      toast.error("CSV import failed", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsImporting(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await api({
        method: "POST",
        body: {
          action: "change-password",
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed");
    } catch (error) {
      toast.error("Unable to change password", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const saveSiteContent = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const [desktopImageUrl, mobileImageUrl] = await Promise.all([
        uploadSiteImage(heroDesktopFile, siteSettingsForm.hero.desktopImageUrl),
        uploadSiteImage(heroMobileFile, siteSettingsForm.hero.mobileImageUrl),
      ]);
      const nextSettings = normalizeSiteSettings(siteSettingsToRow({
        ...siteSettingsForm,
        hero: {
          ...siteSettingsForm.hero,
          desktopImageUrl,
          mobileImageUrl,
        },
      }));

      await api({
        method: "POST",
        body: {
          action: "upsert-site-settings",
          settings: nextSettings,
        },
      });
      cacheSiteSettings(nextSettings);
      await broadcastSiteSettingsUpdate(nextSettings);
      await broadcastCommerceChange(supabase, { action: "site-settings-updated", table: "site_settings" });
      setHeroDesktopFile(null);
      setHeroMobileFile(null);
      setSiteSettingsForm(nextSettings);
      toast.success("Website content synced live");
      fetchAdminData();
    } catch (error) {
      toast.error("Unable to save website content", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const updateOrder = async (order: any, updates: Record<string, unknown>) => {
    try {
      const result = await api({
        method: "POST",
        body: {
          action: "update-order",
          orderId: order.id,
          status: updates.status ?? order.status,
          paymentStatus: updates.payment_status ?? order.payment_status,
          trackingNumber: updates.tracking_number ?? order.tracking_number,
          trackingUrl: updates.tracking_url ?? order.tracking_url,
          carrier: updates.carrier ?? order.carrier,
          notes: updates.notes ?? order.notes,
        },
      });
      await broadcastCommerceChange(supabase, {
        action: "order-updated",
        table: "orders",
        orderId: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
      });
      toast.success(
        isLocalAdmin
          ? "Order updated locally"
          : result.emailSent === false
            ? "Order updated; customer email was not sent"
            : "Order updated and customer notified",
        {
          description: result.emailSent === false ? result.emailReason || "Check Resend configuration and customer email." : undefined,
        },
      );
      fetchAdminData();
    } catch (error) {
      toast.error("Unable to update order", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const adjustInventory = async (variantId: string, delta: number) => {
    try {
      await api({ method: "POST", body: { action: "adjust-inventory", variantId, delta, reason: delta > 0 ? "restock" : "adjustment" } });
      await broadcastCommerceChange(supabase, { action: "inventory-updated", tables: ["product_variants", "inventory_movements"] });
      toast.success("Inventory updated");
      fetchAdminData();
    } catch (error) {
      toast.error("Inventory update failed", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  const saveCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await api({
        method: "POST",
        body: {
          action: "upsert-coupon",
          coupon: {
            ...couponForm,
            includedProductIds: splitList(couponForm.includedProductIds),
            includedCategorySlugs: splitList(couponForm.includedCategorySlugs),
            includedTags: splitList(couponForm.includedTags),
            excludedProductIds: splitList(couponForm.excludedProductIds),
            excludedCategorySlugs: splitList(couponForm.excludedCategorySlugs),
          },
        },
      });
      await broadcastCommerceChange(supabase, { action: "coupon-updated", table: "coupons", couponId: result.couponId });
      toast.success("Coupon saved");
      resetCouponForm();
      fetchAdminData();
      setCouponTab("list");
    } catch (error) {
      toast.error("Unable to save coupon", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const editCoupon = (coupon: any) => {
    setCouponForm({
      id: coupon.id || "",
      code: coupon.code || "",
      description: coupon.description || "",
      status: coupon.status || "active",
      discountType: coupon.discount_type || "percentage",
      discountValue: String(coupon.discount_value || ""),
      minOrderValue: String(coupon.min_order_value || ""),
      maxDiscountCap: String(coupon.max_discount_cap || ""),
      usageLimitTotal: String(coupon.usage_limit_total || ""),
      usageLimitPerCustomer: String(coupon.usage_limit_per_customer || ""),
      firstOrderOnly: Boolean(coupon.first_order_only),
      startAt: coupon.start_at ? String(coupon.start_at).slice(0, 16) : "",
      endAt: coupon.end_at ? String(coupon.end_at).slice(0, 16) : "",
      neverExpires: Boolean(coupon.never_expires),
      appliesTo: coupon.applies_to || "all",
      includedProductIds: (coupon.included_product_ids || []).join(", "),
      includedCategorySlugs: (coupon.included_category_slugs || []).join(", "),
      includedTags: (coupon.included_tags || []).join(", "),
      excludedProductIds: (coupon.excluded_product_ids || []).join(", "),
      excludedCategorySlugs: (coupon.excluded_category_slugs || []).join(", "),
      excludeSaleItems: Boolean(coupon.exclude_sale_items),
      canCombineWithCoupons: Boolean(coupon.can_combine_with_coupons),
      canCombineWithSalePrices: coupon.can_combine_with_sale_prices !== false,
      autoApply: Boolean(coupon.auto_apply),
      displayOnWebsite: Boolean(coupon.display_on_website),
      priority: String(coupon.priority || 0),
      buyQuantity: String(coupon.buy_quantity || ""),
      getQuantity: String(coupon.get_quantity || ""),
    });
    setCouponTab("add");
  };

  const deleteCoupon = async (coupon: any) => {
    try {
      await api({ method: "POST", body: { action: "delete-coupon", couponId: coupon.id } });
      await broadcastCommerceChange(supabase, { action: "coupon-deleted", table: "coupons", couponId: coupon.id });
      toast.success("Coupon deleted");
      fetchAdminData();
    } catch (error) {
      toast.error("Unable to delete coupon", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const saveJournal = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const imageUrl = await uploadJournalImage();
      const result = await api({
        method: "POST",
        body: {
          action: "upsert-journal",
          journal: {
            ...journalForm,
            slug: journalForm.slug || slugify(journalForm.title),
            imageUrl,
            keywords: splitList(journalForm.keywords),
          },
        },
      });
      await broadcastCommerceChange(supabase, { action: "journal-updated", table: "journal_articles", savedAt: new Date().toISOString() });
      toast.success(journalForm.status === "published" ? "Journal published live" : "Journal saved as draft");
      resetJournalForm();
      setJournalTab("list");
      fetchAdminData();
      return result;
    } catch (error) {
      toast.error("Unable to save journal", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const editJournal = (journal: any) => {
    setJournalForm({
      id: journal.id || "",
      title: journal.title || "",
      slug: journal.slug || "",
      excerpt: journal.excerpt || "",
      content: journal.content || "",
      imageUrl: journal.image_url || journal.image || "",
      imageDataUrl: "",
      imageFileName: "",
      imageContentType: "",
      category: journal.category || "Journal",
      author: journal.author || "Kora Sutra",
      readTime: journal.read_time || journal.readTime || "3 min read",
      keywords: (journal.keywords || []).join(", "),
      seoTitle: journal.seo_title || "",
      seoDescription: journal.seo_description || "",
      status: journal.status || "draft",
      publishedAt: journal.published_at ? String(journal.published_at).slice(0, 16) : "",
    });
    setJournalTab("edit");
  };

  const deleteJournal = async (journal: any) => {
    try {
      await api({ method: "POST", body: { action: "delete-journal", journalId: journal.id } });
      await broadcastCommerceChange(supabase, { action: "journal-deleted", table: "journal_articles", savedAt: new Date().toISOString() });
      toast.success("Journal deleted");
      fetchAdminData();
    } catch (error) {
      toast.error("Unable to delete journal", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const exportCustomers = () => {
    const csv = buildCustomerExportCsv(data.customers, data.orders, data.customerActivities);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `korasutra-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Kora Sutra Secure Access</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 bg-card border border-border rounded-sm p-6">
            <div>
              <Label>Username</Label>
              <Input value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} required autoComplete="username" />
            </div>
            <div>
              <Label>Password</Label>
              <Input value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required type="password" autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h1 className="font-heading text-lg">Kora Sutra</h1>
              <p className="text-xs text-muted-foreground">Commerce Admin</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-body transition-colors ${section === item.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-card border-b border-border">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Welcome, {adminUsername}</p>
              <h2 className="font-heading text-xl capitalize">{section}</h2>
              {isLocalAdmin && <p className="text-[11px] text-muted-foreground">Local catalog mode</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${realtimeBadge(realtimeStatus)} hidden sm:inline-flex`}>
                <Radio className="w-3 h-3 mr-1" />
                {realtimeLabel(realtimeStatus)}
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchAdminData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <div className="md:hidden px-4 pb-3">
            <Select value={section} onValueChange={(value) => setSection(value as AdminSection)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{navItems.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </header>

        <main className="p-4 md:p-6 space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admin data..." className="pl-9" />
          </div>

          {section === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={ShoppingBag} label="Orders Today" value={stats.ordersToday} />
                <StatCard icon={IndianRupee} label="Revenue Today" value={formatPrice(String(stats.revenueToday), "INR")} />
                <StatCard icon={Truck} label="Pending Fulfilment" value={stats.pendingFulfilment} />
                <StatCard icon={Boxes} label="Low Stock" value={stats.lowStock} />
              </div>
              <div className="grid xl:grid-cols-[1fr_360px] gap-4">
                <Panel title="Revenue Snapshot">
                  <div className="h-64 flex items-end gap-2">
                    {Array.from({ length: 14 }).map((_, index) => (
                      <div key={index} className="flex-1 bg-accent/20 rounded-t-sm" style={{ height: `${20 + ((index * 19) % 70)}%` }} />
                    ))}
                  </div>
                </Panel>
                <Panel title="New Orders">
                  <div className="space-y-3">
                    {data.orders.length ? data.orders.slice(0, 6).map((order: any) => (
                      <div key={order.id} className="flex justify-between gap-3 text-sm">
                        <span className="font-heading">{order.order_number}</span>
                        <span className="font-price">{formatPrice(String(order.total), "INR")}</span>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No orders yet. New checkout orders appear here live.</p>}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {section === "products" && (
            <Tabs value={productTab} onValueChange={setProductTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="list">Products</TabsTrigger>
                <TabsTrigger value="add"><Plus className="w-4 h-4 mr-2" />Add Product</TabsTrigger>
                <TabsTrigger value="import">Import CSV</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <Panel title={`Products (${filteredProducts.length})`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left border-b border-border"><th className="py-2">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        {filteredProducts.map((product: any) => (
                          <tr key={product.id} className="border-b border-border last:border-0">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-14 bg-secondary/30 overflow-hidden rounded-sm">
                                  {product.product_images?.[0]?.url && <img src={product.product_images[0].url} alt={product.title} className="w-full h-full object-cover" />}
                                </div>
                                <div><p className="font-heading">{product.title}</p><p className="text-xs text-muted-foreground">{product.handle}</p></div>
                              </div>
                            </td>
                            <td>{product.category?.name || "Sarees"}</td>
                            <td className="font-price">{formatPrice(String(product.price), "INR")}</td>
                            <td>{(product.product_variants || []).reduce((sum: number, variant: any) => sum + Number(variant.inventory_qty || 0), 0)}</td>
                            <td><Badge className={statusBadge(product.status)}>{product.status}</Badge></td>
                            <td><Button size="sm" variant="outline" onClick={() => editProduct(product)}>Edit</Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </TabsContent>
              <TabsContent value="add">
                <Panel title="Add / Edit Product">
                  <form onSubmit={saveProduct} className="grid md:grid-cols-2 gap-4">
                    <Field label="Title"><Input value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value, handle: productForm.handle || slugify(e.target.value) })} required /></Field>
                    <Field label="Handle"><Input value={productForm.handle} onChange={(e) => setProductForm({ ...productForm, handle: slugify(e.target.value) })} required /></Field>
                    <Field label="Category"><Select value={productForm.categorySlug} onValueChange={(value) => setProductForm({ ...productForm, categorySlug: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoryOptions.map((category: any) => <SelectItem key={category.slug} value={category.slug}>{category.name}</SelectItem>)}</SelectContent></Select></Field>
                    <Field label="Status"><Select value={productForm.status} onValueChange={(value) => setProductForm({ ...productForm, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></Field>
                    <Field label="Price"><Input value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required type="number" /></Field>
                    <Field label="Compare-at Price"><Input value={productForm.compareAtPrice} onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })} type="number" /></Field>
                    <Field label="Fabric"><Input value={productForm.fabric} onChange={(e) => setProductForm({ ...productForm, fabric: e.target.value })} /></Field>
                    <Field label="Technique"><Input value={productForm.technique} onChange={(e) => setProductForm({ ...productForm, technique: e.target.value })} /></Field>
                    <Field label="Color"><Input value={productForm.color} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} /></Field>
                    <Field label="SKU"><Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} /></Field>
                    <Field label="Inventory Qty"><Input value={productForm.inventoryQty} onChange={(e) => setProductForm({ ...productForm, inventoryQty: e.target.value })} type="number" /></Field>
                    <Field label="Product image"><Input type="file" accept="image/*" onChange={(e) => selectMediaFile(e.target.files?.[0] || null, "image")} /></Field>
                    <Field label="Stored image URL"><Input value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} placeholder="Auto-filled after upload" /></Field>
                    <Field label="Product video"><Input type="file" accept="video/*" onChange={(e) => selectMediaFile(e.target.files?.[0] || null, "video")} /></Field>
                    <Field label="Stored video URL"><Input value={productForm.videoUrl} onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })} placeholder="Auto-filled after upload" /></Field>
                    {(productForm.imageDataUrl || productForm.imageUrl) && (
                      <div className="flex items-center gap-3 border border-border rounded-sm p-3">
                        <div className="w-16 h-20 bg-secondary/30 rounded-sm overflow-hidden">
                          <img src={productForm.imageDataUrl || productForm.imageUrl} alt={productForm.title || "Product preview"} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-muted-foreground font-body">Image media is linked to the product gallery.</p>
                      </div>
                    )}
                    {(productForm.videoDataUrl || productForm.videoUrl) && (
                      <div className="flex items-center gap-3 border border-border rounded-sm p-3">
                        <div className="w-16 h-20 bg-secondary/30 rounded-sm overflow-hidden">
                          <video src={productForm.videoDataUrl || productForm.videoUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        </div>
                        <p className="text-xs text-muted-foreground font-body">Video media is uploaded to Cloudinary and shown in the product gallery.</p>
                      </div>
                    )}
                    <label className="flex items-center gap-3 md:col-span-2"><Switch checked={productForm.hasBlousePiece} onCheckedChange={(checked) => setProductForm({ ...productForm, hasBlousePiece: checked })} /> Has blouse piece</label>
                    <div className="md:col-span-2 grid lg:grid-cols-3 gap-4">
                      {(Object.keys(catalogTaxonomy) as CatalogTaxonomyGroup[]).map((group) => (
                        <div key={group} className="border border-border rounded-sm p-3">
                          <p className="text-xs font-body uppercase tracking-wide mb-3">
                            {group === "fabric" ? "Shop by Fabric" : group === "pattern" ? "Shop by Patterns" : "Shop by Occasions"}
                          </p>
                          <div className="space-y-2">
                            {catalogTaxonomy[group].map((option) => (
                              <label key={option.slug} className="flex items-center gap-2 text-sm font-body">
                                <input
                                  type="checkbox"
                                  checked={productForm.catalogSelection[group].includes(option.slug)}
                                  onChange={() => toggleCatalogSelection(group, option.slug)}
                                  className="h-4 w-4 accent-primary"
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Field label="Short Description" className="md:col-span-2"><Input value={productForm.shortDescription} onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })} /></Field>
                    <Field label="Description" className="md:col-span-2"><Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={5} /></Field>
                    <div className="md:col-span-2 flex gap-2">
                      <Button type="submit">Save & Publish Product</Button>
                      <Button type="button" variant="outline" onClick={resetProductForm}>Clear</Button>
                    </div>
                  </form>
                </Panel>
              </TabsContent>
              <TabsContent value="import">
                <Panel title="Sync Products From Shopify CSV">
                  <div className="space-y-4 max-w-xl">
                    <p className="text-sm text-muted-foreground font-body">
                      Upload the Shopify product export CSV. Products are matched by handle and updated in place, images are refreshed, variants/SKUs are upserted, and inventory quantities are synced.
                    </p>
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      disabled={isImporting}
                      onChange={(event) => importShopifyCsv(event.target.files?.[0] || null)}
                    />
                    {isImporting && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing products...
                      </p>
                    )}
                  </div>
                </Panel>
              </TabsContent>
            </Tabs>
          )}

          {section === "inventory" && (
            <Panel title="Inventory">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left border-b border-border"><th className="py-2">SKU</th><th>Product</th><th>Qty</th><th>Flag</th><th>Adjust</th></tr></thead>
                  <tbody>
                    {data.inventory.map((variant: any) => (
                      <tr key={variant.id} className="border-b border-border last:border-0">
                        <td className="py-3 font-mono">{variant.sku}</td>
                        <td>{variant.product?.title}</td>
                        <td>{variant.inventory_qty}</td>
                        <td>{Number(variant.inventory_qty) <= 2 ? <Badge className="bg-red-100 text-red-800 border-red-200">Low Stock</Badge> : <Badge variant="outline">OK</Badge>}</td>
                        <td className="flex gap-2 py-2"><Button size="sm" variant="outline" onClick={() => adjustInventory(variant.id, -1)}>-1</Button><Button size="sm" variant="outline" onClick={() => adjustInventory(variant.id, 1)}>+1</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {section === "orders" && (
            <Panel title={`Orders (${filteredOrders.length})`}>
              <div className="space-y-3">
                {filteredOrders.map((order: any) => (
                  <div key={order.id} className="border border-border rounded-sm">
                    <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="w-full p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                      <div><p className="font-heading">{order.order_number}</p><p className="text-xs text-muted-foreground">{order.ship_full_name} · {order.contact_phone}</p></div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={statusBadge(order.payment_status)}>{order.payment_method} · {order.payment_status}</Badge>
                        <Badge className={statusBadge(order.status)}>{order.status}</Badge>
                        <span className="font-price">{formatPrice(String(order.total), "INR")}</span>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    {expandedOrder === order.id && (
                      <div className="border-t border-border p-4 grid lg:grid-cols-[1fr_320px] gap-5">
                        <div className="space-y-3">
                          {(order.order_items || []).map((item: any) => <p key={item.id} className="text-sm">{item.quantity}x {item.product_title} <span className="text-muted-foreground">({item.sku})</span></p>)}
                          <div className="text-sm text-muted-foreground">{order.ship_address_line1}, {order.ship_address_line2} {order.ship_city}, {order.ship_state} {order.ship_postal_code}</div>
                        </div>
                        <div className="space-y-3">
                          <Select value={order.status} onValueChange={(value) => updateOrder(order, { status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
                          <Select value={order.payment_status} onValueChange={(value) => updateOrder(order, { payment_status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
                          <Input placeholder="Carrier" defaultValue={order.carrier || ""} onBlur={(event) => updateOrder(order, { carrier: event.target.value })} />
                          <Input placeholder="Tracking number" defaultValue={order.tracking_number || ""} onBlur={(event) => updateOrder(order, { tracking_number: event.target.value })} />
                          <Input placeholder="Tracking URL" defaultValue={order.tracking_url || ""} onBlur={(event) => updateOrder(order, { tracking_url: event.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {section === "customers" && (
            <Panel title={`Customers (${data.customers.length})`}>
              <div className="flex justify-end mb-3">
                <Button type="button" variant="outline" size="sm" onClick={exportCustomers}>
                  <Download className="w-4 h-4 mr-2" />Export Customer Data
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left border-b border-border"><th className="py-2">Name</th><th>Phone</th><th>Email</th><th>OTP Verified</th><th>Last Activity</th><th>Details</th><th>When</th></tr></thead>
                  <tbody>{data.customers.map((customer: any) => {
                    const activity = customerActivityLabel(customer, data.orders, data.customerActivities);
                    return (
                      <tr key={customer.id} className="border-b border-border last:border-0">
                        <td className="py-3">{customer.name || "Customer"}</td>
                        <td className="font-mono">{customer.country_code} {customer.phone}</td>
                        <td>{customer.email || "-"}</td>
                        <td>{customer.is_verified ? <Badge className="bg-green-100 text-green-800 border-green-200">Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
                        <td>{activity.type}</td>
                        <td className="font-mono text-xs">{activity.detail || "-"}</td>
                        <td>{activity.at ? new Date(activity.at).toLocaleString("en-IN") : "-"}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </Panel>
          )}

          {section === "coupons" && (
            <Tabs value={couponTab} onValueChange={setCouponTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="list">Coupons</TabsTrigger>
                <TabsTrigger value="add"><Plus className="w-4 h-4 mr-2" />Create Coupon</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <Panel title={`Coupons (${filteredCoupons.length})`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left border-b border-border"><th className="py-2">Code</th><th>Discount</th><th>Validity</th><th>Usage</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        {filteredCoupons.map((coupon: any) => (
                          <tr key={coupon.id} className="border-b border-border last:border-0">
                            <td className="py-3">
                              <p className="font-heading">{coupon.code}</p>
                              <p className="text-xs text-muted-foreground">{coupon.description || "No description"}</p>
                            </td>
                            <td>
                              {coupon.discount_type === "percentage" && `${coupon.discount_value}%`}
                              {coupon.discount_type === "fixed_amount" && formatPrice(String(coupon.discount_value), "INR")}
                              {coupon.discount_type === "free_shipping" && "Free shipping"}
                              {coupon.discount_type === "buy_x_get_y" && `Buy ${coupon.buy_quantity} Get ${coupon.get_quantity}`}
                            </td>
                            <td className="text-xs text-muted-foreground">
                              {coupon.never_expires ? "Never expires" : coupon.end_at ? `Until ${new Date(coupon.end_at).toLocaleDateString("en-IN")}` : "No end date"}
                            </td>
                            <td>{coupon.usage_count || 0}{coupon.usage_limit_total ? ` / ${coupon.usage_limit_total}` : ""}</td>
                            <td><Badge className={statusBadge(coupon.status)}>{coupon.status}</Badge></td>
                            <td className="flex gap-2 py-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => editCoupon(coupon)}>Edit</Button>
                              <Button size="sm" variant="outline" onClick={() => deleteCoupon(coupon)} aria-label={`Delete ${coupon.code}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </TabsContent>
              <TabsContent value="add">
                <Panel title="Create / Edit Coupon">
                  <form onSubmit={saveCoupon} className="grid md:grid-cols-2 gap-4">
                    <Field label="Coupon Code"><Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s+/g, "") })} required placeholder="SAVE20" /></Field>
                    <Field label="Status"><Select value={couponForm.status} onValueChange={(value) => setCouponForm({ ...couponForm, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></Field>
                    <Field label="Description" className="md:col-span-2"><Input value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} placeholder="Internal campaign note" /></Field>
                    <Field label="Discount Type"><Select value={couponForm.discountType} onValueChange={(value) => setCouponForm({ ...couponForm, discountType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage off</SelectItem><SelectItem value="fixed_amount">Fixed amount off</SelectItem><SelectItem value="free_shipping">Free shipping</SelectItem><SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem></SelectContent></Select></Field>
                    <Field label="Discount Value"><Input value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} type="number" min="0" step="0.01" disabled={["free_shipping", "buy_x_get_y"].includes(couponForm.discountType)} /></Field>
                    {couponForm.discountType === "buy_x_get_y" && (
                      <>
                        <Field label="Buy Quantity"><Input value={couponForm.buyQuantity} onChange={(e) => setCouponForm({ ...couponForm, buyQuantity: e.target.value })} type="number" min="1" /></Field>
                        <Field label="Get Quantity"><Input value={couponForm.getQuantity} onChange={(e) => setCouponForm({ ...couponForm, getQuantity: e.target.value })} type="number" min="1" /></Field>
                      </>
                    )}
                    <Field label="Minimum Order Value"><Input value={couponForm.minOrderValue} onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })} type="number" min="0" /></Field>
                    <Field label="Maximum Discount Cap"><Input value={couponForm.maxDiscountCap} onChange={(e) => setCouponForm({ ...couponForm, maxDiscountCap: e.target.value })} type="number" min="0" /></Field>
                    <Field label="Usage Limit Per Coupon"><Input value={couponForm.usageLimitTotal} onChange={(e) => setCouponForm({ ...couponForm, usageLimitTotal: e.target.value })} type="number" min="1" /></Field>
                    <Field label="Usage Limit Per Customer"><Input value={couponForm.usageLimitPerCustomer} onChange={(e) => setCouponForm({ ...couponForm, usageLimitPerCustomer: e.target.value })} type="number" min="1" /></Field>
                    <Field label="Start Date & Time"><Input value={couponForm.startAt} onChange={(e) => setCouponForm({ ...couponForm, startAt: e.target.value })} type="datetime-local" /></Field>
                    <Field label="End Date & Time"><Input value={couponForm.endAt} onChange={(e) => setCouponForm({ ...couponForm, endAt: e.target.value })} type="datetime-local" disabled={couponForm.neverExpires} /></Field>
                    <Field label="Applies To"><Select value={couponForm.appliesTo} onValueChange={(value) => setCouponForm({ ...couponForm, appliesTo: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All products</SelectItem><SelectItem value="specific_products">Specific products</SelectItem><SelectItem value="specific_categories">Specific categories</SelectItem><SelectItem value="specific_fabrics">Specific fabrics</SelectItem><SelectItem value="specific_patterns">Specific patterns</SelectItem><SelectItem value="specific_occasions">Specific occasions</SelectItem></SelectContent></Select></Field>
                    <Field label="Priority / Rank"><Input value={couponForm.priority} onChange={(e) => setCouponForm({ ...couponForm, priority: e.target.value })} type="number" /></Field>
                    <Field label="Included Product IDs" className="md:col-span-2"><Textarea value={couponForm.includedProductIds} onChange={(e) => setCouponForm({ ...couponForm, includedProductIds: e.target.value })} rows={2} placeholder="Comma separated product IDs" /></Field>
                    <Field label="Included Categories" className="md:col-span-2"><Input value={couponForm.includedCategorySlugs} onChange={(e) => setCouponForm({ ...couponForm, includedCategorySlugs: e.target.value })} placeholder="sarees, blouses" /></Field>
                    <Field label="Included Tags" className="md:col-span-2"><Input value={couponForm.includedTags} onChange={(e) => setCouponForm({ ...couponForm, includedTags: e.target.value })} placeholder="fabric:tussar, pattern:jamdani, occasion:wedding" /></Field>
                    <Field label="Excluded Product IDs" className="md:col-span-2"><Textarea value={couponForm.excludedProductIds} onChange={(e) => setCouponForm({ ...couponForm, excludedProductIds: e.target.value })} rows={2} /></Field>
                    <Field label="Excluded Categories" className="md:col-span-2"><Input value={couponForm.excludedCategorySlugs} onChange={(e) => setCouponForm({ ...couponForm, excludedCategorySlugs: e.target.value })} /></Field>
                    <div className="md:col-span-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <ToggleRow label="First order only" checked={couponForm.firstOrderOnly} onCheckedChange={(checked) => setCouponForm({ ...couponForm, firstOrderOnly: checked })} />
                      <ToggleRow label="Never expires" checked={couponForm.neverExpires} onCheckedChange={(checked) => setCouponForm({ ...couponForm, neverExpires: checked })} />
                      <ToggleRow label="Exclude sale items" checked={couponForm.excludeSaleItems} onCheckedChange={(checked) => setCouponForm({ ...couponForm, excludeSaleItems: checked })} />
                      <ToggleRow label="Combine with coupons" checked={couponForm.canCombineWithCoupons} onCheckedChange={(checked) => setCouponForm({ ...couponForm, canCombineWithCoupons: checked })} />
                      <ToggleRow label="Combine with sale prices" checked={couponForm.canCombineWithSalePrices} onCheckedChange={(checked) => setCouponForm({ ...couponForm, canCombineWithSalePrices: checked })} />
                      <ToggleRow label="Auto-apply" checked={couponForm.autoApply} onCheckedChange={(checked) => setCouponForm({ ...couponForm, autoApply: checked })} />
                      <ToggleRow label="Display on website" checked={couponForm.displayOnWebsite} onCheckedChange={(checked) => setCouponForm({ ...couponForm, displayOnWebsite: checked })} />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <Button type="submit">Save Coupon</Button>
                      <Button type="button" variant="outline" onClick={resetCouponForm}>Clear</Button>
                    </div>
                  </form>
                </Panel>
              </TabsContent>
            </Tabs>
          )}

          {section === "sales" && (
            <div className="space-y-4">
              <Panel title="Sales Filters">
                <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end max-w-2xl">
                  <Field label="From"><Input type="date" value={salesRange.start} onChange={(event) => setSalesRange({ ...salesRange, start: event.target.value })} /></Field>
                  <Field label="To"><Input type="date" value={salesRange.end} onChange={(event) => setSalesRange({ ...salesRange, end: event.target.value })} /></Field>
                  <Button type="button" variant="outline" onClick={() => setSalesRange({ start: "", end: "" })}>All Time</Button>
                </div>
              </Panel>
              <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard icon={IndianRupee} label="Range Revenue" value={formatPrice(String(salesSummary.revenue), "INR")} />
                <StatCard icon={ShoppingBag} label="Range Orders" value={salesSummary.orders} />
                <StatCard icon={BarChart3} label="AOV" value={formatPrice(String(salesSummary.averageOrderValue), "INR")} />
                <StatCard icon={IndianRupee} label="Lifetime Revenue" value={formatPrice(String(stats.lifetimeRevenue), "INR")} />
                <StatCard icon={Truck} label="COD Orders" value={salesSummary.codOrders} />
              </div>
              <Panel title="Real Sales">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left border-b border-border"><th className="py-2">Order</th><th>Date</th><th>Customer</th><th>Payment</th><th>Status</th><th>Total</th></tr></thead>
                    <tbody>{data.orders.filter((order: any) => calculateSalesSummary([order], salesRange).orders > 0).map((order: any) => (
                      <tr key={order.id} className="border-b border-border last:border-0">
                        <td className="font-heading py-3">{order.order_number}</td>
                        <td>{new Date(order.placed_at || order.created_at).toLocaleDateString("en-IN")}</td>
                        <td>{order.ship_full_name}</td>
                        <td>{order.payment_method} / {order.payment_status}</td>
                        <td><Badge className={statusBadge(order.status)}>{order.status}</Badge></td>
                        <td className="font-price">{formatPrice(String(order.total), "INR")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </Panel>
            </div>
          )}

          {section === "journals" && (
            <Tabs value={journalTab} onValueChange={setJournalTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="list">Journals</TabsTrigger>
                <TabsTrigger value="edit"><Edit3 className="w-4 h-4 mr-2" />Add / Edit</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <Panel title={`Journals (${filteredJournals.length})`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left border-b border-border"><th className="py-2">Article</th><th>Category</th><th>Status</th><th>Published</th><th></th></tr></thead>
                      <tbody>{filteredJournals.map((journal: any) => (
                        <tr key={journal.id || journal.slug} className="border-b border-border last:border-0">
                          <td className="py-3">
                            <p className="font-heading">{journal.title}</p>
                            <p className="text-xs text-muted-foreground">/journals/{journal.slug}</p>
                          </td>
                          <td>{journal.category || "Journal"}</td>
                          <td><Badge className={statusBadge(journal.status)}>{journal.status}</Badge></td>
                          <td>{journal.published_at ? new Date(journal.published_at).toLocaleDateString("en-IN") : "-"}</td>
                          <td className="flex gap-2 justify-end py-2">
                            <Button size="sm" variant="outline" onClick={() => editJournal(journal)}>Edit</Button>
                            <Button size="sm" variant="outline" onClick={() => deleteJournal(journal)} aria-label={`Delete ${journal.title}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </Panel>
              </TabsContent>
              <TabsContent value="edit">
                <Panel title="Journal Studio">
                  <form onSubmit={saveJournal} className="grid md:grid-cols-2 gap-4">
                    <Field label="Title"><Input value={journalForm.title} onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value, slug: journalForm.slug || slugify(e.target.value) })} required /></Field>
                    <Field label="Slug"><Input value={journalForm.slug} onChange={(e) => setJournalForm({ ...journalForm, slug: slugify(e.target.value) })} required /></Field>
                    <Field label="Category"><Input value={journalForm.category} onChange={(e) => setJournalForm({ ...journalForm, category: e.target.value })} /></Field>
                    <Field label="Status"><Select value={journalForm.status} onValueChange={(value) => setJournalForm({ ...journalForm, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select></Field>
                    <Field label="Author"><Input value={journalForm.author} onChange={(e) => setJournalForm({ ...journalForm, author: e.target.value })} /></Field>
                    <Field label="Read Time"><Input value={journalForm.readTime} onChange={(e) => setJournalForm({ ...journalForm, readTime: e.target.value })} /></Field>
                    <Field label="Hero Image"><Input type="file" accept="image/*" onChange={(event) => selectJournalImage(event.target.files?.[0] || null)} /></Field>
                    <Field label="Hero Image URL"><Input value={journalForm.imageUrl} onChange={(e) => setJournalForm({ ...journalForm, imageUrl: e.target.value })} /></Field>
                    {(journalForm.imageDataUrl || journalForm.imageUrl) && (
                      <div className="md:col-span-2 border border-border rounded-sm p-3 max-w-md">
                        <img src={journalForm.imageDataUrl || journalForm.imageUrl} alt="Journal preview" className="w-full aspect-[16/9] object-cover rounded-sm" />
                      </div>
                    )}
                    <Field label="Excerpt" className="md:col-span-2"><Textarea value={journalForm.excerpt} onChange={(e) => setJournalForm({ ...journalForm, excerpt: e.target.value })} rows={3} required /></Field>
                    <Field label="Content" className="md:col-span-2"><Textarea value={journalForm.content} onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })} rows={12} required placeholder="Write the article. Separate paragraphs with blank lines." /></Field>
                    <Field label="Keywords / Tags" className="md:col-span-2"><Input value={journalForm.keywords} onChange={(e) => setJournalForm({ ...journalForm, keywords: e.target.value })} placeholder="handloom, tussar, saree care" /></Field>
                    <Field label="SEO Title"><Input value={journalForm.seoTitle} onChange={(e) => setJournalForm({ ...journalForm, seoTitle: e.target.value })} /></Field>
                    <Field label="SEO Description"><Input value={journalForm.seoDescription} onChange={(e) => setJournalForm({ ...journalForm, seoDescription: e.target.value })} /></Field>
                    <div className="md:col-span-2 flex gap-2">
                      <Button type="submit"><Save className="w-4 h-4 mr-2" />Save Journal</Button>
                      <Button type="button" variant="outline" onClick={resetJournalForm}>Clear</Button>
                    </div>
                  </form>
                </Panel>
              </TabsContent>
            </Tabs>
          )}

          {section === "settings" && (
            <div className="space-y-4">
              <Panel title="Website Studio">
                <form onSubmit={saveSiteContent} className="space-y-6">
                  <div className="rounded-sm border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <p className="text-sm font-body font-medium">Live storefront controls</p>
                        <p className="text-xs text-muted-foreground">Hero, navigation, and popup edits publish through realtime sync as soon as you save.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200"><Radio className="w-3 h-3 mr-1" />Realtime</Badge>
                        <Badge variant="outline">{siteSettingsForm.promoPopup.enabled ? "Popup live" : "Popup off"}</Badge>
                        <Badge variant="outline">{siteSettingsForm.navbar.navLinks.filter((link) => link.enabled).length} nav links</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="border border-border rounded-sm p-3 bg-background">
                      <div className="flex items-center gap-2 text-sm font-body font-medium"><ImageIcon className="w-4 h-4 text-primary" />Hero</div>
                      <p className="text-xs text-muted-foreground mt-1">Desktop and mobile visuals with CTA.</p>
                    </div>
                    <div className="border border-border rounded-sm p-3 bg-background">
                      <div className="flex items-center gap-2 text-sm font-body font-medium"><Link2 className="w-4 h-4 text-primary" />Navbar</div>
                      <p className="text-xs text-muted-foreground mt-1">Announcement and menu links.</p>
                    </div>
                    <div className="border border-border rounded-sm p-3 bg-background">
                      <div className="flex items-center gap-2 text-sm font-body font-medium"><Megaphone className="w-4 h-4 text-primary" />Promotions</div>
                      <p className="text-xs text-muted-foreground mt-1">Optional event or discount popup.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <p className="text-sm font-body font-medium">Hero Section</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Hero Desktop Image"><Input type="file" accept="image/*" onChange={(event) => selectSiteImage(event.target.files?.[0] || null, "desktop")} /></Field>
                    <Field label="Hero Desktop Image URL"><Input value={siteSettingsForm.hero.desktopImageUrl} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, hero: { ...siteSettingsForm.hero, desktopImageUrl: event.target.value } })} placeholder="Uses bundled image when empty" /></Field>
                    <Field label="Hero Mobile Image"><Input type="file" accept="image/*" onChange={(event) => selectSiteImage(event.target.files?.[0] || null, "mobile")} /></Field>
                    <Field label="Hero Mobile Image URL"><Input value={siteSettingsForm.hero.mobileImageUrl} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, hero: { ...siteSettingsForm.hero, mobileImageUrl: event.target.value } })} placeholder="Uses bundled image when empty" /></Field>
                    <Field label="Hero Alt Text" className="md:col-span-2"><Input value={siteSettingsForm.hero.altText} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, hero: { ...siteSettingsForm.hero, altText: event.target.value } })} /></Field>
                    <Field label="Hero CTA Text"><Input value={siteSettingsForm.hero.ctaText} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, hero: { ...siteSettingsForm.hero, ctaText: event.target.value } })} /></Field>
                    <Field label="Hero CTA Link"><Input value={siteSettingsForm.hero.ctaHref} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, hero: { ...siteSettingsForm.hero, ctaHref: event.target.value } })} /></Field>
                  </div>

                  {(heroDesktopFile?.dataUrl || heroMobileFile?.dataUrl || siteSettingsForm.hero.desktopImageUrl || siteSettingsForm.hero.mobileImageUrl) && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="border border-border rounded-sm p-3">
                        <p className="text-xs text-muted-foreground mb-2">Desktop hero preview</p>
                        <img src={heroDesktopFile?.dataUrl || siteSettingsForm.hero.desktopImageUrl || "/placeholder.svg"} alt="Desktop hero preview" className="w-full aspect-[16/7] object-cover rounded-sm bg-secondary/40" />
                      </div>
                      <div className="border border-border rounded-sm p-3">
                        <p className="text-xs text-muted-foreground mb-2">Mobile hero preview</p>
                        <img src={heroMobileFile?.dataUrl || siteSettingsForm.hero.mobileImageUrl || "/placeholder.svg"} alt="Mobile hero preview" className="w-full aspect-[4/5] object-cover rounded-sm bg-secondary/40" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    <p className="text-sm font-body font-medium">Navbar</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ToggleRow label="Show announcement bar" checked={siteSettingsForm.navbar.announcementEnabled} onCheckedChange={(checked) => setSiteSettingsForm({ ...siteSettingsForm, navbar: { ...siteSettingsForm.navbar, announcementEnabled: checked } })} />
                    <Field label="Announcement Link"><Input value={siteSettingsForm.navbar.announcementHref} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, navbar: { ...siteSettingsForm.navbar, announcementHref: event.target.value } })} /></Field>
                    <Field label="Announcement Text" className="md:col-span-2"><Input value={siteSettingsForm.navbar.announcementText} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, navbar: { ...siteSettingsForm.navbar, announcementText: event.target.value } })} /></Field>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-body font-medium">Navbar Links</p>
                        <p className="text-xs text-muted-foreground">These sync to the live navbar and mobile drawer.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addNavLink}><Plus className="w-4 h-4 mr-2" />Add Link</Button>
                    </div>
                    {siteSettingsForm.navbar.navLinks.map((link, index) => (
                      <div key={`${link.label}-${index}`} className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end border border-border rounded-sm p-3">
                        <Field label="Label"><Input value={link.label} onChange={(event) => updateNavLink(index, { label: event.target.value })} /></Field>
                        <Field label="URL"><Input value={link.href} onChange={(event) => updateNavLink(index, { href: event.target.value })} /></Field>
                        <ToggleRow label="Enabled" checked={link.enabled} onCheckedChange={(checked) => updateNavLink(index, { enabled: checked })} />
                        <Button type="button" variant="outline" size="icon" onClick={() => removeNavLink(index)} aria-label={`Remove ${link.label}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 border border-border rounded-sm p-4">
                    <div className="md:col-span-2 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-primary" />
                      <p className="text-sm font-body font-medium">Promotional Popup</p>
                    </div>
                    <ToggleRow label="Enable popup" checked={siteSettingsForm.promoPopup.enabled} onCheckedChange={(checked) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, enabled: checked } })} />
                    <Field label="Delay (ms)"><Input type="number" min="0" value={siteSettingsForm.promoPopup.delayMs} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, delayMs: Number(event.target.value || 0) } })} /></Field>
                    <Field label="Title"><Input value={siteSettingsForm.promoPopup.title} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, title: event.target.value } })} placeholder="Festive edit is live" /></Field>
                    <Field label="Offer Label"><Input value={siteSettingsForm.promoPopup.discountLabel} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, discountLabel: event.target.value } })} placeholder="15% OFF" /></Field>
                    <Field label="Body" className="md:col-span-2"><Input value={siteSettingsForm.promoPopup.body} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, body: event.target.value } })} /></Field>
                    <Field label="Code"><Input value={siteSettingsForm.promoPopup.code} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, code: event.target.value.toUpperCase().replace(/\s+/g, "") } })} /></Field>
                    <Field label="CTA Text"><Input value={siteSettingsForm.promoPopup.ctaText} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, ctaText: event.target.value } })} /></Field>
                    <Field label="CTA Link"><Input value={siteSettingsForm.promoPopup.ctaHref} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, ctaHref: event.target.value } })} /></Field>
                    <Field label="Fine Print"><Input value={siteSettingsForm.promoPopup.finePrint} onChange={(event) => setSiteSettingsForm({ ...siteSettingsForm, promoPopup: { ...siteSettingsForm.promoPopup, finePrint: event.target.value } })} /></Field>
                  </div>

                  <div className="flex justify-end border-t border-border pt-4">
                    <Button type="submit" className="min-w-48"><Save className="w-4 h-4 mr-2" />Save & Sync Website</Button>
                  </div>
                </form>
              </Panel>

              <Panel title="Admin Password">
                <form onSubmit={changePassword} className="max-w-md space-y-4">
                  <Field label="Current password">
                    <Input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required />
                  </Field>
                  <Field label="New password">
                    <Input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required minLength={12} />
                  </Field>
                  <Field label="Confirm new password">
                    <Input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required minLength={12} />
                  </Field>
                  <Button type="submit">Change Password</Button>
                </form>
              </Panel>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof LayoutDashboard; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-body uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-heading">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-sm">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-heading text-lg">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 border border-border rounded-sm p-3 text-sm font-body">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
