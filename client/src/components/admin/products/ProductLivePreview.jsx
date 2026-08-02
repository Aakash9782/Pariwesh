import React from "react";
import { useProductWizard } from "./ProductWizardContext.jsx";
import { RiFolderImageLine } from "react-icons/ri";

const ProductLivePreview = () => {
  const { form, previewDevice, setPreviewDevice } = useProductWizard();

  return (
    <div className="w-[340px] border-l border-slate-200 bg-slate-50 flex flex-col p-5 shrink-0 overflow-y-auto hidden lg:flex space-y-4 font-sans justify-between">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-3 shrink-0">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Live Preview Card
          </span>
          <div className="flex space-x-1 bg-slate-200 p-0.5 rounded-lg border border-slate-300">
            {["mobile", "tablet", "desktop"].map((dev) => (
              <button
                key={dev}
                type="button"
                onClick={() => setPreviewDevice(dev)}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition ${
                  previewDevice === dev
                    ? "bg-white text-slate-900 border border-slate-300 shadow-sm font-extrabold"
                    : "text-slate-550 hover:text-slate-700"
                }`}
              >
                {dev[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Device Emulator Frame */}
        <div className="flex items-center justify-center py-2">
          <div
            className={`transition-all duration-300 bg-white rounded-2xl border border-slate-200 shadow-xl relative flex flex-col overflow-hidden ${
              previewDevice === "mobile"
                ? "w-[245px] aspect-[3/4.8]"
                : previewDevice === "tablet"
                  ? "w-[265px] aspect-[3/4.2]"
                  : "w-full aspect-[3/4.2]"
            }`}
          >
            {/* Interactive boutique card preview */}
            <div className="relative w-full aspect-[3/4] bg-slate-50 overflow-hidden group">
              {form.images && form.images[0] ? (
                <img
                  src={form.images[0]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt="Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 p-4 text-center">
                  <RiFolderImageLine
                    size={32}
                    className="text-slate-300 mb-1.5"
                  />
                  <span className="text-[10px] text-slate-400 italic font-medium">
                    No Images Enrolled
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full text-[8px] font-extrabold uppercase tracking-widest text-slate-700 shadow-sm animate-pulse-subtle">
                {form.status || "active"}
              </div>

              {/* Tag/New badge overlay */}
              {form.tag && (
                <div className="absolute bottom-3 right-3 bg-accent-gold text-slate-950 font-bold px-2.5 py-1 rounded text-[8px] tracking-wider uppercase shadow-sm">
                  {form.tag}
                </div>
              )}
            </div>

            {/* Card details panel */}
            <div className="p-4 space-y-2 flex-grow flex flex-col justify-between border-t border-slate-100 bg-white">
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-400 tracking-widest uppercase font-extrabold">
                  {form.brand || "Pariwesh"}
                </p>
                <h4 className="text-xs font-semibold text-slate-800 truncate">
                  {form.name || "Elysian Gold Dress"}
                </h4>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xs font-extrabold text-accent-gold">
                  ₹{form.price || "0"}
                </span>
                {Number(form.discount) > 0 && (
                  <>
                    <span className="text-[9px] text-slate-400 line-through">
                      ₹{form.mrp || "0"}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600">
                      ({form.discount}% OFF)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 italic text-center font-mono select-none">
        Real-time catalog sync renderer
      </p>
    </div>
  );
};

export default ProductLivePreview;
