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
  const isInitializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchConfigAndInit = async () => {
      try {
        const res = await API.get("/settings");
        if (res.data?.success && res.data?.data) {
          const settings = res.data.data;
          const pixelId = settings.metaPixelId || "28073830485569829";
          const isEnabled =
            settings.metaTrackingEnabled !== undefined
              ? settings.metaTrackingEnabled === "true" ||
                settings.metaTrackingEnabled === true
              : true;

          if (pixelId && isEnabled && isMounted) {
            initMetaPixel(pixelId);
            isInitializedRef.current = true;
            // First page view
            trackPageView(location.pathname);
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

  // Track PageView on route navigation
  useEffect(() => {
    if (isInitializedRef.current) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixelTracker;
