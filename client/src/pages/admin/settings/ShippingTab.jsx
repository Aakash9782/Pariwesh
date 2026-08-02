import React from "react";
import Button from "../../../components/admin/ui/Button.jsx";
import Input from "../../../components/admin/ui/Input.jsx";

const ShippingTab = ({ shippingForm, setShippingForm, handleSaveShipping }) => {
  return (
    <form
      onSubmit={handleSaveShipping}
      className="space-y-6 max-w-2xl text-slate-700 font-sans"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Enable Cash On Delivery (COD)
          </label>
          <select
            className="w-full h-10 px-3 bg-white border border-slate-250 rounded-md text-xs text-slate-800 transition-all focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880]"
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
        <Input
          type="number"
          label="Base Delivery Fee Charge (INR)"
          value={shippingForm.deliveryCharge}
          onChange={(e) =>
            setShippingForm({
              ...shippingForm,
              deliveryCharge: e.target.value,
            })
          }
        />
        <Input
          type="number"
          label="Free Shipping Threshold Limit (INR)"
          value={shippingForm.freeThreshold}
          onChange={(e) =>
            setShippingForm({
              ...shippingForm,
              freeThreshold: e.target.value,
            })
          }
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          className="px-6 py-2.5 text-xs uppercase tracking-wider font-bold"
        >
          Save Shipment Metrics
        </Button>
      </div>
    </form>
  );
};

export default ShippingTab;
