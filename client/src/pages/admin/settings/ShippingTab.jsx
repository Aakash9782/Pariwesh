import React from "react";

const ShippingTab = ({ shippingForm, setShippingForm, handleSaveShipping }) => {
  return (
    <form onSubmit={handleSaveShipping} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
        <div className="space-y-1.5 flex flex-col font-sans">
          <label className="text-slate-450 text-xs font-semibold">
            Enable Cash On Delivery (COD)
          </label>
          <select
            className="w-full bg-slate-900 border border-slate-805 rounded p-2.5 text-xs text-slate-200 focus:outline-none font-sans"
            value={shippingForm.codEnabled}
            onChange={(e) =>
              setShippingForm({
                ...shippingForm,
                codEnabled: e.target.value,
              })
            }
          >
            <option value="true">Accept COD payments</option>
            <option value="false">Only Pre-paid online payments</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-450 text-xs font-semibold">
            Base Delivery Fee Charge (INR)
          </label>
          <input
            type="number"
            className="w-full bg-slate-900 border border-slate-805 rounded p-2.5 text-xs text-white"
            value={shippingForm.deliveryCharge}
            onChange={(e) =>
              setShippingForm({
                ...shippingForm,
                deliveryCharge: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-450 text-xs font-semibold font-sans">
            Free Shipping threshold Limit (INR)
          </label>
          <input
            type="number"
            className="w-full bg-slate-900 border border-slate-805 rounded p-2.5 text-xs text-white"
            value={shippingForm.freeThreshold}
            onChange={(e) =>
              setShippingForm({
                ...shippingForm,
                freeThreshold: e.target.value,
              })
            }
          />
        </div>
      </div>

      <button
        type="submit"
        className="bg-accent-gold text-slate-950 text-xs font-bold py-2.5 px-6.5 rounded-lg transition hover:bg-yellow-500"
      >
        Save Shipment metrics
      </button>
    </form>
  );
};

export default ShippingTab;
