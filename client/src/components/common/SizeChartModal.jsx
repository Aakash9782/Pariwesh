import React, { useState, useEffect, useMemo } from "react";
import {
  RiCloseLine,
  RiRulerLine,
  RiInformationLine,
  RiCheckLine,
  RiImageLine,
  RiTableLine,
  RiSparklingFill,
} from "react-icons/ri";

// Standard Brand Ethnic Wear Specifications (Inches)
const DEFAULT_ETHNIC_SIZES = [
  {
    size: "M",
    standard: "38",
    bust: 38,
    waist: 34,
    hip: 42,
    shoulder: 14.5,
    length: 45,
    bottomWaist: "28-32",
    bottomLength: 37,
  },
  {
    size: "L",
    standard: "40",
    bust: 40,
    waist: 36,
    hip: 44,
    shoulder: 15,
    length: 45,
    bottomWaist: "32-36",
    bottomLength: 37.5,
  },
  {
    size: "XL",
    standard: "42",
    bust: 42,
    waist: 38,
    hip: 46,
    shoulder: 15.5,
    length: 46,
    bottomWaist: "36-40",
    bottomLength: 38,
  },
  {
    size: "XXL",
    standard: "44",
    bust: 44,
    waist: 40,
    hip: 48,
    shoulder: 16,
    length: 46,
    bottomWaist: "40-44",
    bottomLength: 38.5,
  },
];

const toCm = (inches) => {
  if (typeof inches === "number") {
    return (inches * 2.54).toFixed(1);
  }
  if (typeof inches === "string") {
    if (inches.includes("-")) {
      const [min, max] = inches.split("-").map(Number);
      return `${(min * 2.54).toFixed(0)}-${(max * 2.54).toFixed(0)}`;
    }
    const num = parseFloat(inches);
    return isNaN(num) ? inches : (num * 2.54).toFixed(1);
  }
  return inches;
};

