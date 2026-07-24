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
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import { logoutSuccess, updateProfile } from "../../redux/slices/authSlice.js";
import API from "../../services/api.js";

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

  // Dynamic order registry loading from backend
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
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
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchUserOrders();
  }, [user]);

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

  // Add new address to database profile log
  const handleAddAddress = async (e) => {
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
      const updatedAddresses = [...addresses, newAddr];
      const res = await API.put("/users/profile", {
        addresses: updatedAddresses,
      });
      if (res.data && res.data.success) {
        dispatch(updateProfile(res.data.data));
        setAddresses(res.data.data.addresses || []);
        setShowAddressForm(false);
        setNewAddr({
          fullName: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          pincode: "",
          type: "Home",
        });
        setSuccessMsg("Address added successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save address.");
    }
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
                  <p className="text-xs text-textSecondary text-center py-6 animate-pulse">
                    Loading your order history...
                  </p>
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
                                ? "bg-green-55/10 text-green-600"
                                : "bg-blue-55/10 text-blue-600"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>
                      {/* Items lists */}
                      <div className="p-6 divide-y divide-borderLight">
                        {ord.items.map((it, iIdx) => (
                          <div
                            key={iIdx}
                            className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                          >
                            <div className="flex space-x-3 items-center">
                              <img
                                src={
                                  it.image ||
                                  "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=200&auto=format&fit=crop"
                                }
                                alt={it.name}
                                className="w-12 h-14 object-cover bg-bgLight border border-borderLight rounded"
                              />
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-textPrimary leading-snug">
                                  {it.name}
                                </h4>
                                <p className="text-[10px] text-textSecondary uppercase">
                                  Size: {it.size} | Qty: {it.quantity || it.qty}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-textPrimary">
                              ₹{it.price}
                            </span>
                          </div>
                        ))}
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
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="text-xs font-bold text-accent-gold hover:underline bg-transparent border-0 outline-none flex items-center gap-1"
                >
                  <RiAddLine size={14} /> Add New
                </button>
              </div>

              {/* Add New Address Form */}
              {showAddressForm && (
                <form
                  onSubmit={handleAddAddress}
                  className="border border-borderLight p-6 rounded-sm space-y-4 bg-bgLight animate-fade-in max-w-lg mb-6"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
                    New Saved Address
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] uppercase font-bold text-textSecondary">
                        Full Name
                      </span>
                      <input
                        type="text"
                        required
                        value={newAddr.fullName}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, fullName: e.target.value })
                        }
                        className="bg-primary text-textPrimary text-xs px-3 py-2 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] uppercase font-bold text-textSecondary">
                        Phone
                      </span>
                      <input
                        type="text"
                        required
                        value={newAddr.phone}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, phone: e.target.value })
                        }
                        className="bg-primary text-textPrimary text-xs px-3 py-2 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] uppercase font-bold text-textSecondary">
                      Street Address
                    </span>
                    <input
                      type="text"
                      required
                      value={newAddr.street}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, street: e.target.value })
                      }
                      className="bg-primary text-textPrimary text-xs px-3 py-2 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] uppercase font-bold text-textSecondary">
                        City
                      </span>
                      <input
                        type="text"
                        required
                        value={newAddr.city}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, city: e.target.value })
                        }
                        className="bg-primary text-textPrimary text-xs px-3 py-2 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] uppercase font-bold text-textSecondary">
                        State
                      </span>
                      <input
                        type="text"
                        required
                        value={newAddr.state}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, state: e.target.value })
                        }
                        className="bg-primary text-textPrimary text-xs px-3 py-2 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] uppercase font-bold text-textSecondary">
                        Pincode
                      </span>
                      <input
                        type="text"
                        required
                        value={newAddr.pincode}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, pincode: e.target.value })
                        }
                        className="bg-primary text-textPrimary text-xs px-3 py-2 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                      />
                    </div>
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
                      <div className="mt-4 pt-3 border-t border-borderLight flex justify-end">
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
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] uppercase font-bold text-textSecondary">
                      Full Name
                    </span>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Pariwesh Customer"
                      className="bg-primary text-textPrimary text-xs px-4 py-3 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] uppercase font-bold text-textSecondary">
                      Mobile Number (Read Only)
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={user?.phone || ""}
                      className="bg-bgLight text-textSecondary text-xs px-4 py-3 border border-borderLight rounded-sm outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[9px] uppercase font-bold text-textSecondary">
                    Email Address
                  </span>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="bg-primary text-textPrimary text-xs px-4 py-3 border border-borderLight rounded-sm focus:border-accent-gold outline-none"
                  />
                </div>

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
    </div>
  );
};

export default Profile;
