import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api.js";

const SettingsContext = createContext(null);

const CACHE_KEY = "pariwesh_settings_cache_v2";
const CACHE_TIME_KEY = "pariwesh_settings_timestamp_v2";
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && timestamp && Date.now() - Number(timestamp) < CACHE_TTL_MS) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignore parse errors
    }
    return {};
  });

  const [isLoaded, setIsLoaded] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIME_KEY);
      return Boolean(cached && timestamp && Date.now() - Number(timestamp) < CACHE_TTL_MS);
    } catch (e) {
      return false;
    }
  });

  const [loading, setLoading] = useState(!isLoaded);

  const fetchSettings = useCallback(async (force = false) => {
    try {
      if (force) {
        localStorage.removeItem(CACHE_TIME_KEY);
      }
      const res = await API.get("/settings");
      if (res.data && res.data.success && res.data.data) {
        const liveSettings = res.data.data;
        setSettings(liveSettings);
        setIsLoaded(true);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(liveSettings));
          localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch (e) {
          // localStorage full or restricted
        }
        return liveSettings;
      }
    } catch (err) {
      console.warn("[SettingsContext] Failed to fetch settings:", err.message);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    return await fetchSettings(true);
  }, [fetchSettings]);

  // Derived Safe Helpers (Gated by isLoaded to completely eliminate layout flashes)
  const isAnnouncementActive = Boolean(
    isLoaded && (settings.announcementActive === true || settings.announcementActive === "true")
  );

  const announcementText =
    settings.announcementText ||
    "USE CODE PARIWESHGOLD TO GET 15% OFF + FREE SHIPPING ON APPAREL ABOVE ₹1500";

  const isSaleEventActive = Boolean(
    isLoaded && (settings.saleEventActive === true || settings.saleEventActive === "true")
  );

  const saleNavTitle = settings.saleNavTitle || "NAVRATRI SALE IS LIVE";
  const saleNavBadge = settings.saleNavBadge || "Sale";

  const isCountdownActive = Boolean(
    isLoaded &&
      (settings.countdownActive === true ||
        settings.countdownActive === "true" ||
        settings.saleEventActive === true ||
        settings.saleEventActive === "true")
  );

  const isCampaignBannersActive = Boolean(
    isLoaded &&
      (settings.homeCampaignBannersActive === true || settings.homeCampaignBannersActive === "true")
  );

  const isSlideBarActive =
    settings.slideBarActive === undefined
      ? true
      : settings.slideBarActive === true || settings.slideBarActive === "true";

  const slideshowImages = [
    settings.slideImg1,
    settings.slideImg2,
    settings.slideImg3,
    settings.slideImg4,
    settings.slideImg5,
  ].filter(Boolean);

  const brandLogoUrl = settings.brandLogoUrl || "";

  const codEnabled = settings.codEnabled !== false && settings.codEnabled !== "false";
  const deliveryCharge = Number(settings.deliveryCharge || 0);
  const freeThreshold = Number(settings.freeThreshold || 0);

  const value = {
    settings,
    isLoaded,
    loading,
    refreshSettings,
    isAnnouncementActive,
    announcementText,
    isSaleEventActive,
    saleNavTitle,
    saleNavBadge,
    isCountdownActive,
    isCampaignBannersActive,
    isSlideBarActive,
    slideshowImages,
    brandLogoUrl,
    codEnabled,
    deliveryCharge,
    freeThreshold,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
