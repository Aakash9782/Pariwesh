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
          type="email"
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
