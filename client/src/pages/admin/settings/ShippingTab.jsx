import React from "react";
import Button from "../../../components/admin/ui/Button.jsx";
import Input from "../../../components/admin/ui/Input.jsx";
import ToggleSwitch from "../../../components/admin/ui/ToggleSwitch.jsx";

const ShippingTab = ({ shippingForm, setShippingForm, handleSaveShipping }) => {
  return (
    <form
      onSubmit={handleSaveShipping}
      className="space-y-6 max-w-2xl text-slate-700 font-sans"
    >
      <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80">
        <ToggleSwitch
          id="codEnabledSwitch"
          checked={shippingForm.codEnabled === "true"}
          onChange={(val) =>
            setShippingForm({
              ...shippingForm,
              codEnabled: val ? "true" : "false",
            })
          }
          label="Accept Cash On Delivery (COD)"
          description="If disabled, customers will only be allowed to checkout using prepaid online payments"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
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
