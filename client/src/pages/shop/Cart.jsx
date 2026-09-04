import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  RiDeleteBinLine,
  RiPercentLine,
  RiSecurePaymentLine,
  RiCheckboxCircleLine,
  RiShieldCheckLine,
  RiRefreshLine,
  RiTruckLine,
  RiShoppingBagLine,
} from "react-icons/ri";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/form/Input.jsx";
import {
  updateQuantityInCart,
  removeFromCart,
  clearCart,
  removePurchasedItems,
} from "../../redux/slices/cartSlice.js";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import { updateProfile } from "../../redux/slices/authSlice.js";
import { syncCartNow } from "../../services/hydrateCommerce.js";
import {
  trackInitiateCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  getMetaTrackingCookies,
} from "../../services/metaPixel.js";
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

const formatCurrency = (val) => {
  const num = Math.round(Number(val) || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

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

  // Buy Now Search and parsing logic
  const isBuyNow = queryParams.get("buyNow") === "true";
  const buyNowProductId = queryParams.get("productId");
  const buyNowSize = queryParams.get("size");
  const buyNowColor = queryParams.get("color");
  const buyNowQty = Number(queryParams.get("qty")) || 1;

  const getItemKey = (item) => {
    const pId = item.product?._id || item.product;
    const size = item.variant?.size || "M";
    const color = item.variant?.color || "Default";
    return `${pId}_${size}_${color}`;
  };

  const buyNowKey = React.useMemo(() => {
    if (isBuyNow && buyNowProductId) {
      return `${buyNowProductId}_${buyNowSize || "M"}_${buyNowColor || "Default"}`;
    }
    return null;
  }, [isBuyNow, buyNowProductId, buyNowSize, buyNowColor]);

  const [selectedKeys, setSelectedKeys] = useState([]);

  React.useEffect(() => {
    if (isBuyNow && buyNowKey) {
      setSelectedKeys([buyNowKey]);
    } else if (!isBuyNow) {
      setSelectedKeys(cartItems.map(getItemKey));
    }
  }, [isBuyNow, buyNowKey, cartItems.length]);

  const selectedItems = React.useMemo(() => {
    return cartItems.filter((item) => {
      const key = getItemKey(item);
      return isBuyNow ? key === buyNowKey : selectedKeys.includes(key);
    });
  }, [cartItems, isBuyNow, buyNowKey, selectedKeys]);

  // States code
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCouponDetails, setAppliedCouponDetails] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [selectedSpecialOffer, setSelectedSpecialOffer] = useState(null);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [failedOrder, setFailedOrder] = useState(null);

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
        navigate(
          "/login?redirect=" +
            encodeURIComponent(location.pathname + location.search),
        );
      } else {
        setCheckoutStep(true);
      }
    }
  }, [isDirectCheckout, cartItems.length, user, navigate, location]);

  const getSubtotal = () => {
    return selectedItems.reduce((acc, item) => {
      const qty =
        isBuyNow && getItemKey(item) === buyNowKey ? buyNowQty : item.quantity;
      return acc + item.product.price * qty;
    }, 0);
  };

  const getTotalQuantity = () => {
    return selectedItems.reduce((acc, item) => {
      const qty =
        isBuyNow && getItemKey(item) === buyNowKey ? buyNowQty : item.quantity;
      return acc + (Number(qty) || 1);
    }, 0);
  };

  const getItemsPayload = () => {
    return selectedItems.map((item) => {
      const qty =
        isBuyNow && getItemKey(item) === buyNowKey ? buyNowQty : item.quantity;
      return {
        productId: item.product?._id || item.product,
        quantity: Number(qty) || 1,
        price: item.product?.price,
      };
    });
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
    const cleanCode = coupon ? coupon.trim().toUpperCase() : "";
    if (!cleanCode) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      setCouponError("");
      const sub = getSubtotal();
      const totalQty = getTotalQuantity();
      const itemsPayload = getItemsPayload();

      const res = await API.post("/coupons/validate", {
        code: cleanCode,
        subtotal: sub,
        quantity: totalQty,
        items: itemsPayload,
        phone: address.phone || user?.phone || undefined,
        paymentMethod: address.paymentMethod,
      });

      if (res.data && res.data.success) {
        const couponData = res.data.data;
        const discAmount = couponData.discountAmount || 0;
        setDiscount(discAmount);
        setAppliedCouponDetails(couponData);
        setCouponApplied(true);
        setCouponError("");
      } else {
        setCouponError("Invalid coupon code!");
        setDiscount(0);
        setAppliedCouponDetails(null);
        setCouponApplied(false);
      }
    } catch (err) {
      console.warn("Coupon validation feedback:", err.response?.data?.message || err.message);
      setCouponError(err.response?.data?.message || "Invalid coupon code!");
      setDiscount(0);
      setAppliedCouponDetails(null);
      setCouponApplied(false);
    }
  };

  // Auto-validate active coupon requirements if items change in cart
  React.useEffect(() => {
    if (couponApplied && appliedCouponDetails) {
      const currentQty = getTotalQuantity();
      const currentSub = getSubtotal();

      if (appliedCouponDetails.minQuantity && currentQty < appliedCouponDetails.minQuantity) {
        setCouponApplied(false);
        setDiscount(0);
        setAppliedCouponDetails(null);
        setCouponError(
          `Coupon ${appliedCouponDetails.code} removed: requires minimum of ${appliedCouponDetails.minQuantity} items.`
        );
      } else if (appliedCouponDetails.minAmount && currentSub < appliedCouponDetails.minAmount) {
        setCouponApplied(false);
        setDiscount(0);
        setAppliedCouponDetails(null);
        setCouponError(
          `Coupon ${appliedCouponDetails.code} removed: requires minimum order amount of ₹${appliedCouponDetails.minAmount}.`
        );
      }
    }
  }, [selectedItems, couponApplied, appliedCouponDetails, isBuyNow, buyNowKey, buyNowQty]);

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

  const finalizeOrderSuccess = async (
    orderId,
    paid = false,
    purchased = null,
  ) => {
    setPlacedOrderId(orderId);
    setPaymentConfirmed(paid);
    setOrderSuccess(true);

    // Track Purchase event with built-in SessionStorage refresh guard
    trackPurchase({
      orderId,
      value: grandTotal,
      items: purchased && purchased.length > 0 ? purchased : cartItems,
      paymentMethod: address.paymentMethod,
    });

    const shouldClear = paid || address.paymentMethod === "COD";
    if (shouldClear) {
      if (purchased && purchased.length > 0) {
        dispatch(removePurchasedItems(purchased));
      } else {
        dispatch(clearCart());
      }
      syncCartNow();
    }

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

  const openRazorpayCheckout = async (checkout, orderId, purchasedItems) => {
    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) {
      showAlert(
        `Order ${orderId} placed but Razorpay SDK failed to load. Please retry payment.`,
        "Payment SDK Error",
      );
      setFailedOrder({
        orderId,
        razorpayCheckout: checkout,
        orderItemsPayload: purchasedItems,
      });
      return false;
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
              metaTracking: getMetaTrackingCookies(),
            });
            if (verifyRes.data?.success) {
              await finalizeOrderSuccess(orderId, true, purchasedItems);
              resolve(true);
            } else {
              showAlert(
                verifyRes.data?.message || "Payment verification failed",
                "Payment Failed",
              );
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
            quantity: getTotalQuantity(),
            items: getItemsPayload(),
            phone: address.phone || user?.phone || undefined,
            paymentMethod: address.paymentMethod,
          });
        } catch (couponErr) {
          showAlert(
            `Coupon Validation Failed: ${couponErr.response?.data?.message || "Usage limit exceeded or coupon expired."}`,
            "Invalid Coupon",
          );
          setCouponApplied(false);
          setAppliedCouponDetails(null);
          setDiscount(0);
          setLoading(false);
          return;
        }
      }

      const orderItemsPayload = selectedItems.map((item) => {
        const qty =
          isBuyNow && getItemKey(item) === buyNowKey
            ? buyNowQty
            : item.quantity;
        return {
          productId: item.product._id,
          name: item.product.name,
          sku: item.product.sku,
          price: item.product.price,
          quantity: qty,
          size: item.variant.size,
          color: item.variant.color,
          image: item.product.images[0],
        };
      });

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
            (selectedSpecialOffer?.type === "PREPAID_5" || !couponApplied) &&
            selectedSpecialOffer
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
        metaTracking: getMetaTrackingCookies(),
      };

      const res = await API.post("/orders", payload);

      if (res.data && res.data.success) {
        const orderData = res.data.data;
        const orderId = orderData.orderId;

        if (address.paymentMethod === "ONLINE" && orderData.razorpayCheckout) {
          const success = await openRazorpayCheckout(
            orderData.razorpayCheckout,
            orderId,
            orderItemsPayload,
          );
          if (!success) {
            setFailedOrder({
              orderId,
              razorpayCheckout: orderData.razorpayCheckout,
              orderItemsPayload,
            });
            return;
          }
        } else if (
          address.paymentMethod === "ONLINE" &&
          !orderData.razorpayCheckout
        ) {
          showAlert(
            res.data.message ||
              "Order placed but online payment gateway is currently unavailable. Please contact support or pay via COD.",
            "Payment Gateway Unavailable",
          );
          setFailedOrder({
            orderId,
            razorpayCheckout: null,
            orderItemsPayload,
          });
        } else {
          // Cash On Delivery (COD) Order
          await finalizeOrderSuccess(orderId, false, orderItemsPayload);
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
  let tempDiscount = 0;
  if (couponApplied) {
    if (appliedCouponDetails && appliedCouponDetails.discountType === "Percentage") {
      let calc = Math.round(subtotal * (appliedCouponDetails.value / 100));
      if (appliedCouponDetails.maxDiscount && appliedCouponDetails.maxDiscount > 0) {
        calc = Math.min(calc, appliedCouponDetails.maxDiscount);
      }
      tempDiscount += calc;
    } else {
      tempDiscount += discount;
    }
  }
  if (selectedSpecialOffer) {
    if (selectedSpecialOffer.type === "PREPAID_5" || !couponApplied) {
      tempDiscount += Math.round(
        subtotal * (selectedSpecialOffer.discountPercent / 100),
      );
    }
  }
  const finalDiscount = tempDiscount;
  const discountRatio = subtotal > 0 ? finalDiscount / subtotal : 0;
  const gst = Math.round(
    selectedItems.reduce((acc, item) => {
      const qty =
        isBuyNow && getItemKey(item) === buyNowKey ? buyNowQty : item.quantity;
      const itemSubtotal = item.product.price * qty;
      const discountedItemSubtotal = itemSubtotal * (1 - discountRatio);
      const itemGstRate = item.product.gst || 0;
      return acc + discountedItemSubtotal * (itemGstRate / (100 + itemGstRate));
    }, 0),
  );
  const grandTotal = subtotal + delivery - finalDiscount;

  // Track InitiateCheckout when entering the address/checkout step
  React.useEffect(() => {
    if (checkoutStep && selectedItems.length > 0 && !orderSuccess) {
      trackInitiateCheckout(selectedItems, grandTotal);
    }
  }, [checkoutStep]);

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
      <div className="max-w-2xl mx-auto px-4 py-28 text-center space-y-7">
        <SEO title="Empty Bag" noindex={true} />
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border border-accent-gold/40 flex items-center justify-center text-accent-gold shadow-sm">
          <RiShoppingBagLine size={36} />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] text-[#8a1c14] tracking-[0.25em] uppercase font-bold">
            ✦ Your Royal Wardrobe Awaits ✦
          </span>
          <h2 className="text-3xl font-serif font-medium text-slate-900 tracking-wide">
            Your Bag is Empty
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Discover our artisanal festive sets, pure cotton embroidered farshi ensembles, and signature kurtas crafted for royal grace.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link to="/shop">
            <Button variant="gold" size="lg" className="rounded-xl px-8 shadow-md">
              Explore Collections
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEO
        title={
          checkoutStep ? "Secure Payment Checkout" : "Shopping Bag Collection"
        }
        noindex={true}
      />

      {/* 3-STEP LUXURY CHECKOUT STEPPER */}
      <div className="max-w-md mx-auto mb-10 px-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-6 right-6 h-[2px] bg-slate-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-4 left-6 h-[2px] bg-accent-gold -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: checkoutStep ? "100%" : "50%" }}
          />

          {/* Step 1: Bag */}
          <div className="relative z-10 flex flex-col items-center space-y-1.5 cursor-pointer" onClick={() => setCheckoutStep(false)}>
            <div className="w-8 h-8 rounded-full bg-accent-gold text-white font-bold text-xs flex items-center justify-center shadow-md ring-4 ring-amber-50">
              1
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-800">
              Shopping Bag
            </span>
          </div>

          {/* Step 2: Shipping */}
          <div className="relative z-10 flex flex-col items-center space-y-1.5">
            <div
              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all shadow-sm ring-4 ring-amber-50/50 ${
                checkoutStep
                  ? "bg-accent-gold text-white shadow-md"
                  : "bg-white border-2 border-slate-300 text-slate-400"
              }`}
            >
              2
            </div>
            <span
              className={`text-[10px] uppercase font-extrabold tracking-wider ${
                checkoutStep ? "text-slate-800" : "text-slate-400"
              }`}
            >
              Shipping & Pay
            </span>
          </div>

          {/* Step 3: Confirmation */}
          <div className="relative z-10 flex flex-col items-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-300 font-bold text-xs flex items-center justify-center shadow-2xs">
              3
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-300">
              Confirmation
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-fade-in">
        {/* LEFT COMPONENT COLUMN (Cart Items List vs Address details checkout step) */}
        {!checkoutStep ? (
          <div className="lg:col-span-8 bg-primary border border-borderLight p-6 sm:p-8 rounded-sm space-y-6">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-textPrimary pb-4 border-b border-borderLight">
              Selected Ensembles
            </h3>

            {isBuyNow && (
              <div className="bg-accent-gold/10 border border-accent-gold/20 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs mb-4">
                <span className="text-textPrimary font-medium">
                  You are checking out using <strong>Buy It Now</strong>. Only
                  the selected single item will be purchased.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigate(
                      "/cart" + (isDirectCheckout ? "?checkout=true" : ""),
                    );
                  }}
                  className="text-accent-gold font-bold hover:underline whitespace-nowrap"
                >
                  Cancel Buy Now / Use Full Cart
                </button>
              </div>
            )}

            <div className="divide-y divide-borderLight">
              {cartItems.map((item, idx) => {
                const key = getItemKey(item);
                const isSelected = selectedKeys.includes(key);
                const isItemBuyNow = isBuyNow && key === buyNowKey;
                const displayQty = isItemBuyNow ? buyNowQty : item.quantity;
                return (
                  <div
                    key={idx}
                    className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                  >
                    {/* Checkbox Selector & Photo & Specs details */}
                    <div className="flex space-x-4 items-center flex-1 min-w-0">
                      <div className="flex items-center shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isBuyNow}
                          onChange={() => {
                            setSelectedKeys((prev) =>
                              prev.includes(key)
                                ? prev.filter((k) => k !== key)
                                : [...prev, key],
                            );
                          }}
                          className="w-4 h-4 text-accent-gold border-borderLight bg-bgLight rounded focus:ring-accent-gold accent-accent-gold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <img
                        src={optimizeCloudinaryUrl(item.product.images[0], 250)}
                        alt={item.product.name}
                        className="w-20 h-24 object-cover bg-bgLight rounded border border-borderLight shrink-0"
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
                        <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-1 pt-1 font-sans">
                          <span className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                            {formatCurrency(item.product.price)}
                          </span>
                          {item.product.mrp && item.product.mrp > item.product.price && (
                            <span className="text-[11px] text-slate-400 line-through font-normal font-sans">
                              {formatCurrency(item.product.mrp)}
                            </span>
                          )}
                          {displayQty > 1 && (
                            <span className="text-[11px] text-amber-800 font-medium font-sans">
                              ({displayQty} × {formatCurrency(item.product.price)} ={" "}
                              <strong className="text-slate-900 font-bold">
                                {formatCurrency(item.product.price * displayQty)}
                              </strong>
                              )
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity and Actions */}
                    <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                      {isBuyNow ? (
                        <div className="text-xs font-medium text-textSecondary bg-bgLight px-3 py-1.5 border border-borderLight rounded-sm">
                          Quantity:{" "}
                          <span className="text-textPrimary font-bold">
                            {displayQty}
                          </span>
                        </div>
                      ) : (
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
                            {displayQty}
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
                      )}
                      {!isBuyNow && (
                        <button
                          onClick={() =>
                            handleRemove(item.product._id, item.variant)
                          }
                          className="text-textSecondary hover:text-danger hover:scale-110 transition-all p-2 rounded-full hover:bg-danger/10"
                        >
                          <RiDeleteBinLine size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
                    onChange={(e) => {
                      setAddress({ ...address, paymentMethod: e.target.value });
                      trackAddPaymentInfo(e.target.value, grandTotal);
                    }}
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
                    onChange={(e) => {
                      setAddress({ ...address, paymentMethod: e.target.value });
                      trackAddPaymentInfo(e.target.value, grandTotal);
                    }}
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

            {/* Coupon Promo Code Input Block inside Checkout step */}
            <div className="pt-4 border-t border-borderLight space-y-3">
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
                {couponApplied ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponApplied(false);
                      setDiscount(0);
                      setAppliedCouponDetails(null);
                      setCoupon("");
                      setCouponError("");
                    }}
                    className="bg-danger/25 text-danger hover:bg-danger hover:text-white px-4 py-2 text-xs font-bold uppercase rounded-xs tracking-wider transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyPromoCode}
                    className="bg-secondary text-primary hover:bg-accent-gold hover:text-secondary px-4 py-2 text-xs font-bold uppercase rounded-xs tracking-wider transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                )}
              </div>
              {couponApplied && (
                <p className="text-[10px] text-green-600 font-medium flex items-center space-x-1">
                  <span>
                    ✔ Coupon {coupon.trim().toUpperCase()} applied!{" "}
                    {formatCurrency(discount)} discount registered.
                  </span>
                </p>
              )}
              {couponError && (
                <p className="text-[10px] text-danger font-medium">
                  {couponError}
                </p>
              )}
            </div>

            {/* Retry Payment Block */}
            {failedOrder && (
              <div className="bg-danger/10 border border-danger/20 p-4 rounded-sm space-y-3 font-sans pt-4 border-t border-borderLight shadow-sm">
                <h4 className="text-xs font-bold text-danger uppercase tracking-wider flex items-center space-x-2">
                  <span>❌ Online Payment Failed</span>
                </h4>
                <p className="text-[11px] text-textSecondary leading-relaxed">
                  Order <strong>{failedOrder.orderId}</strong> has been created,
                  but payment failed or was cancelled. Please retry your online
                  payment to confirm the order, or place order via Cash on
                  Delivery instead.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      const ok = await openRazorpayCheckout(
                        failedOrder.razorpayCheckout,
                        failedOrder.orderId,
                        failedOrder.orderItemsPayload,
                      );
                      if (ok) {
                        setFailedOrder(null);
                      }
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="bg-accent-gold hover:bg-accent-gold/90 text-secondary px-4 py-2 text-xs font-bold uppercase rounded-xs tracking-wider transition-colors disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Retry Online Payment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFailedOrder(null);
                      setAddress((prev) => ({ ...prev, paymentMethod: "COD" }));
                    }}
                    className="bg-borderLight/40 hover:bg-borderLight/60 text-textPrimary px-4 py-2 text-xs font-bold uppercase rounded-xs tracking-wider transition-colors"
                  >
                    Pay via COD instead
                  </button>
                </div>
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
                {couponApplied ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponApplied(false);
                      setDiscount(0);
                      setAppliedCouponDetails(null);
                      setCoupon("");
                      setCouponError("");
                    }}
                    className="bg-danger/25 text-danger hover:bg-danger hover:text-white px-4 py-2 text-xs font-bold uppercase rounded-sm tracking-wider transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={applyPromoCode}
                    className="bg-secondary text-primary hover:bg-accent-gold hover:text-secondary px-4 py-2 text-xs font-bold uppercase rounded-sm tracking-wider transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                )}
              </div>
              {couponApplied && (
                <p className="text-[10px] text-green-600 font-medium flex items-center space-x-1">
                  <span>
                    ✔ Coupon {coupon.trim().toUpperCase()} applied!{" "}
                    {formatCurrency(discount)} discount registered.
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
          <div className="space-y-3.5 text-xs text-slate-600 font-sans font-medium">
            <div className="flex justify-between items-center">
              <span>Cart Subtotal</span>
              <span className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Delivery Charges</span>
              <span>
                {delivery === 0 ? (
                  <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-sans">
                    Free Delivery
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                    {formatCurrency(delivery)}
                  </span>
                )}
              </span>
            </div>
            {finalDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-3 py-2 rounded-lg font-sans">
                <span className="font-medium text-[11px]">
                  {couponApplied ? "Coupon Discount" : "Special Offer Discount"}
                </span>
                <span className="text-sm font-bold tracking-tight font-sans">
                  -{formatCurrency(finalDiscount)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200/80 pt-4 flex justify-between items-baseline font-sans">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 block font-sans">
                  Total Payable
                </span>
                <span className="text-[10px] text-slate-500 font-normal font-sans">
                  Inclusive of all taxes
                </span>
              </div>
              <span className="text-2xl font-extrabold text-[#8a1c14] font-sans tracking-tight tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Main button drawer toggling step */}
          {!checkoutStep ? (
            <div className="space-y-4">
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
                className="w-full space-x-2 rounded-xl py-4 text-xs tracking-wider shadow-lg"
              >
                <RiSecurePaymentLine size={16} />
                <span>Proceed to Checkout</span>
              </Button>

              <div className="pt-2 flex items-center justify-center space-x-3 text-[10px] text-slate-500 font-sans">
                <span className="flex items-center space-x-1">
                  <RiShieldCheckLine className="text-accent-gold" size={14} />
                  <span>256-Bit SSL Secure</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <RiRefreshLine className="text-accent-gold" size={14} />
                  <span>7-Day Returns</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <RiTruckLine className="text-accent-gold" size={14} />
                  <span>Express Dispatch</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-center text-slate-500 leading-relaxed font-sans pt-2 border-t border-slate-100 flex items-center justify-center space-x-2">
              <RiShieldCheckLine className="text-accent-gold" size={15} />
              <span>Protected by 256-Bit SSL Encryption • Razorpay Certified</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Cart;
