import { canonicalPath } from "./seo";

export type RedirectRule = {
  source: string;
  destination: string;
  permanent: true;
};

export const vercelRedirects: RedirectRule[] = [
  { source: "/collection/:slug", destination: "/collections/:slug", permanent: true },
  { source: "/collections", destination: "/collections/all", permanent: true },
  { source: "/products", destination: "/collections/all", permanent: true },
  { source: "/product/:handle", destination: "/products/:handle", permanent: true },
  { source: "/shop", destination: "/collections/all", permanent: true },
  { source: "/sarees", destination: "/collections/all", permanent: true },
  { source: "/saree", destination: "/collections/all", permanent: true },
  { source: "/pages/about-us", destination: "/about", permanent: true },
  { source: "/pages/contact-us", destination: "/contact", permanent: true },
  { source: "/kora-sutra", destination: "/", permanent: true },
  { source: "/kora-sutra/", destination: "/", permanent: true },
  { source: "/korasutra-official", destination: "/", permanent: true },
];

export function getCanonicalRedirect(path: string) {
  const cleanPath = canonicalPath(path);
  const pathOnly = path.split(/[?#]/)[0] || "/";
  if (pathOnly !== cleanPath) {
    return {
      source: path,
      destination: cleanPath,
      permanent: true as const,
    };
  }
  return null;
}
