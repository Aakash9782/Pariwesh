import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import API from "../../services/api.js";
import {
  initMetaPixel,
  trackPageView,
  getMetaTrackingCookies,
  setMetaUserIdentity,
  trackScrollDepth,
} from "../../services/metaPixel.js";

/**
 * MetaPixelTracker
 * Automatically fetches Meta Pixel configuration from server settings,
 * initializes the Pixel with Advanced Matching, syncs logged-in/guest user profile,
 * tracks route changes, and passivly monitors 50% & 90% scroll depth with zero lag.
 */
const MetaPixelTracker = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isFirstRender = useRef(true);
  const isInitializedRef = useRef(typeof window !== "undefined" && Boolean(window.fbq));

  // Sync logged in user profile with Meta Advanced Matching
  useEffect(() => {
    if (user && (user.email || user.phone || user.name)) {
      setMetaUserIdentity({
        email: user.email,
        phone: user.phone,
        name: user.name,
      });
    }
  }, [user]);

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
            // Ensure cookies / fbclid are initialized and persisted
            getMetaTrackingCookies();
          }
        }
      } catch (err) {
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
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isInitializedRef.current || (typeof window !== "undefined" && window.fbq)) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, location.search]);

  // Passive Scroll Depth Tracker (50% and 90% milestones - 0% CPU impact)
  useEffect(() => {
    let tracked50 = false;
    let tracked90 = false;
    let ticking = false;

    const checkScrollDepth = () => {
      if (tracked90) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 80) return; // Skip tiny / non-scrollable pages

      const percent = (scrollY / docHeight) * 100;

      if (!tracked50 && percent >= 50) {
        tracked50 = true;
        trackScrollDepth("50%", location.pathname, document.title);
      }
      if (!tracked90 && percent >= 85) {
        tracked90 = true;
        trackScrollDepth("90%", location.pathname, document.title);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking && !tracked90) {
        window.requestAnimationFrame(checkScrollDepth);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.pathname]);

  return null;
};

export default MetaPixelTracker;
