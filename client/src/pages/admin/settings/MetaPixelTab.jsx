import React, { useState } from "react";
import Button from "../../../components/admin/ui/Button.jsx";
import Input from "../../../components/admin/ui/Input.jsx";
import API from "../../../services/api.js";
import { useAlert } from "../../../contexts/AlertContext.jsx";
import {
  RiFacebookCircleFill,
  RiCheckDoubleLine,
  RiShieldCheckLine,
  RiFlashlightLine,
  RiEyeLine,
  RiEyeOffLine,
  RiInformationLine,
  RiTestTubeLine,
} from "react-icons/ri";

const MetaPixelTab = ({
  metaForm,
  setMetaForm,
  handleSaveMeta,
  saving = false,
}) => {
  const { showAlert } = useAlert();
  const [showToken, setShowToken] = useState(false);
  const [testingCapi, setTestingCapi] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestCapi = async () => {
    if (!metaForm.metaPixelId || !metaForm.metaCapiToken) {
      showAlert(
        "Please enter both Meta Pixel ID and Conversions API Access Token before testing.",
        "Missing Credentials"
      );
      return;
    }

    try {
      setTestingCapi(true);
      setTestResult(null);
      const res = await API.post("/settings/test-meta-capi", metaForm);
      if (res.data?.success) {
        setTestResult({
          success: true,
          message:
            res.data.message ||
            "Test event received by Meta Conversions API successfully!",
          data: res.data.data,
        });
        showAlert(
          "Success! Test event sent to Meta. Check your Meta Events Manager -> Test Events tab.",
          "CAPI Connection Verified"
        );
      }
    } catch (err) {
      console.error("Test CAPI Error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to communicate with Meta Conversions API";
      setTestResult({
        success: false,
        message: errMsg,
      });
      showAlert(errMsg, "CAPI Test Failed");
    } finally {
      setTestingCapi(false);
    }
  };

  return (
    <form
      onSubmit={handleSaveMeta}
      className="space-y-6 max-w-3xl text-slate-700 font-sans"
    >
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-[#1877F2]/10 via-[#c5a880]/10 to-transparent p-5 rounded-xl border border-slate-200 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-md">
          <RiFacebookCircleFill size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Meta Pixel & Server-Side Conversions API (CAPI)
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-200">
              Hybrid Tracking Active
            </span>
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tracks e-commerce events (PageViews, ViewContent, AddToCart, InitiateCheckout, and Purchases) directly through the browser and server simultaneously. Features 3-Layer Deduplication to prevent double counting on page refresh.
          </p>
        </div>
      </div>

      {/* Tracking Enable Switch */}
      <div className="bg-white border border-slate-200 p-4.5 rounded-xl flex items-center justify-between shadow-xs">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-900 block">
            Enable Meta Tracking
          </span>
          <span className="text-[11px] text-slate-500 block">
            Master toggle to activate or deactivate Pixel and Conversions API across the entire store.
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={
              metaForm.metaTrackingEnabled === "true" ||
              metaForm.metaTrackingEnabled === true
            }
            onChange={(e) =>
              setMetaForm({
                ...metaForm,
                metaTrackingEnabled: e.target.checked ? "true" : "false",
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c5a880]"></div>
        </label>
      </div>

      {/* Main Credentials */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
          <RiShieldCheckLine className="text-[#c5a880]" size={16} />
          Meta API Credentials
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Meta Pixel ID"
              placeholder="e.g. 123456789012345"
              value={metaForm.metaPixelId || ""}
              onChange={(e) =>
                setMetaForm({
                  ...metaForm,
                  metaPixelId: e.target.value.trim(),
                })
              }
              helperText="Found in Meta Business Suite ➔ Events Manager ➔ Data Sources"
            />
          </div>

          <div>
            <Input
              label="Test Event Code (Optional)"
              placeholder="e.g. TEST12345"
              value={metaForm.metaTestEventCode || ""}
              onChange={(e) =>
                setMetaForm({
                  ...metaForm,
                  metaTestEventCode: e.target.value.trim(),
                })
              }
              helperText="Get from Events Manager ➔ Test Events tab for live debugging"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Conversions API (CAPI) Access Token
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              placeholder="EAAG..."
              value={metaForm.metaCapiToken || ""}
              onChange={(e) =>
                setMetaForm({
                  ...metaForm,
                  metaCapiToken: e.target.value.trim(),
                })
              }
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#c5a880] focus:border-[#c5a880] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {showToken ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Generated in Events Manager ➔ Settings ➔ Conversions API ➔ "Generate Access Token".
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <RiCheckDoubleLine className="text-emerald-600" size={16} />
            <span>100% Deduplication</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Pixel & CAPI share exact identical event_id (`order_PRW-...`) to eliminate double counting.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <RiShieldCheckLine className="text-[#c5a880]" size={16} />
            <span>High EMQ (8.5+)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Email, phone, pincode and browser cookies (_fbp, _fbc) are normalized and SHA-256 hashed.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <RiFlashlightLine className="text-amber-600" size={16} />
            <span>Refresh Guard</span>
          </div>
          <p className="text-[11px] text-slate-500">
            SessionStorage memory guard prevents duplicate purchase events when customers refresh the page.
          </p>
        </div>
      </div>

      {/* Test Connection Output */}
      {testResult && (
        <div
          className={`p-4 rounded-xl text-xs space-y-1 border ${
            testResult.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {testResult.success ? (
              <RiCheckDoubleLine size={16} className="text-emerald-600" />
            ) : (
              <RiInformationLine size={16} className="text-rose-600" />
            )}
            <span>
              {testResult.success
                ? "Connection Verified Successfully"
                : "Verification Failed"}
            </span>
          </div>
          <p className="text-[11px]">{testResult.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-200">
        <Button
          type="button"
          onClick={handleTestCapi}
          disabled={testingCapi || saving}
          variant="outline"
          className="text-xs font-semibold text-slate-700 bg-white border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 px-4 py-2.5 rounded-lg shadow-xs"
        >
          <RiTestTubeLine size={15} className="text-[#c5a880]" />
          <span>{testingCapi ? "Testing CAPI..." : "Test CAPI Connection"}</span>
        </Button>

        <Button
          type="submit"
          disabled={saving}
          className="bg-slate-900 text-white hover:bg-[#c5a880] px-6 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <span>{saving ? "Saving Changes..." : "Save Meta Settings"}</span>
        </Button>
      </div>
    </form>
  );
};

export default MetaPixelTab;
