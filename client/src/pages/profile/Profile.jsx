import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  RiOrderPlayLine,
  RiMapPinLine,
  RiUser3Line,
  RiLogoutBoxRLine,
  RiDeleteBinLine,
  RiAddLine,
  RiCloseLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import Input from "../../components/form/Input.jsx";
import { logoutSuccess, updateProfile } from "../../redux/slices/authSlice.js";
import API from "../../services/api.js";
import SEO from "../../components/common/SEO.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("orders"); // orders, addresses, info

  // User input states bound directly to Profile Settings
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal / Form fields state for new Address setup
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newAddr, setNewAddr] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
  });

  const handleSignOut = () => {
    dispatch(logoutSuccess());
    navigate("/");
  };

  // Sync state values with store user structure
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setAddresses(user.addresses || []);
    }
  }, [user]);

  // Dynamic order and return list registry loading from backend
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchUserOrders = async () => {
    try {
      if (user?._id) {
        const res = await API.get(`/orders?userId=${user._id}`);
        if (res.data && res.data.success) {
          setOrders(res.data.data);
        }
      }
    } catch (err) {
      console.error("Failed fetching user orders:", err);
    }
  };

  const fetchUserReturns = async () => {
    try {
      if (user?._id) {
        const res = await API.get("/returns");
        if (res.data && res.data.success) {
          setReturns(res.data.data);
        }
      }
    } catch (err) {
      console.error("Failed fetching user returns:", err);
    }
  };

  useEffect(() => {
    const loadAllProfileData = async () => {
      setLoadingOrders(true);
      await Promise.all([fetchUserOrders(), fetchUserReturns()]);
      setLoadingOrders(false);
    };
    if (user?._id) {
      loadAllProfileData();
    }
  }, [user]);

  // Return & Refuning States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({
    order: null,
    item: null,
    reason: "Damaged Product Received",
    files: [],
    upiId: "",
    error: "",
    submitting: false,
  });

  const showReturnButtonForItem = (order, productId, size) => {
    const allowedStatuses = [
      "Delivered",
      "Return_Requested",
      "Return_Approved",
      "Return_In_Transit",
      "Return_Received",
      "Return_Completed",
      "Return_Disputed",
    ];
    if (!allowedStatuses.includes(order.orderStatus)) return false;

    // Calculate delivered date duration (7 days)
    const deliveredDate = order.deliveredAt || order.updatedAt;
    if (!deliveredDate) return false;
    const diffTime = Math.abs(Date.now() - new Date(deliveredDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return false;

    // Check if this item already has a return request
    const hasRequest = returns.some(
      (ret) =>
        ret.orderId?._id === order._id &&
        ret.status !== "Return_Rejected" &&
        ret.items.some(
          (item) => item.productId === productId && item.size === size,
        ),
    );

    return !hasRequest;
  };

  const getReturnEligibilityMessage = (order, productId, size) => {
    const allowedStatuses = [
      "Delivered",
      "Return_Requested",
      "Return_Approved",
      "Return_In_Transit",
      "Return_Received",
      "Return_Completed",
      "Return_Disputed",
    ];
    if (!allowedStatuses.includes(order.orderStatus)) return null;

    const deliveredDate = order.deliveredAt || order.updatedAt;
    if (!deliveredDate) return null;
    const diffTime = Math.abs(Date.now() - new Date(deliveredDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Find return request
    const existingRet = returns.find(
      (ret) =>
        ret.orderId?._id === order._id &&
        ret.items.some(
          (item) => item.productId === productId && item.size === size,
        ),
    );

    if (existingRet) {
      if (existingRet.status === "Return_Rejected") {
        return {
          text: `Rejected: ${existingRet.rejectionReason || "Criteria mismatch"}`,
          style: "bg-red-500/10 text-red-500 border border-red-500/20",
        };
      }
      const formattedStatus = existingRet.status
        .replace("Return_", "")
        .replace("_", " ");
      let statusStyle =
        "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      if (existingRet.status === "Return_Completed") {
        statusStyle =
          "bg-green-500/10 text-green-500 border border-green-500/20";
      } else if (existingRet.status === "Return_Disputed") {
        statusStyle =
          "bg-orange-500/10 text-orange-500 border border-orange-500/20";
      }
      return {
        text: `Return ${formattedStatus}`,
        style: statusStyle,
      };
    }

    if (diffDays > 7) {
      return {
        text: "Return window expired",
        style: "bg-slate-500/10 text-slate-500 border border-slate-500/10",
      };
    }

    return null;
  };

  const handleReturnFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (returnForm.files.length + files.length > 3) {
      alert("You can upload a maximum of 3 photos.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReturnForm((prev) => ({
          ...prev,
          files: [...prev.files, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setReturnForm((prev) => ({ ...prev, submitting: true, error: "" }));

    if (returnForm.order.paymentMethod === "COD" && !returnForm.upiId.trim()) {
      setReturnForm((prev) => ({
        ...prev,
        submitting: false,
        error: "Please enter a valid UPI ID for COD refund.",
      }));
      return;
    }

    try {
      const res = await API.post("/returns", {
        orderId: returnForm.order._id,
        items: [
          {
            productId: returnForm.item.productId,
            name: returnForm.item.name,
            sku: returnForm.item.sku,
            size: returnForm.item.size,
            quantity: returnForm.item.quantity || returnForm.item.qty || 1,
            price: returnForm.item.price,
          },
        ],
        reason: returnForm.reason,
        customerUploads: returnForm.files,
        refundDetails: {
          upiId: returnForm.upiId.trim(),
        },
      });

      if (res.data && res.data.success) {
        alert("Return request created successfully!");
        setShowReturnModal(false);
        fetchUserOrders();
        fetchUserReturns();
      }
    } catch (err) {
      setReturnForm((prev) => ({
        ...prev,
        submitting: false,
        error:
          err.response?.data?.message || "Failed to submit return request.",
      }));
    }
  };

  // Submit profile details to backend
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await API.put("/users/profile", {
        name: profileName,
        email: profileEmail,
      });
      if (res.data && res.data.success) {
        dispatch(updateProfile(res.data.data));
        setSuccessMsg("Profile settings updated successfully!");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to update profile settings.",
      );
    }
  };

  // Save address (Supports both Add and Edit actions)
  const handleSaveAddressForm = async (e) => {
    e.preventDefault();
    if (
      !newAddr.fullName ||
      !newAddr.phone ||
      !newAddr.street ||
      !newAddr.city ||
      !newAddr.state ||
      !newAddr.pincode
    ) {
      setErrorMsg("Please fill out all address details.");
      return;
    }
    setErrorMsg("");
    try {
      let updatedAddresses;
      if (editingIndex !== null) {
        updatedAddresses = [...addresses];
        updatedAddresses[editingIndex] = newAddr;
      } else {
        updatedAddresses = [...addresses, newAddr];
      }
      const res = await API.put("/users/profile", {
        addresses: updatedAddresses,
      });
      if (res.data && res.data.success) {
        dispatch(updateProfile(res.data.data));
        setAddresses(res.data.data.addresses || []);
        setShowAddressForm(false);
        setEditingIndex(null);
        setNewAddr({
          fullName: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          pincode: "",
          type: "Home",
        });
        setSuccessMsg(
          editingIndex !== null
            ? "Address updated successfully!"
            : "Address added successfully!",
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save address.");
    }
  };

  const handleEditAddress = (idx) => {
    setEditingIndex(idx);
    setNewAddr(addresses[idx]);
    setShowAddressForm(true);
  };

  // Remove address from user registry
  const handleDeleteAddress = async (idxToDelete) => {
    try {
      const updatedAddresses = addresses.filter(
        (_, idx) => idx !== idxToDelete,
      );
      const res = await API.put("/users/profile", {
        addresses: updatedAddresses,
      });
      if (res.data && res.data.success) {
        dispatch(updateProfile(res.data.data));
        setAddresses(res.data.data.addresses || []);
        setSuccessMsg("Address deleted successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg("Failed to delete address.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <SEO title="My Account Profile" noindex={true} />
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        {/* Mobile Horizontal Tabs Selector */}
        <div className="lg:hidden flex border-b border-borderLight pb-4 overflow-x-auto bg-transparent px-1 gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 text-center py-2.5 px-3 text-xs font-bold rounded-sm flex items-center justify-center space-x-1.5 whitespace-nowrap transition-all ${
              activeTab === "orders"
                ? "bg-secondary text-primary shadow-sm"
                : "text-textPrimary bg-primary border border-borderLight"
            }`}
          >
            <RiOrderPlayLine size={13} />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex-1 text-center py-2.5 px-3 text-xs font-bold rounded-sm flex items-center justify-center space-x-1.5 whitespace-nowrap transition-all ${
              activeTab === "addresses"
                ? "bg-secondary text-primary shadow-sm"
                : "text-textPrimary bg-primary border border-borderLight"
            }`}
          >
            <RiMapPinLine size={13} />
            <span>Addresses</span>
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 text-center py-2.5 px-4 text-xs font-bold rounded-sm flex items-center justify-center space-x-1.5 whitespace-nowrap transition-all ${
              activeTab === "info"
                ? "bg-secondary text-primary shadow-sm"
                : "text-textPrimary bg-primary border border-borderLight"
            }`}
          >
            <RiUser3Line size={13} />
            <span>Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="text-center py-2.5 px-4 text-xs font-bold text-danger bg-danger/10 border border-danger/20 rounded-sm flex items-center justify-center space-x-1.5 whitespace-nowrap"
          >
            <RiLogoutBoxRLine size={13} />
            <span>Logout</span>
          </button>
        </div>

        {/* Navigation Sidebar Panel (Desktop/Tablet) */}
        <aside className="hidden lg:block w-full lg:w-64 bg-primary border border-borderLight p-6 rounded-sm space-y-8 flex-shrink-0 text-textPrimary">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-textPrimary leading-none">
              {user?.name || "Premium Member"}
            </h2>
            <span className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold">
              Pariwesh{" "}
              {user?.role === "admin" ? "Staff Coordinator" : "Premium Member"}
            </span>
          </div>

          <div className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-sm flex items-center space-x-3 transition-colors ${
                activeTab === "orders"
                  ? "bg-secondary text-primary"
                  : "text-textPrimary hover:bg-bgLight"
              }`}
            >
              <RiOrderPlayLine size={16} />
              <span>Purchase Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-sm flex items-center space-x-3 transition-colors ${
                activeTab === "addresses"
                  ? "bg-secondary text-primary"
                  : "text-textPrimary hover:bg-bgLight"
              }`}
            >
              <RiMapPinLine size={16} />
              <span>Saved Addresses</span>
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-sm flex items-center space-x-3 transition-colors ${
                activeTab === "info"
                  ? "bg-secondary text-primary"
                  : "text-textPrimary hover:bg-bgLight"
              }`}
            >
              <RiUser3Line size={16} />
              <span>Profile Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 text-xs font-semibold text-danger rounded-sm flex items-center space-x-3 hover:bg-danger/10 transition-colors"
            >
              <RiLogoutBoxRLine size={16} />
              <span>Logout Account</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Display Panel */}
        <main className="flex-grow bg-primary border border-borderLight p-6 sm:p-8 rounded-sm">
          {/* TAB 1: ORDER LEDGER */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-3 border-b border-borderLight">
                My Orders
              </h3>
              <div className="space-y-6">
                {loadingOrders ? (
                  <div className="space-y-4 py-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="border border-borderLight p-4 rounded-sm space-y-3"
                      >
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                        <div className="flex space-x-3 items-center">
                          <Skeleton className="h-16 w-16 rounded" />
                          <div className="space-y-1.5 flex-grow">
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3.5 w-1/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-xs text-textSecondary text-center py-6">
                    No orders placed yet. Head over to our catalog to shop!
                  </p>
                ) : (
                  orders.map((ord, oIdx) => (
                    <div
                      key={oIdx}
                      className="border border-borderLight rounded-sm animate-fade-in"
                    >
                      {/* Header stats bar */}
                      <div className="bg-bgLight px-6 py-4 flex flex-col sm:flex-row justify-between text-xs text-textSecondary gap-2 border-b border-borderLight">
                        <div>
                          <span className="block text-[9px] uppercase font-bold tracking-wider">
                            Order ID
                          </span>
                          <span className="font-bold text-textPrimary">
                            {ord.orderId}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold tracking-wider">
                            Date Booked
                          </span>
                          <span className="font-bold text-textPrimary">
                            {new Date(ord.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold tracking-wider">
                            Estimated Total
                          </span>
                          <span className="font-bold text-accent-gold">
                            ₹{ord.pricing?.grandTotal || 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold tracking-wider">
                            Live Status
                          </span>
                          <span
                            className={`font-bold inline-block px-2.5 py-0.5 rounded-full text-[9px] ${
                              ord.orderStatus === "Delivered"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-blue-500/10 text-blue-600"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 divide-y divide-borderLight">
                        {ord.items.map((it, iIdx) => {
                          const returnMsg = getReturnEligibilityMessage(
                            ord,
                            it.productId,
                            it.size,
                          );
                          const isEligible = showReturnButtonForItem(
                            ord,
                            it.productId,
                            it.size,
                          );

                          return (
                            <div
                              key={iIdx}
                              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLight last:border-b-0"
                            >
                              <div className="flex space-x-3 items-center">
                                <img
                                  src={optimizeCloudinaryUrl(
                                    it.image || "/hero.png",
                                    200,
                                  )}
                                  alt={it.name}
                                  className="w-12 h-14 object-cover bg-bgLight border border-borderLight rounded"
                                />
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-bold text-textPrimary leading-snug">
                                    {it.name}
                                  </h4>
                                  <p className="text-[10px] text-textSecondary uppercase">
                                    Size: {it.size} | Qty:{" "}
                                    {it.quantity || it.qty}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 self-end sm:self-auto">
                                <span className="text-xs font-bold text-textPrimary">
                                  ₹{it.price}
                                </span>

                                {isEligible && (
                                  <button
                                    onClick={() => {
                                      setReturnForm({
                                        order: ord,
                                        item: it,
                                        reason: "Damaged Product Received",
                                        files: [],
                                        upiId: "",
                                        error: "",
                                        submitting: false,
                                      });
                                      setShowReturnModal(true);
                                    }}
                                    className="bg-accent-gold hover:opacity-90 transition-opacity text-primary font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider"
                                  >
                                    Request Return
                                  </button>
                                )}

                                {returnMsg && (
                                  <span
                                    className={`px-2 py-1 rounded text-[10px] font-bold ${returnMsg.style}`}
                                  >
                                    {returnMsg.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-borderLight">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary font-semibold">
                  Saved Address Register
                </h3>
                <button
                  onClick={() => {
                    setEditingIndex(null);
                    setNewAddr({
                      fullName: "",
                      phone: "",
                      street: "",
                      city: "",
                      state: "",
                      pincode: "",
                      type: "Home",
                    });
                    setShowAddressForm(!showAddressForm);
                  }}
                  className="text-xs font-bold text-accent-gold hover:underline bg-transparent border-0 outline-none flex items-center gap-1"
                >
                  <RiAddLine size={14} /> Add New
                </button>
              </div>

              {/* Add New Address Form */}
              {showAddressForm && (
                <form
                  onSubmit={handleSaveAddressForm}
                  className="border border-borderLight p-6 rounded-sm space-y-4 bg-bgLight animate-fade-in max-w-lg mb-6"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
                    {editingIndex !== null
                      ? "Edit Saved Address"
                      : "New Saved Address"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      required
                      value={newAddr.fullName}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, fullName: e.target.value })
                      }
                      placeholder="e.g. John Doe"
                    />
                    <Input
                      label="Phone"
                      required
                      value={newAddr.phone}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, phone: e.target.value })
                      }
                      placeholder="e.g. +91 9782681155"
                    />
                  </div>

                  <Input
                    label="Street Address"
                    required
                    value={newAddr.street}
                    onChange={(e) =>
                      setNewAddr({ ...newAddr, street: e.target.value })
                    }
                    placeholder="House No, Building, Area"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="City"
                      required
                      value={newAddr.city}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, city: e.target.value })
                      }
                      placeholder="e.g. Jodhpur"
                    />
                    <Input
                      label="State"
                      required
                      value={newAddr.state}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, state: e.target.value })
                      }
                      placeholder="e.g. Rajasthan"
                    />
                    <Input
                      label="Pincode"
                      required
                      value={newAddr.pincode}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, pincode: e.target.value })
                      }
                      placeholder="e.g. 342001"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="text-xs text-textSecondary hover:underline"
                    >
                      Cancel
                    </button>
                    <Button type="submit" variant="secondary" size="xs">
                      Save Address
                    </Button>
                  </div>
                </form>
              )}

              {successMsg && (
                <p className="text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded">
                  {successMsg}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {addresses.length === 0 ? (
                  <p className="text-xs text-textSecondary col-span-2 py-4">
                    No saved addresses found. Add one to speed up checkout!
                  </p>
                ) : (
                  addresses.map((addr, aIdx) => (
                    <div
                      key={aIdx}
                      className="border border-borderLight p-6 rounded-sm relative bg-primary flex flex-col justify-between group"
                    >
                      <div>
                        <span className="absolute top-4 right-4 bg-secondary text-primary text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                          {addr.type || "Home"}
                        </span>
                        <h4 className="text-xs font-bold text-textPrimary mb-2">
                          {addr.fullName}
                        </h4>
                        <p className="text-xs text-textSecondary leading-relaxed mb-4">
                          {addr.street}, {addr.city}, {addr.state} -{" "}
                          {addr.pincode}
                        </p>
                        <p className="text-[10px] text-textSecondary font-semibold">
                          Contact: {addr.phone}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-borderLight flex justify-between items-center">
                        <button
                          onClick={() => handleEditAddress(aIdx)}
                          title="Edit Address"
                          className="text-accent-gold hover:underline bg-transparent border-0 flex items-center gap-1 text-[10px] font-bold"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(aIdx)}
                          title="Delete Address"
                          className="text-danger hover:text-red-700 bg-transparent border-0 flex items-center gap-1 text-[10px] font-bold"
                        >
                          <RiDeleteBinLine size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT INFO */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-3 border-b border-borderLight">
                Personal Settings
              </h3>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Pariwesh Customer"
                  />
                  <Input
                    label="Mobile Number (Read Only)"
                    readOnly
                    value={user?.phone || ""}
                    disabled
                  />
                </div>
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="customer@example.com"
                />

                {successMsg && (
                  <p className="text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded">
                    {successMsg}
                  </p>
                )}
                {errorMsg && (
                  <p className="text-xs text-danger font-bold bg-danger/10 px-3 py-2 rounded">
                    {errorMsg}
                  </p>
                )}

                <div className="pt-4">
                  <Button type="submit" variant="secondary" size="sm">
                    Save Profile Settings
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && returnForm.order && returnForm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-borderLight rounded-sm max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-fade-in my-8 text-textPrimary">
            <button
              onClick={() => setShowReturnModal(false)}
              className="absolute top-4 right-4 text-textSecondary hover:text-textPrimary"
            >
              <RiCloseLine size={20} />
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-textPrimary">
                Request Product Return
              </h3>
              <p className="text-[10px] text-textSecondary">
                Order ID: {returnForm.order.orderId}
              </p>
            </div>

            {/* Product details */}
            <div className="flex space-x-3 items-center bg-bgLight p-3 rounded border border-borderLight">
              <img
                src={optimizeCloudinaryUrl(
                  returnForm.item.image || "/hero.png",
                  200,
                )}
                alt={returnForm.item.name}
                className="w-12 h-14 object-cover rounded bg-primary border border-borderLight"
              />
              <div>
                <h4 className="text-xs font-bold text-textPrimary leading-snug">
                  {returnForm.item.name}
                </h4>
                <p className="text-[10px] text-textSecondary uppercase">
                  Size: {returnForm.item.size} | Qty:{" "}
                  {returnForm.item.quantity || returnForm.item.qty || 1} |
                  Price: ₹{returnForm.item.price}
                </p>
              </div>
            </div>

            {returnForm.error && (
              <div className="bg-danger/10 border border-danger/25 text-danger p-3 rounded text-xs">
                {returnForm.error}
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              {/* Reason */}
              <div className="space-y-1">
                <label className="block text-textSecondary font-semibold">
                  Reason for Return *
                </label>
                <select
                  value={returnForm.reason}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, reason: e.target.value })
                  }
                  className="w-full bg-bgLight border border-borderLight text-textPrimary rounded p-2.5 outline-none focus:border-accent-gold"
                  required
                >
                  <option value="Damaged Product Received">
                    Damaged Product Received
                  </option>
                  <option value="Wrong Product Received">
                    Wrong Product Received
                  </option>
                </select>
              </div>

              {/* COD UPI ID Input */}
              {returnForm.order.paymentMethod === "COD" && (
                <div className="space-y-2">
                  <Input
                    label="Refund UPI ID (for Bank Transfer) *"
                    required
                    value={returnForm.upiId}
                    onChange={(e) =>
                      setReturnForm({ ...returnForm, upiId: e.target.value })
                    }
                    placeholder="e.g. customer@upi"
                  />
                  <p className="text-[9px] text-textSecondary uppercase">
                    We will send the refund amount to this UPI ID after QC
                    verification passes.
                  </p>
                </div>
              )}

              {/* Upload Proof */}
              <div className="space-y-1">
                <label className="block text-textSecondary font-semibold">
                  Upload Evidence Proof (Max 3 Photos) *
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleReturnFileChange}
                  className="w-full bg-bgLight border border-borderLight text-textPrimary rounded p-2 outline-none cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-secondary file:text-primary file:cursor-pointer hover:file:opacity-90"
                  required={returnForm.files.length === 0}
                />

                {/* Uploaded Files Previews */}
                {returnForm.files.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {returnForm.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative w-12 h-12 border border-borderLight rounded overflow-hidden"
                      >
                        <img
                          src={file}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = returnForm.files.filter(
                              (_, i) => i !== idx,
                            );
                            setReturnForm({ ...returnForm, files: newFiles });
                          }}
                          className="absolute -top-1 -right-1 bg-danger text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  loading={returnForm.submitting}
                  className="flex-grow w-full py-2.5"
                >
                  Submit Return Request
                </Button>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="w-24 border border-borderLight text-textSecondary hover:text-textPrimary rounded bg-transparent"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
