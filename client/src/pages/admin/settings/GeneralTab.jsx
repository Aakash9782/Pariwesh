import React from "react";
import Button from "../../../components/admin/ui/Button.jsx";
import Input from "../../../components/admin/ui/Input.jsx";
import ToggleSwitch from "../../../components/admin/ui/ToggleSwitch.jsx";

const GeneralTab = ({
  generalForm,
  setGeneralForm,
  handleSaveGeneral,
  handleLogoFileChange,
}) => {
  return (
    <form
      onSubmit={handleSaveGeneral}
      className="space-y-6 max-w-2xl text-slate-700 font-sans"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
        <Input
          label="Store Brand Name"
          value={generalForm.brandName}
          onChange={(e) =>
            setGeneralForm({
              ...generalForm,
              brandName: e.target.value,
            })
          }
        />
        <Input
          label="Registered Company GSTIN"
          value={generalForm.gstinNumber}
          onChange={(e) =>
            setGeneralForm({
              ...generalForm,
              gstinNumber: e.target.value,
            })
          }
        />
        <Input
          label="Help-Desk Support Mobile Phone"
          value={generalForm.supportPhone}
          onChange={(e) =>
            setGeneralForm({
              ...generalForm,
              supportPhone: e.target.value,
            })
          }
        />
        <Input
          label="Help-Desk Support Email"
          value={generalForm.supportEmail}
          onChange={(e) =>
            setGeneralForm({
              ...generalForm,
              supportEmail: e.target.value,
            })
          }
        />
      </div>

      <Input
        label="Registered Tax Invoice Business Address"
        value={generalForm.registeredAddress || ""}
        onChange={(e) =>
          setGeneralForm({
            ...generalForm,
            registeredAddress: e.target.value,
          })
        }
        placeholder="e.g. Plot No. 12, Sanganer Industrial Area, Jaipur, Rajasthan - 302029"
      />

      {/* Logo Section */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block">
          Store Brand Header Logo Image
        </label>
        <div className="flex items-center space-x-5">
          {generalForm.brandLogoUrl ? (
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg shadow-sm">
              <img
                src={generalForm.brandLogoUrl}
                className="max-h-11 max-w-xs object-contain"
                alt="Brand Logo"
              />
            </div>
          ) : (
            <div className="w-20 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400 italic font-medium">
              No Logo
            </div>
          )}
          <label className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] uppercase font-bold tracking-widest text-[#c5a880] py-2 px-4.5 rounded-lg cursor-pointer transition">
            Upload Logo
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Maintenance switch */}
      <div className="pt-6 border-t border-slate-200 bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80">
        <ToggleSwitch
          id="maintenanceModeSwitch"
          checked={generalForm.maintenanceMode === "true"}
          onChange={(val) =>
            setGeneralForm({
              ...generalForm,
              maintenanceMode: val ? "true" : "false",
            })
          }
          label="Under Maintenance Lock"
          description="If enabled, public users will encounter a brief offline maintenance page"
        />
      </div>

      {/* Live Offer / Special Launch Countdown Toggle Section */}
      <div className="pt-6 border-t border-slate-200 space-y-4">
        <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80">
          <ToggleSwitch
            id="countdownActiveSwitch"
            checked={generalForm.countdownActive === "true"}
            onChange={(val) =>
              setGeneralForm({
                ...generalForm,
                countdownActive: val ? "true" : "false",
              })
            }
            label="Special Launch Countdown Bar"
            description="Display countdown timer banner for festive & limited-period promotions"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="Countdown End Date & Time"
            value={generalForm.countdownEndDate}
            onChange={(e) =>
              setGeneralForm({
                ...generalForm,
                countdownEndDate: e.target.value,
              })
            }
          />
          <Input
            className="md:col-span-2"
            label="Countdown Bar Title (Message)"
            value={generalForm.countdownTitle}
            onChange={(e) =>
              setGeneralForm({
                ...generalForm,
                countdownTitle: e.target.value,
              })
            }
            placeholder="e.g. Special Launch ends in"
          />
        </div>
      </div>

      {/* Announcement Bar Section */}
      <div className="pt-6 border-t border-slate-200 space-y-4">
        <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80">
          <ToggleSwitch
            id="announcementActiveSwitch"
            checked={generalForm.announcementActive === "true"}
            onChange={(val) =>
              setGeneralForm({
                ...generalForm,
                announcementActive: val ? "true" : "false",
              })
            }
            label="Top Rotating Announcement Marquee"
            description="Display infinite ticker banner on the website header for free shipping & discount codes"
          />
        </div>

        <div>
          <Input
            label="Announcement Banner Text"
            value={generalForm.announcementText}
            onChange={(e) =>
              setGeneralForm({
                ...generalForm,
                announcementText: e.target.value,
              })
            }
            placeholder="e.g. Free shipping on orders above ₹1500"
          />
        </div>
      </div>

      {/* Festive & Event Campaign Manager (100% Dynamic - Navratri, Diwali, Wedding, etc.) */}
      <div className="pt-6 border-t border-slate-200 space-y-4">
        <div className="bg-[#FAF9F6] p-4.5 rounded-xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span className="text-accent-gold">✦</span>
                <span>Festive & Event Sale Campaign Manager</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Control the festive sale navigation menu, ad banners, coupons, and countdown timer (Navratri, Diwali, Wedding, Summer, etc.)
              </p>
            </div>
            <ToggleSwitch
              id="saleEventActiveSwitch"
              checked={
                generalForm.saleEventActive === "true" ||
                generalForm.saleEventActive === true
              }
              onChange={(val) =>
                setGeneralForm({
                  ...generalForm,
                  saleEventActive: val ? "true" : "false",
                })
              }
              label=""
            />
          </div>

          {(generalForm.saleEventActive === "true" ||
            generalForm.saleEventActive === true) && (
            <div className="space-y-4 pt-2 border-t border-slate-200/60">
              {/* Row 1: Navbar Title & Badge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Navbar Menu Title (e.g. NAVRATRI SALE IS LIVE)"
                  value={generalForm.saleNavTitle || ""}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      saleNavTitle: e.target.value,
                    })
                  }
                  placeholder="e.g. NAVRATRI SALE IS LIVE"
                />
                <Input
                  label="Navbar Badge Text (e.g. Sale, Festive, 50% Off)"
                  value={generalForm.saleNavBadge || ""}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      saleNavBadge: e.target.value,
                    })
                  }
                  placeholder="e.g. Sale"
                />
              </div>

              {/* Row 2: Headline & Subtitle on Sale Landing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Campaign Banner Headline"
                  value={generalForm.saleHeadline || ""}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      saleHeadline: e.target.value,
                    })
                  }
                  placeholder="e.g. Royal Festive Edit — Up to 50% Off"
                />
                <Input
                  label="Campaign Subtitle / Tagline"
                  value={generalForm.saleSubtitle || ""}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      saleSubtitle: e.target.value,
                    })
                  }
                  placeholder="e.g. Handcrafted Zari & Cotton Silk Suits"
                />
              </div>

              {/* Row 3: Promo Coupon & Discount Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Promo Coupon Code (1-Tap Copyable)"
                  value={generalForm.salePromoCode || ""}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      salePromoCode: e.target.value.toUpperCase().trim(),
                    })
                  }
                  placeholder="e.g. NAVRATRI15"
                />
                <Input
                  label="Discount Callout Text"
                  value={generalForm.saleDiscountText || ""}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      saleDiscountText: e.target.value,
                    })
                  }
                  placeholder="e.g. EXTRA 15% OFF ON ORDERS ABOVE ₹1,999"
                />
              </div>

              {/* Row 4: Countdown End Date & Min Discount Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Sale Countdown End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={generalForm.saleEndDate || ""}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        saleEndDate: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:border-accent-gold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Live timer will tick down to this exact date/time
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Product Filter Criterion
                  </label>
                  <select
                    value={generalForm.saleMinDiscount || "0"}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        saleMinDiscount: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:border-accent-gold"
                  >
                    <option value="0">All Discounted Suits (Price &lt; MRP)</option>
                    <option value="20">Min 20% OFF or more</option>
                    <option value="30">Min 30% OFF or more</option>
                    <option value="40">Min 40% OFF or more</option>
                    <option value="50">Min 50% OFF or more</option>
                  </select>
                  <span className="text-[10px] text-slate-400">
                    Which products qualify for the festive sale showcase
                  </span>
                </div>
              </div>

              {/* Row 5: Banner Ad Images Upload (Desktop & Mobile) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Desktop Ad Poster (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {generalForm.saleBannerDesktop ? (
                      <div className="h-16 w-28 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={generalForm.saleBannerDesktop}
                          alt="Desktop Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-28 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[9px] text-slate-400 text-center px-1">
                        Royal Gradient (Default)
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded cursor-pointer border border-slate-300 transition text-center">
                        Choose Desktop Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () =>
                                setGeneralForm((prev) => ({
                                  ...prev,
                                  saleBannerDesktop: r.result,
                                }));
                              r.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {generalForm.saleBannerDesktop && (
                        <button
                          type="button"
                          onClick={() =>
                            setGeneralForm((prev) => ({
                              ...prev,
                              saleBannerDesktop: "",
                            }))
                          }
                          className="text-[10px] text-red-600 hover:underline text-left cursor-pointer"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Mobile Ad Poster (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {generalForm.saleBannerMobile ? (
                      <div className="h-16 w-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={generalForm.saleBannerMobile}
                          alt="Mobile Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-20 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[9px] text-slate-400 text-center px-1">
                        Fitted (Default)
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded cursor-pointer border border-slate-300 transition text-center">
                        Choose Mobile Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () =>
                                setGeneralForm((prev) => ({
                                  ...prev,
                                  saleBannerMobile: r.result,
                                }));
                              r.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {generalForm.saleBannerMobile && (
                        <button
                          type="button"
                          onClick={() =>
                            setGeneralForm((prev) => ({
                              ...prev,
                              saleBannerMobile: "",
                            }))
                          }
                          className="text-[10px] text-red-600 hover:underline text-left cursor-pointer"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          className="px-6 py-2.5 text-xs uppercase tracking-wider font-bold"
        >
          Save Parameters Settings
        </Button>
      </div>
    </form>
  );
};

export default GeneralTab;
