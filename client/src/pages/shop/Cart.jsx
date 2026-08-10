import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  RiDeleteBinLine,
  RiPercentLine,
  RiSecurePaymentLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/form/Input.jsx";
import {
  updateQuantityInCart,
  removeFromCart,
  clearCart,
} from "../../redux/slices/cartSlice.js";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import { updateProfile } from "../../redux/slices/authSlice.js";
import { syncCartNow } from "../../services/hydrateCommerce.js";
import SEO from "../../components/common/SEO.jsx";
import SpecialOffer from "../../components/SpecialOffer.jsx";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Cart = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const alert = (msg) => {
    showAlert(msg);
  };
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useSelector((state) => state.auth);

  const location = useLocation();
  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const isDirectCheckout = queryParams.get("checkout") === "true";

  // States code
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [selectedSpecialOffer, setSelectedSpecialOffer] = useState(null);
  const [deliveredCount, setDeliveredCount] = useState(0);

  // Checkout flow states
  const [checkoutStep, setCheckoutStep] = useState(isDirectCheckout && !!user);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
  });

  React.useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  React.useEffect(() => {
    const fetchOrderHistory = async () => {
      if (user?._id) {
        try {
          const res = await API.get("/orders");
          if (res.data && res.data.success) {
            const fetchedOrders = res.data.data;
            const count = fetchedOrders.filter(
              (ord) => ord.orderStatus === "Delivered",
            ).length;
            setDeliveredCount(count);
          }
        } catch (err) {
          console.error("Failed to fetch order history for offers:", err);
        }
      }
    };
    fetchOrderHistory();
  }, [user]);

  React.useEffect(() => {
    if (isDirectCheckout && cartItems.length > 0) {
      if (!user) {
        navigate("/login?redirect=cart");
      } else {
        setCheckoutStep(true);
      }
    }
  }, [isDirectCheckout, cartItems.length, user, navigate]);

  const getSubtotal = () => {
    return cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );
  };

  const handleQtyChange = (productId, variant, newQty) => {
    if (newQty < 1) return;
    dispatch(updateQuantityInCart({ productId, variant, quantity: newQty }));
    syncCartNow();
  };

  const handleRemove = (productId, variant) => {
    dispatch(removeFromCart({ productId, variant }));
    syncCartNow();
  };

  const applyPromoCode = async () => {
    try {
      setCouponError("");
      const sub = getSubtotal();
      const res = await API.post("/coupons/validate", {
        code: coupon,
        subtotal: sub,
        phone: address.phone || undefined,
      });

      if (res.data && res.data.success) {
        const { discountAmount } = res.data.data;
        setDiscount(discountAmount);
        setCouponApplied(true);
        setCouponError("");
      } else {
        setCouponError("Invalid coupon code!");
        setDiscount(0);
        setCouponApplied(false);
      }
    } catch (err) {
      console.error("Coupon validation error:", err);
      setCouponError(err.response?.data?.message || "Invalid coupon code!");
      setDiscount(0);
      setCouponApplied(false);
    }
  };

  const handleAddressInput = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameBlur = async () => {
    if (user && address.fullName && address.fullName !== user.name) {
      try {
        const res = await API.put("/users/profile", {
          name: address.fullName,
        });
        if (res.data && res.data.success) {
          dispatch(updateProfile(res.data.data));
        }
      } catch (err) {
        console.error("Failed auto-updating user profile name:", err);
      }
    }
  };

  React.useEffect(() => {
    if (orderSuccess) {
      window.scrollTo(0, 0);
    }
  }, [orderSuccess]);

  const finalizeOrderSuccess = async (orderId, paid = false) => {
    setPlacedOrderId(orderId);
    setPaymentConfirmed(paid);
    setOrderSuccess(true);
    dispatch(clearCart());
    syncCartNow();

    if (user && address.fullName && address.fullName !== user.name) {
      try {
        await API.put("/users/profile", {
          name: address.fullName,
        });
        dispatch(updateProfile({ name: address.fullName }));
      } catch (nameErr) {
        console.error("Failed updating name during order placement:", nameErr);
      }
    }

    if (user) {
      const currentAddresses = user.addresses || [];
      const addressToSave = {
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        type: "Home",
      };
      const alreadyExists = currentAddresses.some(
        (addr) =>
          addr.street?.toLowerCase() === address.street?.toLowerCase() &&
          addr.pincode === address.pincode,
      );
      if (!alreadyExists) {
        try {
          const profileRes = await API.put("/users/profile", {
            addresses: [...currentAddresses, addressToSave],
          });
          if (profileRes.data && profileRes.data.success) {
            dispatch(updateProfile(profileRes.data.data));
          }
        } catch (addrErr) {
          console.error(
            "Failed to automatically save order address to profile:",
            addrErr,
          );
        }
      }
    }
  };

  const openRazorpayCheckout = async (checkout, orderId) => {
    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) {
      showAlert(
        `Order ${orderId} placed but Razorpay SDK failed to load. Payment is Pending.`,
        "Payment SDK Error",
      );
      await finalizeOrderSuccess(orderId, false);
      return;
    }

    return new Promise((resolve) => {
      const rzp = new window.Razorpay({
        key: checkout.key,
        amount: checkout.amount,
        currency: checkout.currency || "INR",
        name: checkout.name || "PARIWESH",
        description: checkout.description || `Order ${orderId}`,
        order_id: checkout.razorpayOrderId,
        prefill: checkout.prefill || {},
        theme: { color: "#C5A880" },
        handler: async (response) => {
          try {
            const verifyRes = await API.post("/payments/razorpay/verify", {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data?.success) {
              await finalizeOrderSuccess(orderId, true);
              resolve(true);
            } else {
              showAlert(
                verifyRes.data?.message || "Payment verification failed",
                "Payment Failed",
              );
              await finalizeOrderSuccess(orderId, false);
              resolve(false);
            }
          } catch (err) {
            showAlert(
              err.response?.data?.message || "Payment verification failed",
              "Payment Failed",
            );
            // Server may already have emailed on signature failure (400)
            if (err.response?.status !== 400) {
              try {
                await API.post("/payments/razorpay/failed", {
                  orderId,
                  reason:
                    err.response?.data?.message ||
                    "Payment verification failed",
                });
              } catch (_) {
                /* ignore */
              }
            }
            await finalizeOrderSuccess(orderId, false);
            resolve(false);
          }
        },
        modal: {
          ondismiss: async () => {
            showAlert(
              `Payment cancelled. Order ${orderId} is saved. Check your email for details.`,
              "Payment Pending",
            );
            try {
              await API.post("/payments/razorpay/failed", {
                orderId,
                reason: "Payment cancelled by user at Razorpay checkout",
              });
            } catch (_) {
              /* ignore */
            }
            await finalizeOrderSuccess(orderId, false);
            resolve(false);
          },
        },
      });
      rzp.open();
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!user) {
      showAlert("Please login to place your order.", "Login Required");
      navigate("/login?redirect=cart");
      return;
    }

    if (
      !address.fullName ||
      !address.phone ||
      !address.street ||
      !address.pincode
    ) {
      showAlert(
        "Please fill out all mandatory shipping details.",
        "Shipping Info Missing",
      );
      return;
    }

    try {
      setLoading(true);

      if (couponApplied) {
        try {
          await API.post("/coupons/validate", {
            code: coupon.trim().toUpperCase(),
            subtotal: getSubtotal(),
            phone: address.phone,
          });
        } catch (couponErr) {
          showAlert(
            `Coupon Validation Failed: ${couponErr.response?.data?.message || "Usage limit exceeded or coupon expired."}`,
            "Invalid Coupon",
          );
          setCouponApplied(false);
          setDiscount(0);
          setLoading(false);
          return;
        }
      }

      const orderItemsPayload = cartItems.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        quantity: item.quantity,
        size: item.variant.size,
        color: item.variant.color,
        image: item.product.images[0],
      }));

      const payload = {
        items: orderItemsPayload,
        shippingAddress: address,
        pricing: {
          subtotal,
          delivery,
          gst,
          discount: finalDiscount,
          grandTotal,
          appliedCoupon: couponApplied ? coupon.trim().toUpperCase() : "",
          specialOffer:
            !couponApplied && selectedSpecialOffer
              ? {
                  type: selectedSpecialOffer.type,
                  discountPercent: selectedSpecialOffer.discountPercent,
                }
              : undefined,
        },
        paymentMethod: address.paymentMethod,
        customer: {
          userId: user._id,
          name: address.fullName,
          phone: address.phone,
          email: user.email || "",
        },
      };

      const res = await API.post("/orders", payload);

      if (res.data && res.data.success) {
        const orderData = res.data.data;
        const orderId = orderData.orderId;

        if (address.paymentMethod === "ONLINE" && orderData.razorpayCheckout) {
          await openRazorpayCheckout(orderData.razorpayCheckout, orderId);
        } else {
          if (
            address.paymentMethod === "ONLINE" &&
            !orderData.razorpayCheckout
          ) {
            showAlert(
              res.data.message ||
                "Order placed. Add real Razorpay keys in server/.env to enable online pay.",
              "Payment Pending",
            );
          }
          await finalizeOrderSuccess(orderId, false);
        }
      } else {
        showAlert("Failed to place order. Please try again.", "Order Failed");
      }
    } catch (error) {
      console.error("Failed placing order:", error);
      if (error.response?.status === 401) {
        showAlert("Please login to place your order.", "Login Required");
        navigate("/login?redirect=cart");
      } else {
        showAlert(
          error.response?.data?.message ||
            "Error placing order. Please try again.",
          "Order Process Error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const delivery = subtotal >= 1500 || subtotal === 0 ? 0 : 45;
  const finalDiscount = couponApplied
    ? discount
    : selectedSpecialOffer
      ? Math.round(subtotal * (selectedSpecialOffer.discountPercent / 100))
      : 0;
  const discountRatio = subtotal > 0 ? finalDiscount / subtotal : 0;
  const gst = Math.round(
    cartItems.reduce((acc, item) => {
      const itemSubtotal = item.product.price * item.quantity;
      const discountedItemSubtotal = itemSubtotal * (1 - discountRatio);
      const itemGstRate = item.product.gst || 0;
      return acc + discountedItemSubtotal * (itemGstRate / (100 + itemGstRate));
    }, 0),
  );
  const grandTotal = subtotal + delivery - finalDiscount;

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in relative z-10">
        <SEO title="Order Confirmed" noindex={true} />
        <div className="w-20 h-20 bg-success/10 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <RiCheckboxCircleLine size={48} />
        </div>
        <h2 className="text-3xl font-display font-medium text-textPrimary uppercase tracking-wider">
          Order Placed Successfully!
        </h2>
        {placedOrderId && (
          <p className="text-sm font-bold text-accent-gold uppercase tracking-widest bg-secondary py-2.5 px-5 rounded-sm inline-block border border-accent-gold/20 shadow-lg">
            Order ID: {placedOrderId}
          </p>
        )}
        <p className="text-sm text-textSecondary leading-relaxed">
          Thank you for choosing PARIWESH. Your premium wardrobe ensemble has
          been booked! We have sent a confirmation details invoice to your email
          interface.
        </p>
        <div className="bg-bgLight p-6 border border-borderLight rounded-sm text-xs text-left space-y-2">
          <p>
            <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
              Deliver to:
            </span>{" "}
            {address.fullName}
          </p>
          <p>
            <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
              Address:
            </span>{" "}
            {address.street}, {address.city}, {address.state} -{" "}
            {address.pincode}
          </p>
          <p>
            <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
              Payment Class:
            </span>{" "}
            {address.paymentMethod}
            {address.paymentMethod === "ONLINE"
              ? paymentConfirmed
                ? " (Paid)"
                : " (Payment Pending)"
              : " (Pending Collection)"}
          </p>
        </div>
        <div className="pt-6 flex justify-center">
          <Link to="/shop">
            <Button variant="primary" size="md">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <SEO title="Empty Bag" noindex={true} />
        <h2 className="text-3xl font-display font-medium text-textPrimary uppercase tracking-wider">
          Your bag is empty
        </h2>
        <p className="text-xs text-textSecondary">
          Looks like you haven't added any luxury ensembles to your shopping bag
          yet.
        </p>
        <div className="pt-4 flex justify-center">
          <Link to="/shop">
            <Button variant="primary" size="md">
              Browse Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO
        title={
          checkoutStep ? "Secure Payment Checkout" : "Shopping Bag Collection"
        }
        noindex={true}
      />
      <h1 className="text-3xl font-display font-medium uppercase tracking-wider text-textPrimary mb-10">
        Shopping Bag Ensembles
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-fade-in">
        {/* LEFT COMPONENT COLUMN (Cart Items List vs Address details checkout step) */}
        {!checkoutStep ? (
          <div className="lg:col-span-8 bg-primary border border-borderLight p-6 sm:p-8 rounded-sm space-y-6">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-4 border-b border-borderLight">
              Selected Ensembles
            </h3>
            <div className="divide-y divide-borderLight">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                  {/* Photo & Specs details */}
                  <div className="flex space-x-4 items-center">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-24 object-cover bg-bgLight rounded border border-borderLight"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4
                        className="text-sm font-semibold text-textPrimary leading-snug truncate"
                        title={item.product.name}
                      >
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-textSecondary uppercase font-medium">
                        Size:{" "}
                        <span className="text-textPrimary font-bold">
                          {item.variant.size}
                        </span>{" "}
                        | Color:{" "}
                        <span className="text-textPrimary font-bold">
                          {item.variant.color}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-textPrimary">
                        ₹{item.product.price}
                      </p>
                    </div>
                  </div>

                  {/* Quantity and absolute actions triggers */}
                  <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="inline-flex border border-borderLight rounded-sm bg-bgLight">
                      <button
                        onClick={() =>
                          handleQtyChange(
                            item.product._id,
                            item.variant,
                            item.quantity - 1,
                          )
                        }
                        className="px-3 py-1.5 hover:bg-borderLight/30 text-xs font-bold text-textPrimary"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-xs font-bold text-textPrimary">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQtyChange(
                            item.product._id,
                            item.variant,
                            item.quantity + 1,
                          )
                        }
                        className="px-3 py-1.5 hover:bg-borderLight/30 text-xs font-bold text-textPrimary"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        handleRemove(item.product._id, item.variant)
                      }
                      className="text-textSecondary hover:text-danger hover:scale-110 transition-all p-2 rounded-full hover:bg-danger/10"
                    >
                      <RiDeleteBinLine size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Address forms */
          <form
            onSubmit={handlePlaceOrder}
            className="lg:col-span-8 bg-primary border border-borderLight p-6 sm:p-8 rounded-sm space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-borderLight">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary">
                Shipping & Billing Address
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutStep(false)}
                className="text-xs font-bold text-accent-gold hover:underline bg-transparent border-0 outline-none"
              >
                Back To Bag
              </button>
            </div>

            {user?.addresses && user.addresses.length > 0 && (
              <div className="bg-bgLight p-4 border border-borderLight rounded-sm space-y-3">
                <span className="block text-[9px] uppercase font-bold text-textSecondary tracking-wider">
                  Quick Select Saved Address
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.addresses.map((addr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAddress((prev) => ({
                          ...prev,
                          fullName: addr.fullName,
                          phone: addr.phone,
                          street: addr.street,
                          city: addr.city,
                          state: addr.state,
                          pincode: addr.pincode,
                        }));
                      }}
                      className="text-left border border-borderLight hover:border-accent-gold p-3 bg-primary text-xs rounded-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-bold flex justify-between items-center text-textPrimary">
                          <span>{addr.fullName}</span>
                          <span className="text-[8px] bg-secondary text-primary px-1.5 py-0.5 rounded uppercase font-bold">
                            {addr.type || "Home"}
                          </span>
                        </div>
                        <p className="text-[10px] text-textSecondary mt-1 leading-snug">
                          {addr.street}, {addr.city}, {addr.state} -{" "}
                          {addr.pincode}
                        </p>
                      </div>
                      <span className="text-[9px] text-accent-gold font-bold mt-2">
                        Use this address
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                required
                value={address.fullName}
                onChange={handleAddressInput}
                onBlur={handleNameBlur}
                placeholder="e.g. Pariwesh Customer"
                autoComplete="name"
              />
              <Input
                label="Mobile Contact Number"
                name="phone"
                required
                value={address.phone}
                onChange={handleAddressInput}
                placeholder="e.g. +91 9782681155"
                autoComplete="tel"
              />
            </div>

            <Input
              label="Street Address"
              name="street"
              required
              value={address.street}
              onChange={handleAddressInput}
              placeholder="House No, Building name, Sector/Street details"
              autoComplete="street-address"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                value={address.city}
                onChange={handleAddressInput}
                placeholder="e.g. New Delhi"
                autoComplete="address-level2"
              />
              <Input
                label="State"
                name="state"
                value={address.state}
                onChange={handleAddressInput}
                placeholder="e.g. Delhi"
                autoComplete="address-level1"
              />
              <Input
                label="Pincode"
                name="pincode"
                required
                value={address.pincode}
                onChange={handleAddressInput}
                placeholder="e.g. 110001"
                autoComplete="postal-code"
              />
            </div>

            {/* Select Method */}
            <div className="space-y-3 pt-4 border-t border-borderLight">
              <span className="block text-[10px] uppercase font-display font-bold tracking-wider text-textSecondary">
                Select Payment Channel
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                    address.paymentMethod === "COD"
                      ? "border-accent-gold bg-accent-gold/5"
                      : "border-borderLight bg-primary"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-textPrimary">
                      Cash On Delivery
                    </span>
                    <span className="block text-[9px] text-textSecondary">
                      Pay cash on arrival
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={address.paymentMethod === "COD"}
                    onChange={(e) =>
                      setAddress({ ...address, paymentMethod: e.target.value })
                    }
                    className="accent-accent-gold"
                  />
                </label>

                <label
                  className={`p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                    address.paymentMethod === "ONLINE"
                      ? "border-accent-gold bg-accent-gold/5"
                      : "border-borderLight bg-primary"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-textPrimary">
                      Online Security (Razorpay)
                    </span>
                    <span className="block text-[9px] text-textSecondary">
                      Cards, UPI, Netbanking via Razorpay
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={address.paymentMethod === "ONLINE"}
                    onChange={(e) =>
                      setAddress({ ...address, paymentMethod: e.target.value })
                    }
                    className="accent-accent-gold"
                  />
                </label>
              </div>
            </div>

            {/* Special Offers Section */}
            {user && (
              <div className="pt-4 border-t border-borderLight">
                <SpecialOffer
                  paymentMethod={address.paymentMethod}
                  deliveredCount={deliveredCount}
                  subtotal={subtotal}
                  couponApplied={couponApplied}
                  onOfferChange={setSelectedSpecialOffer}
                />
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full truncate px-2"
              disabled={loading}
            >
              {loading ? "Placing Order..." : "Confirm & Book Order Ensembles"}
            </Button>
          </form>
        )}

        {/* RIGHT ORDER SUMMARY SECTION */}
        <aside className="lg:col-span-4 bg-primary border border-borderLight p-6 rounded-sm space-y-6">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-4 border-b border-borderLight">
            Pricing Ledger
          </h3>

          {/* Coupon inputs code */}
          {!checkoutStep && (
            <div className="space-y-3">
              <span className="block text-[10px] uppercase font-bold tracking-widest text-textSecondary">
                Coupon Promo Code
              </span>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter e.g. PARIWESHGOLD"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  disabled={couponApplied}
                  className="bg-bgLight text-textPrimary px-3 py-2 text-xs rounded-sm border border-borderLight focus:border-accent-gold focus:outline-none w-full uppercase"
                />
                <button
                  onClick={applyPromoCode}
                  disabled={couponApplied}
                  className="bg-secondary text-primary hover:bg-accent-gold hover:text-secondary px-4 py-2 text-xs font-bold uppercase rounded-sm tracking-wider transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {couponApplied && (
                <p className="text-[10px] text-green-600 font-medium flex items-center space-x-1">
                  <span>
                    ✔ Coupon {coupon.trim().toUpperCase()} applied! ₹{discount}{" "}
                    discount registered.
                  </span>
                </p>
              )}
              {couponError && (
                <p className="text-[10px] text-danger font-medium">
                  {couponError}
                </p>
              )}
            </div>
          )}

          {/* Lines detailing billing */}
          <div className="space-y-3.5 text-xs text-textSecondary font-medium">
            <div className="flex justify-between">
              <span>Cart Subtotal</span>
              <span className="text-textPrimary font-bold">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span>
                {delivery === 0 ? (
                  <span className="text-green-600 font-bold">FREE</span>
                ) : (
                  `₹${delivery}`
                )}
              </span>
            </div>
            {finalDiscount > 0 && (
              <div className="flex justify-between text-green-600 bg-success/10 p-2 rounded">
                <span>
                  {couponApplied ? "Coupon Discount" : "Special Offer Discount"}
                </span>
                <span className="font-bold">-₹{finalDiscount}</span>
              </div>
            )}

            <div className="border-t border-borderLight pt-4 flex justify-between text-sm font-bold text-textPrimary leading-normal">
              <span>Total Payable</span>
              <span className="text-accent-gold font-display font-semibold text-lg">
                ₹{grandTotal}
              </span>
            </div>
          </div>

          {/* Main button drawer toggling step */}
          {!checkoutStep ? (
            <Button
              onClick={() => {
                if (!user) {
                  navigate("/login?redirect=cart");
                } else {
                  setCheckoutStep(true);
                }
              }}
              variant="primary"
              size="lg"
              className="w-full space-x-2"
            >
              <RiSecurePaymentLine size={16} />
              <span>Checkout Address details</span>
            </Button>
          ) : (
            <div className="text-[9px] text-center text-textSecondary leading-relaxed">
              Protected by SSL encryption. All transactions are securely
              verified.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Cart;
