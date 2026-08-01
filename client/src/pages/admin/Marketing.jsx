import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import {
  RiMegaphoneLine,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiCoupon3Line,
  RiSparklingLine,
  RiTimeLine,
  RiFolderImageLine,
} from "react-icons/ri";

const MarketingPage = () => {
  const { showAlert: alert, showConfirm } = useAlert();

  // Coupons states
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "Percentage",
    value: "",
    usageLimit: "100",
    userLimit: "1",
    expiryDate: "",
  });

  // Banner Campaign schedules states
  const [bannerSettings, setBannerSettings] = useState({
    enabled: true,
    bannerTitle: "GRAND FESTIVE PARIWESH SALE",
    subtitle: "Handcrafted Luxury suits up to 40% Off",
    primaryButtonText: "Explore Collection",
    discountTag: "LEHERGOLD15",
    countdownTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    bannerImage:
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=1200",
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Fetch all Coupons
  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await API.get("/coupons");
      if (res.data?.success) {
        setCoupons(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load discount coupons directory");
    } finally {
      setCouponsLoading(false);
    }
  };

  // Fetch Banner settings from /settings object
  const fetchBannerSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await API.get("/settings");
      if (res.data?.success && res.data.data?.festiveBannerSettings) {
        try {
          const parsed = JSON.parse(res.data.data.festiveBannerSettings);
          setBannerSettings(parsed);
        } catch (e) {
          console.error("Settings JSON parsing error, using default seeds", e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchBannerSettings();
  }, []);

  // Creation of coupon code
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) {
      alert("Please compile core coupon metrics");
      return;
    }
    try {
      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        discountType:
          newCoupon.discountType === "Fixed" ||
          newCoupon.discountType === "Flat"
            ? "Flat"
            : "Percentage",
        value: Number(newCoupon.value),
        usageLimit: newCoupon.usageLimit
          ? Number(newCoupon.usageLimit)
          : 9999,
        userLimit: newCoupon.userLimit ? Number(newCoupon.userLimit) : 1,
        expiryDate: newCoupon.expiryDate || undefined,
      };

      const res = await API.post("/coupons", payload);
      if (res.data?.success) {
        alert("Coupon created successfully!");
        setShowCouponModal(false);
        setNewCoupon({
          code: "",
          discountType: "Percentage",
          value: "",
          usageLimit: "100",
          userLimit: "1",
          expiryDate: "",
        });
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Promo enlistment failed");
    }
  };

  // Deletion of coupon code
  const handleDeleteCoupon = async (id, code) => {
    const confirmed = await showConfirm(
      `Delete coupon promo tag: ${code}?`,
      "Delete Coupon",
    );
    if (!confirmed) return;
    try {
      await API.delete(`/coupons/${code}`);
      alert("Coupon deleted");
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert("Deletion script failed");
    }
  };

  // File selector image loader for Banner campaign
  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerSettings((prev) => ({
          ...prev,
          bannerImage: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Commit Banner updates to backend Settings key/value
  const handleSaveBannerCampaign = async () => {
    try {
      // First save festiveBannerSettings JSON string
      const jsonSettings = JSON.stringify(bannerSettings);

      // Send settings update
      await API.post("/settings", {
        key: "festiveBannerSettings",
        value: jsonSettings,
      });
      alert("Festive campaign scheduling updated!");
      fetchBannerSettings();
    } catch (err) {
      console.error(err);
      alert("Server rejection of campaign configurations");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-wide text-white">
          Marketing & Sales Campaigns
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Configure active customer coupon deals, promotional timers, and
          homepage headers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Banner Campaign Scheduling */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-accent-gold flex items-center">
              <RiSparklingLine className="mr-2" /> Festive Campaign Scheduling
            </h3>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bannerSettings.enabled}
                onChange={(e) =>
                  setBannerSettings({
                    ...bannerSettings,
                    enabled: e.target.checked,
                  })
                }
                className="rounded text-accent-gold focus:ring-accent-gold"
              />
              <span className="text-xs font-bold text-slate-400">
                Live Campaign Status
              </span>
            </label>
          </div>

          {settingsLoading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Campaign Header Label
                </label>
                <input
                  type="text"
                  value={bannerSettings.bannerTitle}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      bannerTitle: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Sub-heading Details Description
                </label>
                <input
                  type="text"
                  value={bannerSettings.subtitle}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      subtitle: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Trigger Button Text
                  </label>
                  <input
                    type="text"
                    value={bannerSettings.primaryButtonText}
                    onChange={(e) =>
                      setBannerSettings({
                        ...bannerSettings,
                        primaryButtonText: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Default Discount Promo Code
                  </label>
                  <input
                    type="text"
                    value={bannerSettings.discountTag}
                    onChange={(e) =>
                      setBannerSettings({
                        ...bannerSettings,
                        discountTag: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Scheduled Countdown Limit
                </label>
                <input
                  type="datetime-local"
                  value={bannerSettings.countdownTime}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      countdownTime: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
                />
              </div>

              {/* Campaign image upload / URL */}
              <div className="space-y-3.5">
                <label className="text-xs font-semibold text-slate-450 block">
                  Featured Campaign Banner Image
                </label>
                <div className="flex items-center space-x-4">
                  {bannerSettings.bannerImage && (
                    <img
                      src={bannerSettings.bannerImage}
                      className="w-24 h-16 object-cover border border-slate-850 rounded"
                      alt=""
                    />
                  )}
                  <div className="space-y-1">
                    <label className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] uppercase font-bold tracking-wider text-accent-gold py-1.5 px-3 rounded cursor-pointer">
                      Upload Banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[9px] text-slate-500 mt-1">
                      Wide landscape cover image recommended (1200x400)
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveBannerCampaign}
                className="w-full bg-accent-gold text-slate-950 text-xs font-bold py-3 mt-4 rounded-lg transition hover:bg-yellow-500"
              >
                Save & Deploy Campaign Banners
              </button>
            </div>
          )}
        </div>

        {/* Coupons Directory Manager */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-accent-gold flex items-center">
              <RiCoupon3Line className="mr-2" /> active checkout discount
              coupons
            </h3>
            <button
              onClick={() => setShowCouponModal(true)}
              className="flex items-center space-x-1.5 text-xs font-bold text-accent-gold hover:underline"
            >
              <RiAddCircleLine size={16} />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[420px]">
            {couponsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-850 p-4.5 rounded-lg flex items-center justify-between"
                  >
                    <div className="space-y-2 w-2/3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4.5 w-12" />
                      </div>
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                No checking discount coupons active
              </p>
            ) : (
              coupons.map((cop, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-850 p-4.5 rounded-lg flex items-center justify-between transition-colors hover:border-slate-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold tracking-widest font-mono text-white uppercase">
                        {cop.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          cop.status === "Active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-slate-800 text-slate-450"
                        }`}
                      >
                        {cop.status === "Active" ? "Live" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Discount:{" "}
                      <span className="font-semibold text-slate-200">
                        {cop.discountType === "Flat"
                          ? `₹${cop.value} off`
                          : `${cop.value}% off`}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Used {cop.ordersUsed || 0}/{cop.usageLimit || "∞"} times ·{" "}
                      {cop.userLimit || 1}× per customer
                    </p>
                    {cop.expiryDate && (
                      <p className="text-[9px] text-slate-550 flex items-center font-mono py-0.5">
                        <RiTimeLine className="mr-1" /> Expr:{" "}
                        {new Date(cop.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(cop._id, cop.code)}
                    className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Coupon Modal Form */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateCoupon}
            className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-5"
          >
            <div>
              <h3 className="font-display font-medium text-lg text-white">
                Issue Discount Coupon Promo
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Specify validation limits and discount percentages values below
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Unique Code Tag *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PARIWESHGOLD15"
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white uppercase font-mono tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-450">
                    Discount Type
                  </label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        discountType: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="Percentage">Percentage %</option>
                    <option value="Flat">Flat amount ₹</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    {newCoupon.discountType === "Flat"
                      ? "₹ Off amount *"
                      : "% Off *"}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={
                      newCoupon.discountType === "Flat" ? "e.g. 200" : "e.g. 15"
                    }
                    value={newCoupon.value}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, value: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-850 rounded p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Total people / uses (global) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={newCoupon.usageLimit}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, usageLimit: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-850 rounded p-2.5 text-xs text-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    Pehle itne orders tak ye coupon chalega (sab milake)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Per customer limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={newCoupon.userLimit}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, userLimit: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-850 rounded p-2.5 text-xs text-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    Ek user kitni baar use kar sakta hai
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 font-sans">
                    Expiry Date Limit
                  </label>
                  <input
                    type="date"
                    value={newCoupon.expiryDate}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, expiryDate: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-850 rounded p-2.5 text-xs text-slate-202"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pb-1 border-t border-slate-850 pt-4">
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 py-2 px-5 rounded text-xs transition"
              >
                Discard
              </button>
              <button
                type="submit"
                className="bg-accent-gold text-slate-950 py-2 px-6 rounded text-xs font-bold transition hover:bg-yellow-500"
              >
                Confirm Promo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MarketingPage;
