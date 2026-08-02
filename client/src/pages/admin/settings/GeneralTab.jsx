import React from "react";
import Button from "../../../components/admin/ui/Button.jsx";
import Input from "../../../components/admin/ui/Input.jsx";

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
            <div className="w-20 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-450 italic font-medium">
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
      <div className="pt-6 border-t border-slate-200 flex justify-between items-center bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Under Maintenance Lock
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">
            If enabled, public users will encounter a brief offline maintenance
            page
          </p>
        </div>
        <select
          value={generalForm.maintenanceMode}
          onChange={(e) =>
            setGeneralForm({
              ...generalForm,
              maintenanceMode: e.target.value,
            })
          }
          className="bg-white border border-slate-200 text-xs rounded-lg p-2 text-slate-700 outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold"
        >
          <option value="false">Off (Online Store Active)</option>
          <option value="true">On (Lock Public Store)</option>
        </select>
      </div>

      {/* Live Offer / Special Launch Countdown Toggle Section */}
      <div className="pt-6 border-t border-slate-200 space-y-4">
        <h3 className="text-xs font-bold tracking-widest uppercase text-[#c5a880] flex items-center">
          Special Launch Countdown Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Countdown Status (ON/OFF)
            </label>
            <select
              value={generalForm.countdownActive}
              onChange={(e) =>
                setGeneralForm({
                  ...generalForm,
                  countdownActive: e.target.value,
                })
              }
              className="w-full h-10 px-3 bg-white border border-slate-250 rounded-md text-xs text-slate-800 transition-all focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880]"
            >
              <option value="true">ON (Show Live Offer & Countdown)</option>
              <option value="false">OFF (Hide completely)</option>
            </select>
          </div>
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
