import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import Select from "../../components/admin/ui/Select.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
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
    desktopImage: "",
    tabletImage: "",
    mobileImage: "",
    startDate: "",
    endDate: "",
    priority: 1,
    link: "/shop",
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
          setBannerSettings((prev) => ({
            ...prev,
            ...parsed,
          }));
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
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : 9999,
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

  // File selector image loader for Banner campaign Device types
  const handleFeaturedImageUpload = async (file, deviceType) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          const res = await API.post("/settings", {
            key: `slideImg_campaign_${deviceType}`,
            value: base64Data,
          });
          if (res.data?.success && res.data.data?.value) {
            const uploadedUrl = res.data.data.value;
            setBannerSettings((prev) => ({
              ...prev,
              [`${deviceType}Image`]: uploadedUrl,
              ...(deviceType === "desktop" ? { bannerImage: uploadedUrl } : {}),
            }));
            alert(
              `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} banner image uploaded!`,
            );
          }
        } catch (err) {
          console.error(err);
          alert(`Upload failed for ${deviceType} banner`);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
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
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Page Title */}
      <PageHeader
        title="Marketing & Sales Campaigns"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Marketing" },
        ]}
        subtitle="Configure active customer coupon deals, promotional timers, and homepage headers"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Banner Campaign Scheduling */}
        <Card className="p-6 space-y-5 bg-[#FAF9F6] border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-[#c5a880] flex items-center">
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
                className="rounded text-[#c5a880] focus:ring-[#c5a880] border-slate-200"
              />
              <span className="text-xs font-bold text-slate-650">
                Live Campaign Status
              </span>
            </label>
          </div>

          {settingsLoading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <SkeletonLoader className="h-4 w-28 animate-pulse" />
                <SkeletonLoader className="h-10 w-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <SkeletonLoader className="h-4 w-36 animate-pulse" />
                <SkeletonLoader className="h-10 w-full animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SkeletonLoader className="h-4 w-24 animate-pulse" />
                  <SkeletonLoader className="h-10 w-full animate-pulse" />
                </div>
                <div className="space-y-2">
                  <SkeletonLoader className="h-4 w-32 animate-pulse" />
                  <SkeletonLoader className="h-10 w-full animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <SkeletonLoader className="h-4 w-32 animate-pulse" />
                <SkeletonLoader className="h-10 w-full animate-pulse" />
              </div>
              <SkeletonLoader className="h-12 w-full mt-4 animate-pulse rounded" />
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Campaign Title / Title Header"
                value={bannerSettings.bannerTitle || ""}
                onChange={(e) =>
                  setBannerSettings({
                    ...bannerSettings,
                    bannerTitle: e.target.value,
                  })
                }
              />

              <Input
                label="Campaign Subtitle / Description"
                value={bannerSettings.subtitle || ""}
                onChange={(e) =>
                  setBannerSettings({
                    ...bannerSettings,
                    subtitle: e.target.value,
                  })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="CTA Button Text"
                  value={bannerSettings.primaryButtonText || ""}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      primaryButtonText: e.target.value,
                    })
                  }
                />
                <Input
                  label="CTA Target Link"
                  value={bannerSettings.link || "/shop"}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      link: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Discount Promo Code"
                  type="text"
                  value={bannerSettings.discountTag || ""}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      discountTag: e.target.value.toUpperCase(),
                    })
                  }
                  className="font-mono uppercase"
                />
                <Input
                  label="Display Priority"
                  type="number"
                  min="1"
                  value={bannerSettings.priority || 1}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      priority: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Campaign Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={bannerSettings.startDate || ""}
                    onChange={(e) =>
                      setBannerSettings({
                        ...bannerSettings,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Campaign End Date / Timer limit
                  </label>
                  <input
                    type="datetime-local"
                    value={bannerSettings.endDate || ""}
                    onChange={(e) =>
                      setBannerSettings({
                        ...bannerSettings,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Scheduled Countdown Limit (Visual Clock)
                </label>
                <input
                  type="datetime-local"
                  value={bannerSettings.countdownTime || ""}
                  onChange={(e) =>
                    setBannerSettings({
                      ...bannerSettings,
                      countdownTime: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                />
              </div>

              {/* Dynamic Devices Specific Banner Image Uploader */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <label className="text-xs font-bold text-[#c5a880] uppercase tracking-wider block">
                  Campaign Devices Banner Media uploads (JPG, PNG, WebP)
                </label>

                {/* Desktop Upload Block */}
                <div className="bg-white p-3 rounded border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">
                      Desktop Banner (1920x700)
                    </span>
                    {bannerSettings.desktopImage ||
                    bannerSettings.bannerImage ? (
                      <span className="text-[9px] text-[#c5a880] font-bold bg-[#c5a880]/10 px-2 py-0.5 rounded border border-[#c5a880]/15">
                        Configured
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">
                        Not set
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {(bannerSettings.desktopImage ||
                      bannerSettings.bannerImage) && (
                      <img
                        src={
                          bannerSettings.desktopImage ||
                          bannerSettings.bannerImage
                        }
                        className="w-20 h-10 object-cover border border-slate-200 rounded"
                        alt=""
                      />
                    )}
                    <label className="bg-[#FAF9F6] hover:bg-slate-50 border border-slate-200 text-[10px] uppercase font-bold tracking-wider text-[#c5a880] py-1.5 px-3 rounded cursor-pointer transition">
                      Choose Desktop Image
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={(e) =>
                          handleFeaturedImageUpload(
                            e.target.files[0],
                            "desktop",
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Tablet Upload Block */}
                <div className="bg-white p-3 rounded border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">
                      Tablet Banner (1024x600)
                    </span>
                    {bannerSettings.tabletImage ? (
                      <span className="text-[9px] text-[#c5a880] font-bold bg-[#c5a880]/10 px-2 py-0.5 rounded border border-[#c5a880]/15">
                        Configured
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">
                        Not set (Falls back to Desktop)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {bannerSettings.tabletImage && (
                      <img
                        src={bannerSettings.tabletImage}
                        className="w-20 h-10 object-cover border border-slate-200 rounded"
                        alt=""
                      />
                    )}
                    <label className="bg-[#FAF9F6] hover:bg-slate-50 border border-slate-200 text-[10px] uppercase font-bold tracking-wider text-[#c5a880] py-1.5 px-3 rounded cursor-pointer transition">
                      Choose Tablet Image
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={(e) =>
                          handleFeaturedImageUpload(e.target.files[0], "tablet")
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Mobile Upload Block */}
                <div className="bg-white p-3 rounded border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">
                      Mobile Banner (430x700)
                    </span>
                    {bannerSettings.mobileImage ? (
                      <span className="text-[9px] text-[#c5a880] font-bold bg-[#c5a880]/10 px-2 py-0.5 rounded border border-[#c5a880]/15">
                        Configured
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">
                        Not set (Falls back to Tablet/Desktop)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {bannerSettings.mobileImage && (
                      <img
                        src={bannerSettings.mobileImage}
                        className="w-20 h-10 object-cover border border-slate-200 rounded"
                        alt=""
                      />
                    )}
                    <label className="bg-[#FAF9F6] hover:bg-slate-50 border border-slate-200 text-[10px] uppercase font-bold tracking-wider text-[#c5a880] py-1.5 px-3 rounded cursor-pointer transition">
                      Choose Mobile Image
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={(e) =>
                          handleFeaturedImageUpload(e.target.files[0], "mobile")
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleSaveBannerCampaign}
                className="w-full mt-4"
              >
                Save & Deploy Campaign Banners
              </Button>
            </div>
          )}
        </Card>

        {/* Coupons Directory Manager */}
        <Card className="p-6 space-y-5 bg-[#FAF9F6] border-slate-200 h-fit">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-[#c5a880] flex items-center">
              <RiCoupon3Line className="mr-2" /> active checkout discount
              coupons
            </h3>
            <Button
              onClick={() => setShowCouponModal(true)}
              variant="outline"
              size="sm"
              className="text-xs text-[#c5a880] border-[#c5a880]/30 hover:bg-[#c5a880]/10 flex items-center space-x-1.5"
            >
              <RiAddCircleLine size={16} />
              <span>Create Coupon</span>
            </Button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
            {couponsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 p-4.5 rounded-lg flex items-center justify-between"
                  >
                    <div className="space-y-2 w-2/3">
                      <div className="flex items-center space-x-3">
                        <SkeletonLoader className="h-5 w-24 rounded animate-pulse" />
                        <SkeletonLoader className="h-4.5 w-12 rounded animate-pulse" />
                      </div>
                      <SkeletonLoader className="h-3.5 w-40 rounded animate-pulse" />
                      <SkeletonLoader className="h-3 w-28 rounded animate-pulse" />
                    </div>
                    <SkeletonLoader className="h-8 w-8 rounded animate-pulse animate-pulse" />
                  </div>
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                No active discount coupons found.
              </p>
            ) : (
              coupons.map((cop, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between shadow-sm hover:border-[#c5a880]/40 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold tracking-widest font-mono text-slate-800 uppercase">
                        {cop.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          cop.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {cop.status === "Active" ? "Live" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-650">
                      Discount:{" "}
                      <span className="font-semibold text-slate-900">
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
                      <p className="text-[9px] text-slate-500 flex items-center font-mono py-0.5">
                        <RiTimeLine className="mr-1" /> Expr:{" "}
                        {new Date(cop.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(cop._id, cop.code)}
                    className="text-slate-400 hover:text-rose-600 p-2 rounded hover:bg-rose-50 transition"
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Create Coupon Modal Form */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={handleCreateCoupon}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl p-6 space-y-5 animate-fade-in"
          >
            <div>
              <h3 className="font-display font-medium text-lg text-slate-900">
                Issue Discount Coupon Promo
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Specify validation limits and discount percentages values below
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Unique Code Tag *"
                required
                placeholder="e.g. PARIWESHGOLD15"
                value={newCoupon.code}
                onChange={(e) =>
                  setNewCoupon({
                    ...newCoupon,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="uppercase font-mono tracking-widest"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                    className="w-full bg-white border border-slate-200 text-xs rounded p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  >
                    <option value="Percentage">Percentage %</option>
                    <option value="Flat">Flat amount ₹</option>
                  </select>
                </div>
                <Input
                  label={
                    newCoupon.discountType === "Flat"
                      ? "₹ Off amount *"
                      : "% Off *"
                  }
                  type="number"
                  required
                  placeholder={
                    newCoupon.discountType === "Flat" ? "e.g. 200" : "e.g. 15"
                  }
                  value={newCoupon.value}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, value: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input
                    label="Total globally permitted uses *"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={newCoupon.usageLimit}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, usageLimit: e.target.value })
                    }
                  />
                  <p className="text-[9px] text-slate-400">
                    Pehle itne total orders tak ye coupon chalega
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Input
                    label="Per customer usage limit *"
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={newCoupon.userLimit}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, userLimit: e.target.value })
                    }
                  />
                  <p className="text-[9px] text-slate-400">
                    Ek user kitni baar use kar sakta hai
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Expiry Date Limit
                  </label>
                  <input
                    type="date"
                    value={newCoupon.expiryDate}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, expiryDate: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pb-1 border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCouponModal(false)}
              >
                Discard
              </Button>
              <Button type="submit" variant="primary">
                Confirm Promo
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MarketingPage;