const SizeChartModal = ({
  isOpen,
  onClose,
  sizeChart = null,
  selectedSize = "",
  onSelectSize = () => {},
}) => {
  const hasCustomImage = Boolean(
    sizeChart?.type === "image" && sizeChart?.imageUrl,
  );

  const [activeView, setActiveView] = useState(() =>
    hasCustomImage ? "image" : "table",
  );
  const [unit, setUnit] = useState("in"); // "in" | "cm"
  const [activeTab, setActiveTab] = useState("kurta"); // "kurta" | "pants" | "measure" | "calculator"
  const [bustInput, setBustInput] = useState("");

  // Sync default view when sizeChart changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveView(hasCustomImage ? "image" : "table");
    }
  }, [isOpen, hasCustomImage]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Compute merged size data (standard + optional overrides)
  const sizeData = useMemo(() => {
    const customList = sizeChart?.measurements || [];
    return DEFAULT_ETHNIC_SIZES.map((def) => {
      const match = customList.find((c) => c.size === def.size);
      if (!match) return def;
      return {
        ...def,
        bust: match.bust ? parseFloat(match.bust) : def.bust,
        waist: match.waist ? parseFloat(match.waist) : def.waist,
        hip: match.hip ? parseFloat(match.hip) : def.hip,
        shoulder: match.shoulder ? parseFloat(match.shoulder) : def.shoulder,
        length: match.length ? parseFloat(match.length) : def.length,
        bottomWaist: match.bottomWaist || def.bottomWaist,
        bottomLength: match.bottomLength
          ? parseFloat(match.bottomLength)
          : def.bottomLength,
      };
    });
  }, [sizeChart]);

  // Fit Recommendation Calculator logic
  const recommendedSize = useMemo(() => {
    const val = parseFloat(bustInput);
    if (!val || isNaN(val) || val < 28 || val > 55) return null;

    // In ethnic wear, kurta chest has ~2 inches ease over body measurement
    if (val <= 37) {
      return {
        size: "M",
        reason:
          "Size M (38) provides an elegant silhouette with comfortable 1-2 inch drape.",
      };
    } else if (val <= 39) {
      return {
        size: "L",
        reason:
          "Size L (40) offers the ideal relaxed ethnic drape around bust and shoulders.",
      };
    } else if (val <= 41) {
      return {
        size: "XL",
        reason:
          "Size XL (42) guarantees ease of movement and comfortable ethnic layering.",
      };
    } else {
      return {
        size: "XXL",
        reason:
          "Size XXL (44) delivers a flattering, relaxed fit with generous ease.",
      };
    }
  }, [bustInput]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh] animate-fade-in animate-scale-up">
        {/* Top Gold Bar */}
        <div className="h-1.5 bg-gradient-to-r from-accent-gold via-yellow-500 to-accent-gold" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-gold/10 text-accent-gold flex items-center justify-center">
              <RiRulerLine size={18} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-widest text-slate-800">
                PARIWESH Size & Fit Guide
              </h3>
              <p className="text-[11px] text-slate-550">
                Standard garment measurements (Ready to wear)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Switcher if custom image exists */}
            {hasCustomImage && (
              <div className="inline-flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveView("image")}
                  className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
                    activeView === "image"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <RiImageLine size={12} />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("table")}
                  className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
                    activeView === "table"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <RiTableLine size={12} />
                  <span>Table</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <RiCloseLine size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* ========================================================= */}
          {/* VIEW A: CUSTOM IMAGE VIEW (IF ADMIN UPLOADED IMAGE)       */}
          {/* ========================================================= */}
          {activeView === "image" && hasCustomImage ? (
            <div className="space-y-4 text-center">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 shadow-inner">
                <img
                  src={sizeChart.imageUrl}
                  alt="Product Size Chart"
                  className="w-full h-auto max-h-[60vh] object-contain mx-auto rounded-lg"
                />
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * All dimensions shown in the chart above are garment
                measurements in inches.
              </p>
            </div>
          ) : (
            /* ========================================================= */
            /* VIEW B: INTERACTIVE TABLE & HOW-TO-MEASURE GUIDE          */
            /* ========================================================= */
            <div className="space-y-5">
              {/* Navigation Tabs & Unit Toggle Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex space-x-1 text-xs font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setActiveTab("kurta")}
                    className={`pb-2 border-b-2 px-3 transition cursor-pointer ${
                      activeTab === "kurta"
                        ? "border-accent-gold text-accent-gold"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Kurta / Top
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pants")}
                    className={`pb-2 border-b-2 px-3 transition cursor-pointer ${
                      activeTab === "pants"
                        ? "border-accent-gold text-accent-gold"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Pants / Bottom
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("measure")}
                    className={`pb-2 border-b-2 px-3 transition cursor-pointer ${
                      activeTab === "measure"
                        ? "border-accent-gold text-accent-gold"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    How To Measure
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("calculator")}
                    className={`pb-2 border-b-2 px-3 transition cursor-pointer flex items-center space-x-1 ${
                      activeTab === "calculator"
                        ? "border-accent-gold text-accent-gold"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <RiSparklingFill size={12} />
                    <span>Find My Size</span>
                  </button>
                </div>

                {/* Unit Switcher */}
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold font-mono">
                  <button
                    type="button"
                    onClick={() => setUnit("in")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      unit === "in"
                        ? "bg-accent-gold text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("cm")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      unit === "cm"
                        ? "bg-accent-gold text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    CM
                  </button>
                </div>
              </div>

              {/* TAB 1: KURTA MEASUREMENTS TABLE */}
              {activeTab === "kurta" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-center border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-3 px-3.5 text-left">Brand Size</th>
                          <th className="py-3 px-3">Standard</th>
                          <th className="py-3 px-3">Bust</th>
                          <th className="py-3 px-3">Waist</th>
                          <th className="py-3 px-3">Hip</th>
                          <th className="py-3 px-3">Shoulder</th>
                          <th className="py-3 px-3">Length</th>
                          <th className="py-3 px-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sizeData.map((row) => {
                          const isSelected = selectedSize === row.size;
                          return (
                            <tr
                              key={row.size}
                              onClick={() => onSelectSize(row.size)}
                              className={`transition cursor-pointer ${
                                isSelected
                                  ? "bg-amber-50/60 font-semibold"
                                  : "hover:bg-slate-50/70"
                              }`}
                            >
                              <td className="py-3.5 px-3.5 text-left flex items-center space-x-1.5 font-bold text-slate-800">
                                <span>{row.size}</span>
                                {isSelected && (
                                  <span className="text-[9px] bg-accent-gold text-white px-1.5 py-0.5 rounded font-mono font-normal uppercase tracking-wider">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-slate-500 font-mono">
                                {row.standard}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.bust}"`
                                  : `${toCm(row.bust)} cm`}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.waist}"`
                                  : `${toCm(row.waist)} cm`}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.hip}"`
                                  : `${toCm(row.hip)} cm`}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.shoulder}"`
                                  : `${toCm(row.shoulder)} cm`}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.length}"`
                                  : `${toCm(row.length)} cm`}
                              </td>
                              <td className="py-3.5 px-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectSize(row.size);
                                    onClose();
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                                    isSelected
                                      ? "bg-accent-gold text-white shadow-sm"
                                      : "border border-slate-200 text-slate-600 hover:border-accent-gold hover:text-accent-gold"
                                  }`}
                                >
                                  {isSelected ? "Selected" : "Select"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1">
                    <RiInformationLine
                      size={14}
                      className="text-accent-gold shrink-0"
                    />
                    <span>
                      Measurements are ready garment dimensions. Our ethnic wear
                      features a relaxed straight drape with 1.5 - 2 inches ease.
                    </span>
                  </p>
                </div>
              )}

              {/* TAB 2: PANTS / BOTTOM MEASUREMENTS */}
              {activeTab === "pants" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-center border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-3 px-4 text-left">Brand Size</th>
                          <th className="py-3 px-4">
                            Waist (Elastic Relaxed/Stretched)
                          </th>
                          <th className="py-3 px-4">Hip</th>
                          <th className="py-3 px-4">Pant Length</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sizeData.map((row) => {
                          const isSelected = selectedSize === row.size;
                          return (
                            <tr
                              key={row.size}
                              onClick={() => onSelectSize(row.size)}
                              className={`transition cursor-pointer ${
                                isSelected
                                  ? "bg-amber-50/60 font-semibold"
                                  : "hover:bg-slate-50/70"
                              }`}
                            >
                              <td className="py-3.5 px-4 text-left font-bold text-slate-800">
                                {row.size}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.bottomWaist}"`
                                  : `${toCm(row.bottomWaist)} cm`}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.hip}"`
                                  : `${toCm(row.hip)} cm`}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-800">
                                {unit === "in"
                                  ? `${row.bottomLength}"`
                                  : `${toCm(row.bottomLength)} cm`}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectSize(row.size);
                                    onClose();
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                                    isSelected
                                      ? "bg-accent-gold text-white"
                                      : "border border-slate-200 text-slate-600 hover:border-accent-gold hover:text-accent-gold"
                                  }`}
                                >
                                  {isSelected ? "Selected" : "Select"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-slate-550 flex items-center space-x-1.5 pt-1">
                    <RiInformationLine
                      size={14}
                      className="text-accent-gold shrink-0"
                    />
                    <span>
                      Trousers include comfort elastic waistbands with adjustable
                      drawstrings.
                    </span>
                  </p>
                </div>
              )}

              {/* TAB 3: HOW TO MEASURE GUIDE */}
              {activeTab === "measure" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[10px]">
                        1
                      </span>
                      <span>Bust (Chest)</span>
                    </div>
                    <p className="text-slate-550 leading-relaxed text-[11px]">
                      Measure around the fullest part of your bust across the
                      shoulder blades, keeping the tape horizontal and relaxed.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[10px]">
                        2
                      </span>
                      <span>Waist</span>
                    </div>
                    <p className="text-slate-550 leading-relaxed text-[11px]">
                      Measure around your natural waistline, usually the
                      narrowest point of your torso, keeping one finger between
                      tape and body.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[10px]">
                        3
                      </span>
                      <span>Hips</span>
                    </div>
                    <p className="text-slate-550 leading-relaxed text-[11px]">
                      Stand with your heels together and measure around the
                      fullest part of your hips and rear.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[10px]">
                        4
                      </span>
                      <span>Kurta Length</span>
                    </div>
                    <p className="text-slate-550 leading-relaxed text-[11px]">
                      Measured straight down from the highest point of your
                      shoulder seam to the bottom edge of the kurta hem.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: FIND MY SIZE CALCULATOR */}
              {activeTab === "calculator" && (
                <div className="p-5 bg-gradient-to-br from-amber-50/40 via-white to-slate-50 border border-[#c5a880]/30 rounded-xl space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                      Bust Size Estimator
                    </h4>
                    <p className="text-[11px] text-slate-550 mt-0.5">
                      Enter your exact body bust measurement in inches to see
                      your recommended PARIWESH size.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 max-w-sm">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="e.g. 38 or 39"
                        value={bustInput}
                        onChange={(e) => setBustInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent-gold"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold uppercase">
                        INCHES
                      </span>
                    </div>
                  </div>

                  {recommendedSize && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between gap-3 animate-fade-in">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <RiCheckLine
                            className="text-emerald-600 font-bold"
                            size={18}
                          />
                          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                            Recommended Size:{" "}
                            <span className="text-sm font-extrabold text-accent-gold underline">
                              {recommendedSize.size}
                            </span>
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          {recommendedSize.reason}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectSize(recommendedSize.size);
                          onClose();
                        }}
                        className="bg-accent-gold hover:bg-yellow-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-2 rounded shadow-sm transition shrink-0 cursor-pointer"
                      >
                        Choose {recommendedSize.size}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            Selected Size:{" "}
            <strong className="text-slate-800 uppercase font-mono">
              {selectedSize || "None"}
            </strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeChartModal;
