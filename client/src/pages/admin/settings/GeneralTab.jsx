import React from "react";

const GeneralTab = ({
  generalForm,
  setGeneralForm,
  handleSaveGeneral,
  handleLogoFileChange,
}) => {
  return (
    <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
        <div className="space-y-1.5 flex flex-col font-sans">
          <label className="text-slate-450 text-xs font-semibold">
            Store Brand Name
          </label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
            value={generalForm.brandName}
            onChange={(e) =>
              setGeneralForm({
                ...generalForm,
                brandName: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-450 text-xs font-semibold">
            Registered Company GSTIN
          </label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
            value={generalForm.gstinNumber}
            onChange={(e) =>
              setGeneralForm({
                ...generalForm,
                gstinNumber: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-450 text-xs font-semibold">
            Help-Desk Support Mobile Phone
          </label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
            value={generalForm.supportPhone}
            onChange={(e) =>
              setGeneralForm({
                ...generalForm,
                supportPhone: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-450 text-xs font-semibold">
            Help-Desk support Email
          </label>
          <input
            type="email"
            className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
            value={generalForm.supportEmail}
            onChange={(e) =>
              setGeneralForm({
                ...generalForm,
                supportEmail: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Logo Section */}
      <div className="space-y-3.5 pt-4 border-t border-slate-900">
        <label className="text-slate-450 text-xs font-semibold block">
          Store Brand Header Logo Image
        </label>
        <div className="flex items-center space-x-5">
          {generalForm.brandLogoUrl ? (
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
              <img
                src={generalForm.brandLogoUrl}
                className="max-h-11 max-w-xs object-contain"
                alt="Brand Logo"
              />
            </div>
          ) : (
            <div className="w-20 h-10 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500 italic">
              No Logo
            </div>
          )}
          <label className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] uppercase font-extrabold tracking-widest text-accent-gold py-2 px-4.5 rounded cursor-pointer transition">
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
      <div className="pt-4 border-t border-slate-900 flex justify-between items-center bg-slate-900/40 p-4 rounded border border-slate-900">
        <div>
          <h4 className="text-xs font-semibold text-white">
            Under Maintenance Lock
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">
            If enabled, public users will encounter a brief offline page
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
          className="bg-slate-950 border border-slate-800 text-xs rounded p-2 text-slate-200 focus:outline-none"
        >
          <option value="false">Off (Online Store Active)</option>
          <option value="true">On (Lock Public Store)</option>
        </select>
      </div>

      {/* Live Offer / Special Launch Countdown Toggle Section */}
      <div className="pt-6 border-t border-slate-900 space-y-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-accent-gold flex items-center">
          Special Launch Countdown Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 flex flex-col font-sans">
            <label className="text-slate-400 text-xs font-semibold">
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
              className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-205 focus:outline-none"
            >
              <option value="true">ON (Show Live Offer & Countdown)</option>
              <option value="false">OFF (Hide completely)</option>
            </select>
          </div>
          <div className="space-y-1.5 flex flex-col font-sans">
            <label className="text-slate-400 text-xs font-semibold">
              Countdown End Date & Time *
            </label>
            <input
              type="datetime-local"
              className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              value={generalForm.countdownEndDate}
              onChange={(e) =>
                setGeneralForm({
                  ...generalForm,
                  countdownEndDate: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1.5 flex flex-col font-sans md:col-span-2">
            <label className="text-slate-400 text-xs font-semibold">
              Countdown Bar Title (Message)
            </label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
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
      </div>

      <button
        type="submit"
        className="bg-accent-gold text-slate-950 text-xs font-bold py-2.5 px-6.5 rounded-lg transition hover:bg-yellow-500"
      >
        Save Parameters settings
      </button>
    </form>
  );
};

export default GeneralTab;
