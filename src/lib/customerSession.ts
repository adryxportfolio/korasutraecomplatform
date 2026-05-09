export const CUSTOMER_SESSION_KEY = "ks_customer_session_token";
export const CUSTOMER_SESSION_PROFILE_KEY = "ks_customer_session_profile";
export const CUSTOMER_SESSION_CHANGED_EVENT = "ks-customer-session-changed";

const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

type CustomerSessionProfile = {
  countryCode?: string;
  phone?: string;
  email?: string;
  name?: string;
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function cookieOptions() {
  const secure = canUseBrowserStorage() && window.location.protocol === "https:" ? "; Secure" : "";
  return `Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Strict${secure}`;
}

function getCookieValue(name: string) {
  if (!canUseBrowserStorage()) return "";
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function notifySessionChanged(token: string) {
  if (!canUseBrowserStorage()) return;
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_CHANGED_EVENT, { detail: { token } }));
}

export function getCustomerSessionToken() {
  if (!canUseBrowserStorage()) return "";
  const legacyLocalToken = window.localStorage.getItem(CUSTOMER_SESSION_KEY) || "";
  const cookieToken = getCookieValue(CUSTOMER_SESSION_KEY);
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  if (cookieToken) {
    document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_KEY)}=${encodeURIComponent(cookieToken)}; ${cookieOptions()}`;
    return cookieToken;
  }

  if (legacyLocalToken) {
    document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_KEY)}=${encodeURIComponent(legacyLocalToken)}; ${cookieOptions()}`;
    return legacyLocalToken;
  }
  return "";
}

export function setCustomerSessionToken(token: string) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_KEY)}=${encodeURIComponent(token)}; ${cookieOptions()}`;
  notifySessionChanged(token);
}

export function getCustomerSessionProfile(): CustomerSessionProfile | null {
  if (!canUseBrowserStorage()) return null;
  const raw = getCookieValue(CUSTOMER_SESSION_PROFILE_KEY) || window.localStorage.getItem(CUSTOMER_SESSION_PROFILE_KEY);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw);
    window.localStorage.removeItem(CUSTOMER_SESSION_PROFILE_KEY);
    document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_PROFILE_KEY)}=${encodeURIComponent(JSON.stringify(profile))}; ${cookieOptions()}`;
    return profile;
  } catch {
    window.localStorage.removeItem(CUSTOMER_SESSION_PROFILE_KEY);
    document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_PROFILE_KEY)}=; Max-Age=0; Path=/; SameSite=Strict`;
    return null;
  }
}

export function setCustomerSessionProfile(profile: CustomerSessionProfile) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(CUSTOMER_SESSION_PROFILE_KEY);
  document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_PROFILE_KEY)}=${encodeURIComponent(JSON.stringify(profile))}; ${cookieOptions()}`;
  notifySessionChanged(getCustomerSessionToken());
}

export function clearCustomerSessionToken() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.localStorage.removeItem(CUSTOMER_SESSION_PROFILE_KEY);
  document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_KEY)}=; Max-Age=0; Path=/; SameSite=Strict`;
  document.cookie = `${encodeURIComponent(CUSTOMER_SESSION_PROFILE_KEY)}=; Max-Age=0; Path=/; SameSite=Strict`;
  notifySessionChanged("");
}
