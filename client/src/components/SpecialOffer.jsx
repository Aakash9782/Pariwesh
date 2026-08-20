import React, { useEffect } from "react";
import {
  RiGiftLine,
  RiLockLine,
  RiCheckboxCircleLine,
  RiInformationLine,
} from "react-icons/ri";

// Central Configurations
export const PREPAID_DISCOUNT = 5;
export const FIFTH_PURCHASE_DISCOUNT = 15;
export const FIFTH_PURCHASE_NUMBER = 4; // 4 successful delivered orders beforehand

const SpecialOffer = ({
  paymentMethod = "COD",
  deliveredCount = 0,
  subtotal = 0,
  couponApplied = false,
  onOfferChange,
}) => {
  // Determine eligibility status
  const isPrepaidEligible = paymentMethod === "ONLINE";
  const isFifthPurchaseEligible = deliveredCount === FIFTH_PURCHASE_NUMBER;

  // Optimal offer auto-selection (15% fifth purchase has priority, prepaid is 5%)
  let selectedOffer = null;
  if (isFifthPurchaseEligible) {
    selectedOffer = {
      type: "FIFTH_PURCHASE_15",
      discountPercent: FIFTH_PURCHASE_DISCOUNT,
      label: "5th Purchase Reward — 15% OFF",
      description:
        "Thank you for being a loyal customer! Enjoy 15% OFF on your 5th purchase.",
    };
  } else if (isPrepaidEligible) {
    selectedOffer = {
      type: "PREPAID_5",
      discountPercent: PREPAID_DISCOUNT,
      label: "Pay Online & Get 5% OFF",
      description: "Save 5% instantly on prepaid orders.",
    };
  }

  // Trigger parent state update on eligibility changes
  useEffect(() => {
    if (onOfferChange) {
      if (couponApplied) {
        // Only PREPAID_5 auto-discount is allowed to stack with manual coupon codes
        if (selectedOffer && selectedOffer.type === "PREPAID_5") {
          onOfferChange(selectedOffer);
        } else {
          onOfferChange(null);
        }
      } else {
        onOfferChange(selectedOffer);
      }
    }
  }, [
    paymentMethod,
    deliveredCount,
    couponApplied,
    selectedOffer,
    onOfferChange,
  ]);

  const prepaidDiscountAmount = Math.round(subtotal * (PREPAID_DISCOUNT / 100));
  const fifthDiscountAmount = Math.round(
    subtotal * (FIFTH_PURCHASE_DISCOUNT / 100),
  );

  return (
    <div className="bg-primary border border-borderLight p-5 rounded-sm space-y-4 text-textPrimary animate-fade-in">
      <div className="flex items-center space-x-2 text-accent-gold border-b border-borderLight pb-2.5">
        <RiGiftLine size={18} className="animate-pulse" />
        <h4 className="text-xs font-display font-bold uppercase tracking-widest">
          🎁 Special Offers available
        </h4>
      </div>

      {couponApplied && selectedOffer?.type === "FIFTH_PURCHASE_15" && (
        <div className="flex items-start space-x-2 bg-secondary/10 border border-secondary/20 p-2.5 rounded-sm">
          <RiInformationLine
            size={14}
            className="text-accent-gold flex-shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-textSecondary leading-normal">
            A manual coupon code is applied. Royalty reward automatic discounts
            are temporarily disabled to prevent stacking.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* PREPAID OFFER CARD */}
        <div
          className={`border p-3.5 rounded-sm transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
            isPrepaidEligible
              ? "border-accent-gold/50 bg-secondary/5 ring-1 ring-accent-gold/20"
              : "border-borderLight bg-bgLight/40 opacity-70"
          }`}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-textPrimary">
                💳 Pay Online & Get {PREPAID_DISCOUNT}% OFF
              </span>
              {isPrepaidEligible && (
                <span className="text-[8px] bg-success/15 text-green-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-textSecondary leading-relaxed">
              Save {PREPAID_DISCOUNT}% instantly on prepaid orders.
            </p>
            {isPrepaidEligible && subtotal > 0 && (
              <p className="text-[10px] font-bold text-accent-gold">
                Instant Discount: -₹{prepaidDiscountAmount}
              </p>
            )}
          </div>
          <div className="self-end sm:self-auto flex items-center">
            {isPrepaidEligible ? (
              <RiCheckboxCircleLine className="text-green-600" size={18} />
            ) : (
              <span className="text-[8.5px] uppercase font-bold tracking-wider text-textSecondary bg-borderLight/30 px-2 py-1 rounded-sm">
                Pay Online to Unlock
              </span>
            )}
          </div>
        </div>

        {/* 5TH PURCHASE OFFER CARD */}
        <div
          className={`border p-3.5 rounded-sm transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
            isFifthPurchaseEligible && !couponApplied
              ? "border-accent-gold/50 bg-secondary/5 ring-1 ring-accent-gold/20"
              : "border-borderLight bg-bgLight/40 opacity-70"
          }`}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-textPrimary">
                🎉 5th Purchase Reward — {FIFTH_PURCHASE_DISCOUNT}% OFF
              </span>
              {isFifthPurchaseEligible && !couponApplied && (
                <span className="text-[8px] bg-success/15 text-green-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-textSecondary leading-relaxed">
              Enjoy {FIFTH_PURCHASE_DISCOUNT}% OFF on your 5th purchase. Count
              based on delivered orders.
            </p>
            {isFifthPurchaseEligible && !couponApplied && subtotal > 0 && (
              <p className="text-[10px] font-bold text-accent-gold">
                Loyalty Discount: -₹{fifthDiscountAmount}
              </p>
            )}
          </div>
          <div className="self-end sm:self-auto flex items-center">
            {isFifthPurchaseEligible && !couponApplied ? (
              <RiCheckboxCircleLine className="text-green-600" size={18} />
            ) : isFifthPurchaseEligible ? (
              <span className="text-[8.5px] uppercase font-bold tracking-wider text-textSecondary bg-borderLight/30 px-2 py-1 rounded-sm">
                Unlockable
              </span>
            ) : (
              <div className="flex items-center space-x-1 text-textSecondary bg-borderLight/30 px-2.5 py-1 rounded-sm text-[8.5px] font-bold uppercase tracking-wider">
                <RiLockLine size={11} className="text-textSecondary" />
                <span>Locked</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialOffer;
