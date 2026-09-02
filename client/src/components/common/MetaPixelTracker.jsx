import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import API from "../../services/api.js";
import {
  initMetaPixel,
  trackPageView,
  getMetaTrackingCookies,
} from "../../services/metaPixel.js";

/**
 * MetaPixelTracker
 * Automatically fetches Meta Pixel configuration from server settings,
 * initializes the Pixel, and listens to route changes for SPA PageView tracking.
 */
const MetaPixelTracker = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const isInitializedRef = useRef(typeof window !== "undefined" && Boolean(window.fbq));

  useEffect(() => {
    let isMounted = true;

    const fetchConfigAndInit = async () => {
      try {
        const res = await API.get("/settings");
        if (res.data?.success && res.data?.data) {
          const settings = res.data.data;
          const pixelId = settings.metaPixelId || "992964093751142";
          const isEnabled =
            settings.metaTrackingEnabled !== undefined
              ? settings.metaTrackingEnabled === "true" ||
                settings.metaTrackingEnabled === true
              : true;

          if (pixelId && isEnabled && isMounted) {
            initMetaPixel(pixelId);
            isInitializedRef.current = true;
            // Ensure cookies / fbclid are initialized
            getMetaTrackingCookies();
          }
        }
      } catch (err) {
        // Fallback: silently ignore if settings fail to load
        console.warn("[MetaPixelTracker] Could not load pixel config:", err.message);
      }
    };

    fetchConfigAndInit();

    return () => {
      isMounted = false;
    };
  }, []);

  // Track PageView on route navigation (skip initial render as index.html already fires PageView)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isInitializedRef.current || (typeof window !== "undefined" && window.fbq)) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixelTracker;
