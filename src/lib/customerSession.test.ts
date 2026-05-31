import { beforeEach, describe, expect, test } from "bun:test";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  const cookies = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    value: {
      location: { protocol: "https:" },
      localStorage: {
        getItem: (key: string) => store.get(key) || null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
      dispatchEvent: () => true,
      CustomEvent: class CustomEvent {
        constructor(public type: string, public init?: unknown) {}
      },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: {
      get cookie() {
        return Array.from(cookies.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
      },
      set cookie(value: string) {
        const [pair] = value.split(";");
        const [name, rawValue] = pair.split("=");
        if (value.includes("Max-Age=0")) {
          cookies.delete(name);
          return;
        }
        cookies.set(name, rawValue);
      },
    },
    configurable: true,
  });
});

describe("customer session storage", () => {
  test("uses the secure cookie as the session source of truth instead of localStorage", async () => {
    const { CUSTOMER_SESSION_KEY, getCustomerSessionToken } = await import("./customerSession");

    window.localStorage.setItem(CUSTOMER_SESSION_KEY, "stale-local-token");
    document.cookie = `${CUSTOMER_SESSION_KEY}=fresh-cookie-token; Path=/; Secure; SameSite=Strict`;

    expect(getCustomerSessionToken()).toBe("fresh-cookie-token");
    expect(window.localStorage.getItem(CUSTOMER_SESSION_KEY)).toBeNull();
  });

  test("persists new session tokens in cookies only", async () => {
    const { CUSTOMER_SESSION_KEY, setCustomerSessionToken } = await import("./customerSession");

    setCustomerSessionToken("new-token");

    expect(document.cookie).toContain(`${CUSTOMER_SESSION_KEY}=new-token`);
    expect(window.localStorage.getItem(CUSTOMER_SESSION_KEY)).toBeNull();
  });

  test("persists customer profile details in the cookie session", async () => {
    const { CUSTOMER_SESSION_PROFILE_KEY, getCustomerSessionProfile, setCustomerSessionProfile } = await import("./customerSession");

    setCustomerSessionProfile({
      countryCode: "+91",
      phone: "7416644554",
      email: "customer@example.com",
      name: "Kora Customer",
    });

    expect(document.cookie).toContain(`${CUSTOMER_SESSION_PROFILE_KEY}=`);
    expect(window.localStorage.getItem(CUSTOMER_SESSION_PROFILE_KEY)).toBeNull();
    expect(getCustomerSessionProfile()).toEqual({
      countryCode: "+91",
      phone: "7416644554",
      email: "customer@example.com",
      name: "Kora Customer",
    });
  });
});
