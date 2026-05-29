import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SeoHead } from "@/components/seo/Seo";
import { getCanonicalRedirect } from "@/lib/redirects";
import { generatePageMetadata } from "@/lib/seo";

function routeTitle(pathname: string) {
  if (pathname === "/") return "Handcrafted Sarees";
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "Korasutra";
  return lastSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RouteSeoPolicy() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = `${location.pathname}${location.search}`;

  useEffect(() => {
    const redirect = getCanonicalRedirect(location.pathname);
    if (redirect) {
      navigate(`${redirect.destination}${location.search}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const metadata = generatePageMetadata({
    title: routeTitle(location.pathname),
    description: "Shop authentic handcrafted sarees at Korasutra with thoughtful curation, secure checkout, and India-wide delivery.",
    path,
  });

  return <SeoHead metadata={metadata} />;
}
