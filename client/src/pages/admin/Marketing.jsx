import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  RiEditLine,
} from "react-icons/ri";

const MarketingPage = () => {
  const { showAlert: alert, showConfirm } = useAlert();
  const [searchParams] = useSearchParams();
  const couponsSectionRef = useRef(null);

  // Coupons states
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [highlightCoupons, setHighlightCoupons] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "Percentage",
    value: "",
    minAmount: "",
    maxDiscount: "",
    usageLimit: "100",
    userLimit: "1",
    expiryDate: "",
    status: "Active",
  });

  // Special Offers edit states
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "Percentage",
    value: 0,
    minQuantity: 0,
    minAmount: 0,
    maxDiscount: "",
    startDate: "",
    expiryDate: "",
    usageLimit: 9999,
    userLimit: 1,
    priority: 1,
    canCombine: false,
    giftValue: 0,
    status: "Active",
  });

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

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (searchParams.get("tab") !== "coupons") return;
    const t = setTimeout(() => {
      couponsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setHighlightCoupons(true);
      setTimeout(() => setHighlightCoupons(false), 2500);
    }, 150);
    return () => clearTimeout(t);
  }, [searchParams]);

  const openCreateCouponModal = () => {
    setEditingCoupon(null);
    setNewCoupon({
      code: "",
      discountType: "Percentage",
      value: "",
      minAmount: "",
      maxDiscount: "",
      usageLimit: "100",
      userLimit: "1",
      expiryDate: "",
      status: "Active",
    });
    setShowCouponModal(true);
  };

  const openEditCouponModal = (cop) => {
    setEditingCoupon(cop);
    setNewCoupon({
      code: cop.code || "",
      discountType: cop.discountType || "Percentage",
      value: cop.value !== undefined ? String(cop.value) : "",
      minAmount: cop.minAmount ? String(cop.minAmount) : "",
      maxDiscount: cop.maxDiscount ? String(cop.maxDiscount) : "",
      usageLimit: cop.usageLimit ? String(cop.usageLimit) : "100",
      userLimit: cop.userLimit ? String(cop.userLimit) : "1",
      expiryDate: cop.expiryDate
        ? new Date(cop.expiryDate).toISOString().split("T")[0]
        : "",
      status: cop.status || "Active",
    });
    setShowCouponModal(true);
  };

  const closeCouponModal = () => {
    setShowCouponModal(false);
    setEditingCoupon(null);
  };

  // Creation & Editing of standard coupon promo
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) {
      alert("Please enter coupon code and discount value");
      return;
    }
    const numValue = Number(newCoupon.value);
    if (isNaN(numValue) || numValue <= 0) {
      alert("Discount value must be greater than 0");
      return;
    }
    if (newCoupon.discountType === "Percentage" && numValue > 100) {
      alert("Percentage discount cannot exceed 100%");
      return;
    }

    try {
      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        discountType:
          newCoupon.discountType === "Flat" ? "Flat" : "Percentage",
        value: numValue,
        minAmount: newCoupon.minAmount ? Number(newCoupon.minAmount) : 0,
        maxDiscount:
          newCoupon.maxDiscount && newCoupon.discountType === "Percentage"
            ? Number(newCoupon.maxDiscount)
            : undefined,
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : 9999,
        userLimit: newCoupon.userLimit ? Number(newCoupon.userLimit) : 1,
        expiryDate: newCoupon.expiryDate || undefined,
        status: newCoupon.status || "Active",
      };

      if (editingCoupon) {
        const res = await API.put(`/coupons/${editingCoupon.code}`, payload);
        if (res.data?.success) {
          alert(`Coupon ${editingCoupon.code} updated successfully!`);
          closeCouponModal();
          fetchCoupons();
        }
      } else {
        const res = await API.post("/coupons", payload);
        if (res.data?.success) {
          alert("Coupon created successfully!");
          closeCouponModal();
          fetchCoupons();
        }
      }
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          (editingCoupon ? "Failed to update coupon" : "Promo creation failed")
      );
    }
  };

  // Toggle Live/Inactive status of standard coupon
  const handleToggleCouponStatus = async (cop) => {
    try {
      const nextStatus = cop.status === "Active" ? "Inactive" : "Active";
      const res = await API.put(`/coupons/${cop.code}`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        alert(`Coupon ${cop.code} is now ${nextStatus}`);
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update coupon status");
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

  const handleUpdateOffer = async (e) => {
    e.preventDefault();
    try {
      const numValue = Number(selectedOffer.value);
      if (
        selectedOffer.offerType !== "SURPRISE_GIFT" &&
        (isNaN(numValue) || numValue <= 0)
      ) {
        alert("Discount value must be greater than 0");
        return;
      }
      if (selectedOffer.discountType === "Percentage" && numValue > 100) {
        alert("Percentage discount cannot exceed 100%");
        return;
      }

      const payload = {
        name: selectedOffer.name,
        description: selectedOffer.description,
        value: numValue,
        minQuantity: Number(selectedOffer.minQuantity) || 0,
        minAmount: Number(selectedOffer.minAmount) || 0,
        maxDiscount:
          selectedOffer.maxDiscount !== "" &&
          selectedOffer.maxDiscount !== undefined &&
          selectedOffer.maxDiscount !== null
            ? Number(selectedOffer.maxDiscount)
            : undefined,
        giftValue: Number(selectedOffer.giftValue) || 0,
        usageLimit: Number(selectedOffer.usageLimit) || 9999,
        userLimit: Number(selectedOffer.userLimit) || 1,
        priority: Number(selectedOffer.priority) || 1,
        canCombine: Boolean(selectedOffer.canCombine),
        status: selectedOffer.status,
        startDate: selectedOffer.startDate || undefined,
        expiryDate: selectedOffer.expiryDate || undefined,
      };

      const targetCode = selectedOffer.originalCode || selectedOffer.code;
      const res = await API.put(`/coupons/${targetCode}`, payload);
      if (res.data?.success) {
        alert("Offer updated successfully!");
        setShowEditOfferModal(false);
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update offer");
    }
  };

  const specialOffers = coupons.filter((c) => c.isSpecialOffer);
  const standardCoupons = coupons.filter((c) => !c.isSpecialOffer);

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

      <div className="grid grid-cols-1 gap-8">
        {/* Campaign header removed */}

        {/* Coupons Directory Manager */}
        <div
          id="coupons-section"
          ref={couponsSectionRef}
          className={`rounded-lg transition-shadow duration-500 ${
            highlightCoupons ? "ring-2 ring-[#c5a880] shadow-lg" : ""
          }`}
        >
          <Card className="p-6 space-y-5 bg-[#FAF9F6] border-slate-200 h-fit">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-[#c5a880] flex items-center">
                <RiCoupon3Line className="mr-2" /> active checkout discount
                coupons
              </h3>
              <Button
                onClick={openCreateCouponModal}
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
              ) : standardCoupons.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">
                  No active discount coupons found.
                </p>
              ) : (
                standardCoupons.map((cop, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between shadow-sm hover:border-[#c5a880]/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold tracking-widest font-mono text-slate-800 uppercase">
                          {cop.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCouponStatus(cop)}
                          title="Click to toggle Active / Inactive"
                          className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase cursor-pointer transition hover:opacity-85 ${
                            cop.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {cop.status === "Active" ? "● Live (Click to Pause)" : "○ Inactive (Click to Activate)"}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Discount:{" "}
                        <span className="font-semibold text-slate-900">
                          {cop.discountType === "Flat"
                            ? `₹${cop.value} off`
                            : `${cop.value}% off`}
                        </span>
                        {cop.maxDiscount > 0 && cop.discountType === "Percentage" && (
                          <span className="text-amber-800 font-medium ml-2 text-[10px]">
                            (Capped at ₹{cop.maxDiscount})
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                        <span>
                          Used {cop.ordersUsed || 0}/{cop.usageLimit || "∞"} times
                        </span>
                        <span>· {cop.userLimit || 1}× per customer</span>
                        {cop.minAmount > 0 && (
                          <span className="text-[#8a1c14] font-semibold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                            Min Order: ₹{cop.minAmount}
                          </span>
                        )}
                      </div>
                      {cop.expiryDate && (
                        <p className="text-[9px] text-slate-500 flex items-center font-mono py-0.5">
                          <RiTimeLine className="mr-1" /> Expr:{" "}
                          {new Date(cop.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditCouponModal(cop)}
                        className="text-slate-400 hover:text-[#c5a880] p-2 rounded hover:bg-[#c5a880]/10 transition cursor-pointer"
                        title="Edit Coupon Details"
                      >
                        <RiEditLine size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(cop._id, cop.code)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Coupon"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 col-span-1 lg:col-span-2">
        <Card className="p-6 space-y-5 bg-[#FAF9F6] border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-[#c5a880] flex items-center">
                🎁 SPECIAL OFFERS
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Customer Cart Offers & Multi-Item Deals • {specialOffers.filter((o) => o.status === "Active").length} Live On Store
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {specialOffers.map((off) => {
              const isActive = off.status === "Active";
              return (
                <div
                  key={off._id}
                  className={`p-4 rounded-xl flex flex-col justify-between shadow-sm transition space-y-3 ${
                    isActive
                      ? "bg-white border border-slate-200 hover:border-[#c5a880]/50"
                      : "bg-slate-50/80 border border-dashed border-slate-300 opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between items-start space-x-2">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {off.name || off.offerType}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleCouponStatus(off)}
                        title="Click to toggle Active / Disabled"
                        className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase cursor-pointer transition hover:opacity-85 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-200 text-slate-600 border border-slate-300"
                        }`}
                      >
                        {isActive ? "● Active" : "○ Disabled"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-2 h-7">
                      {off.description}
                    </p>
                    <div className="text-[10.5px] space-y-1 text-slate-600 border-t border-slate-100 pt-2">
                      <div>
                        Code:{" "}
                        <span className="font-mono font-bold uppercase text-slate-800">
                          {off.code}
                        </span>
                      </div>
                      {off.offerType === "BUY_X_GET_Y" && (
                        <div>
                          Value:{" "}
                          <span className="font-semibold text-slate-800">
                            {off.value}% OFF
                          </span>
                        </div>
                      )}
                      {off.offerType === "BUY_X_GET_Y" && (
                        <div>
                          Min Qty:{" "}
                          <span className="font-semibold text-slate-800">
                            {off.minQuantity} items
                          </span>
                        </div>
                      )}
                      {off.offerType === "PREPAID" && (
                        <div>
                          Value:{" "}
                          <span className="font-semibold text-slate-800">
                            {off.value}% OFF
                          </span>
                        </div>
                      )}
                      {off.offerType === "SURPRISE_GIFT" && (
                        <>
                          <div>
                            Threshold:{" "}
                            <span className="font-semibold text-slate-800">
                              ₹{off.minAmount}
                            </span>
                          </div>
                          <div>
                            Gift Value:{" "}
                            <span className="font-semibold text-slate-800">
                              ₹{off.giftValue}
                            </span>
                          </div>
                        </>
                      )}
                      <div>
                        Priority:{" "}
                        <span className="font-mono text-slate-700">
                          {off.priority}
                        </span>
                      </div>
                      <div>
                        Stackable:{" "}
                        <span className="font-mono text-slate-700">
                          {off.canCombine ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <Button
                      onClick={() => {
                        setSelectedOffer({
                          ...off,
                          originalCode: off.code,
                          maxDiscount: off.maxDiscount || "",
                          startDate: off.startDate
                            ? new Date(off.startDate).toISOString().split("T")[0]
                            : "",
                          expiryDate: off.expiryDate
                            ? new Date(off.expiryDate).toISOString().split("T")[0]
                            : "",
                        });
                        setShowEditOfferModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[10px] py-1 border-[#c5a880]/30 text-[#c5a880] hover:bg-[#c5a880]/10 flex items-center justify-center space-x-1"
                    >
                      <RiEditLine size={13} />
                      <span>Edit</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(off._id, off.code)}
                      title={`Delete Offer (${off.code})`}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                    >
                      <RiDeleteBinLine size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Create / Edit Coupon Modal Form */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={handleSaveCoupon}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl p-6 space-y-5 animate-fade-in"
          >
            <div>
              <h3 className="font-display font-medium text-lg text-slate-900">
                {editingCoupon
                  ? `Modify Promo Coupon: ${editingCoupon.code}`
                  : "Issue Discount Coupon Promo"}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {editingCoupon
                  ? "Update discount percentage, usage limits, or expiry date"
                  : "Specify validation limits and discount percentages values below"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Unique Code Tag *"
                  required
                  disabled={Boolean(editingCoupon)}
                  placeholder="e.g. PARIWESHGOLD15"
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className={`uppercase font-mono tracking-widest ${
                    editingCoupon
                      ? "bg-slate-100 cursor-not-allowed text-slate-600 opacity-90"
                      : ""
                  }`}
                />
                {editingCoupon && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Code tag cannot be changed after creation to protect existing orders and customer carts.
                  </p>
                )}
              </div>

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
                  min="1"
                  max={newCoupon.discountType === "Percentage" ? "100" : undefined}
                  placeholder={
                    newCoupon.discountType === "Flat" ? "e.g. 200" : "e.g. 15"
                  }
                  value={newCoupon.value}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, value: e.target.value })
                  }
                />
              </div>

              {/* Safeguards: Min Order Amount & Max Discount Cap */}
              <div className="grid grid-cols-2 gap-4 bg-amber-50/60 p-3 rounded-lg border border-amber-200/70">
                <div className="space-y-1.5">
                  <Input
                    label="Min Order Amount (₹)"
                    type="number"
                    min="0"
                    placeholder="e.g. 1999 (0 = No min)"
                    value={newCoupon.minAmount}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, minAmount: e.target.value })
                    }
                  />
                  <p className="text-[9px] text-amber-800 font-medium">
                    Isse kam cart total pe coupon apply nahi hoga
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Input
                    label="Max Discount Cap (₹)"
                    type="number"
                    min="0"
                    disabled={newCoupon.discountType === "Flat"}
                    placeholder={
                      newCoupon.discountType === "Flat"
                        ? "N/A for Flat"
                        : "e.g. 500 (Blank = No cap)"
                    }
                    value={newCoupon.maxDiscount}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        maxDiscount: e.target.value,
                      })
                    }
                  />
                  <p className="text-[9px] text-amber-800 font-medium">
                    Percentage discount isse zyada nahi hoga
                  </p>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-[9px] text-slate-400">
                    Optional: Blank rakhein agar expire nahi karna
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Coupon Status
                  </label>
                  <select
                    value={newCoupon.status || "Active"}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        status: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  >
                    <option value="Active">● Active (Live for customers)</option>
                    <option value="Inactive">○ Inactive (Paused/Draft)</option>
                  </select>
                  <p className="text-[9px] text-slate-400">
                    Controls whether customers can apply this code
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pb-1 border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeCouponModal}
              >
                Discard
              </Button>
              <Button type="submit" variant="primary">
                {editingCoupon ? "Save Changes" : "Confirm Promo"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Special Offer Modal Form */}
      {showEditOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleUpdateOffer}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl p-6 space-y-5 animate-fade-in my-8 text-left"
          >
            <div>
              <h3 className="font-display font-medium text-lg text-slate-900">
                Modify Special Promotion:{" "}
                {selectedOffer.name || selectedOffer.code}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Configure stacking, active dates, thresholds and customer rules.
              </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Offer Display Name"
                  required
                  value={selectedOffer.name || ""}
                  onChange={(e) =>
                    setSelectedOffer({ ...selectedOffer, name: e.target.value })
                  }
                />
                <div>
                  <Input
                    label="Coupon Code Tag"
                    required
                    disabled
                    value={selectedOffer.code || ""}
                    className="bg-slate-100 font-mono tracking-widest cursor-not-allowed opacity-80"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Special offer system code tag is locked to maintain customer cart discounts.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Offer Description
                </label>
                <textarea
                  value={selectedOffer.description || ""}
                  onChange={(e) =>
                    setSelectedOffer({
                      ...selectedOffer,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-200 text-xs rounded p-2.5 text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedOffer.offerType !== "SURPRISE_GIFT" && (
                  <Input
                    label="Discount Value"
                    type="number"
                    required
                    value={selectedOffer.value}
                    onChange={(e) =>
                      setSelectedOffer({
                        ...selectedOffer,
                        value: e.target.value,
                      })
                    }
                  />
                )}
                {selectedOffer.offerType === "BUY_X_GET_Y" && (
                  <Input
                    label="Min Quantity Threshold"
                    type="number"
                    required
                    value={selectedOffer.minQuantity}
                    onChange={(e) =>
                      setSelectedOffer({
                        ...selectedOffer,
                        minQuantity: e.target.value,
                      })
                    }
                  />
                )}
                {selectedOffer.offerType === "SURPRISE_GIFT" && (
                  <>
                    <Input
                      label="Min Purchase Amount Threshold"
                      type="number"
                      required
                      value={selectedOffer.minAmount}
                      onChange={(e) =>
                        setSelectedOffer({
                          ...selectedOffer,
                          minAmount: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Gift Value (₹)"
                      type="number"
                      required
                      value={selectedOffer.giftValue}
                      onChange={(e) =>
                        setSelectedOffer({
                          ...selectedOffer,
                          giftValue: e.target.value,
                        })
                      }
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Priority Ranking"
                  type="number"
                  required
                  value={selectedOffer.priority}
                  onChange={(e) =>
                    setSelectedOffer({
                      ...selectedOffer,
                      priority: e.target.value,
                    })
                  }
                />
                <Input
                  label="Global Usage Limit"
                  type="number"
                  required
                  value={selectedOffer.usageLimit}
                  onChange={(e) =>
                    setSelectedOffer({
                      ...selectedOffer,
                      usageLimit: e.target.value,
                    })
                  }
                />
                <Input
                  label="Per Customer Limit"
                  type="number"
                  required
                  value={selectedOffer.userLimit}
                  onChange={(e) =>
                    setSelectedOffer({
                      ...selectedOffer,
                      userLimit: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Campaign Start Date
                  </label>
                  <input
                    type="date"
                    value={selectedOffer.startDate}
                    onChange={(e) =>
                      setSelectedOffer({
                        ...selectedOffer,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Campaign Expiry Date
                  </label>
                  <input
                    type="date"
                    value={selectedOffer.expiryDate}
                    onChange={(e) =>
                      setSelectedOffer({
                        ...selectedOffer,
                        expiryDate: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedOffer.status === "Active"}
                    onChange={(e) =>
                      setSelectedOffer({
                        ...selectedOffer,
                        status: e.target.checked ? "Active" : "Inactive",
                      })
                    }
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#c5a880] focus:ring-[#c5a880]"
                  />
                  <span>Enable Promotion (Set Status Live)</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedOffer.canCombine)}
                    onChange={(e) =>
                      setSelectedOffer({
                        ...selectedOffer,
                        canCombine: e.target.checked,
                      })
                    }
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#c5a880] focus:ring-[#c5a880]"
                  />
                  <span>Allow combination stacking</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pb-1 border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditOfferModal(false)}
              >
                Discard
              </Button>
              <Button type="submit" variant="primary">
                Update Offer Settings
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MarketingPage;
