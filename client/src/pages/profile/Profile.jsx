import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  RiOrderPlayLine,
  RiMapPinLine,
  RiUser3Line,
  RiLogoutBoxRLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import { logoutSuccess } from "../../redux/slices/authSlice.js";
import API from "../../services/api.js";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("orders"); // orders, addresses, info

  const handleSignOut = () => {
    dispatch(logoutSuccess());
    navigate("/");
  };

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

  const mockAddresses = [
    {
      id: "addr_1",
      name: "Priyanjali Sen",
      type: "Home",
      street: "H.No. 403, Primrose Residency, Sector 56",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122011",
      phone: "+91 9876543210",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar Panel */}
        <aside className="w-full lg:w-64 bg-primary border border-borderLight p-6 rounded-sm space-y-8 flex-shrink-0 text-textPrimary">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-textPrimary leading-none">
              {user?.name || "Priyanjali Sen"}
            </h2>
            <span className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold">
              Pariwesh Premium Member
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
                <button className="text-xs font-bold text-accent-gold hover:underline bg-transparent border-0 outline-none">
                  Add New
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mockAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-borderLight p-6 rounded-sm relative bg-primary"
                  >
                    <span className="absolute top-4 right-4 bg-secondary text-primary text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                      {addr.type}
                    </span>
                    <h4 className="text-xs font-bold text-textPrimary mb-2">
                      {addr.name}
                    </h4>
                    <p className="text-xs text-textSecondary leading-relaxed mb-4">
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-[10px] text-textSecondary font-semibold">
                      Contact: {addr.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT INFO */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-3 border-b border-borderLight">
                Personal Settings
              </h3>
              <form className="space-y-4 max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] uppercase font-bold text-textSecondary">
                      Full Name
                    </span>
                    <span className="bg-bgLight text-textPrimary text-xs px-4 py-3 border border-borderLight rounded-sm">
                      Priyanjali Sen
                    </span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] uppercase font-bold text-textSecondary">
                      Mobile Number
                    </span>
                    <span className="bg-bgLight text-textPrimary text-xs px-4 py-3 border border-borderLight rounded-sm">
                      +91 9876543210
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[9px] uppercase font-bold text-textSecondary">
                    Email Address
                  </span>
                  <span className="bg-bgLight text-textPrimary text-xs px-4 py-3 border border-borderLight rounded-sm">
                    priyanjali.sen@pariwesh.com
                  </span>
                </div>
                <div className="pt-4">
                  <Button variant="outline" size="sm">
                    Modify Profile Settings
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
