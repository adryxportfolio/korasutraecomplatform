import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackMetaPageView } from "@/lib/metaPixel";

export function MetaPixelPageViewTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;

    if (lastTrackedPath.current === nextPath) return;
    lastTrackedPath.current = nextPath;
    trackMetaPageView(nextPath);
  }, [location.hash, location.pathname, location.search]);

  return null;
}
