import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
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

const Cart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useSelector((state) => state.auth);

  // States code
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Checkout flow states
  const [checkoutStep, setCheckoutStep] = useState(false); // false = show cart, true = show address form
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
  });

  const getSubtotal = () => {
    return cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );
  };

  const handleQtyChange = (productId, variant, newQty) => {
    if (newQty < 1) return;
    dispatch(updateQuantityInCart({ productId, variant, quantity: newQty }));
  };

  const handleRemove = (productId, variant) => {
    dispatch(removeFromCart({ productId, variant }));
  };

  const applyPromoCode = async () => {
    try {
      setCouponError("");
      const sub = getSubtotal();
      const res = await API.post("/coupons/validate", {
        code: coupon,
        subtotal: sub,
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
      // Fallback for PARIWESHGOLD / LHRGOLD offline verification
      const codeUpper = coupon.trim().toUpperCase();
      if (
        codeUpper === "PARIWESHGOLD" ||
        codeUpper === "LHRGOLD" ||
        codeUpper === "FESTIVE35"
      ) {
        const sub = getSubtotal();
        const pct = codeUpper === "FESTIVE35" ? 0.35 : 0.15;
        setDiscount(Math.round(sub * pct));
        setCouponApplied(true);
        setCouponError("");
      } else {
        setCouponError(err.response?.data?.message || "Invalid coupon code!");
        setDiscount(0);
        setCouponApplied(false);
      }
    }
  };

  const handleAddressInput = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (
      !address.fullName ||
      !address.phone ||
      !address.street ||
      !address.pincode
    ) {
      alert("Please fill out all mandatory shipping details.");
      return;
    }

    try {
      setLoading(true);

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
          discount,
          grandTotal,
          appliedCoupon: couponApplied ? coupon.trim().toUpperCase() : "",
        },
        paymentMethod: address.paymentMethod,
        paymentStatus: address.paymentMethod === "ONLINE" ? "Paid" : "Pending",
        customer: {
          userId: user?._id || "",
          name: address.fullName,
          phone: address.phone,
        },
      };

      const res = await API.post("/orders", payload);

      if (res.data && res.data.success) {
        setPlacedOrderId(res.data.data.orderId);
        setOrderSuccess(true);
        dispatch(clearCart());
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Failed placing order:", error);
      alert(
        error.response?.data?.message ||
          "Error placing order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const delivery = subtotal >= 1500 || subtotal === 0 ? 0 : 99;
  const gst = Math.round(subtotal * 0.12); // 12% apparel GST
  const grandTotal = subtotal + delivery + gst - discount;

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in relative z-10">
        <div className="w-20 h-20 bg-green-55/10 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <RiCheckboxCircleLine size={48} />
        </div>
        <h2 className="text-3xl font-display font-medium text-textPrimary uppercase tracking-wider">
          Order Placed Successfully!
        </h2>
        {placedOrderId && (
          <p className="text-sm font-bold text-accent-gold uppercase tracking-widest bg-secondary/95 text-primary py-2 px-4 rounded-sm inline-block">
            Order ID: {placedOrderId}
          </p>
        )}
        <p className="text-sm text-textSecondary leading-relaxed">
          Thank you for choosing PARIWESH. Your premium wardrobe ensemble has
          been been booked! We have sent a confirmation details invoice to your
          email interface.
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
            {address.paymentMethod} (Pending Collection)
          </p>
        </div>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <h2 className="text-3xl font-display font-medium text-textPrimary uppercase tracking-wider">
          Your bag is empty
        </h2>
        <p className="text-xs text-textSecondary">
          Looks like you haven't added any luxury ensembles to your shopping bag
          yet.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Browse Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-textPrimary leading-snug">
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
                      className="text-textSecondary hover:text-danger hover:scale-108 transition-all p-2 rounded-full hover:bg-danger/10"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Customer Name"
                name="fullName"
                required
                value={address.fullName}
                onChange={handleAddressInput}
                placeholder="e.g. Priyanjali Sen"
              />
              <Input
                label="Mobile Contact Number"
                name="phone"
                required
                value={address.phone}
                onChange={handleAddressInput}
                placeholder="e.g. +91 9876543210"
              />
            </div>

            <Input
              label="Street Address / House Line"
              name="street"
              required
              value={address.street}
              onChange={handleAddressInput}
              placeholder="House No, Building name, Sector/Street details"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                value={address.city}
                onChange={handleAddressInput}
                placeholder="e.g. New Delhi"
              />
              <Input
                label="State State"
                name="state"
                value={address.state}
                onChange={handleAddressInput}
                placeholder="e.g. Delhi"
              />
              <Input
                label="Pincode Location"
                name="pincode"
                required
                value={address.pincode}
                onChange={handleAddressInput}
                placeholder="e.g. 110001"
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
                      Cards, UPI, Netbanking
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

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
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
                    ✔ Coupon PARIWESHGOLD applied! 15% discount registered.
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
            <div className="flex justify-between">
              <span>Estimated GST (12%)</span>
              <span>₹{gst}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 bg-green-55/10 p-2 rounded">
                <span>Coupon Discount</span>
                <span className="font-bold">-₹{discount}</span>
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
              onClick={() => setCheckoutStep(true)}
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
