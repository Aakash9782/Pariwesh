import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiPrinterLine,
  RiExternalLinkLine,
  RiBarcodeLine,
  RiTruckLine,
  RiCheckDoubleLine,
} from "react-icons/ri";

/**
 * Lightweight, self-contained Code 128 (Subset B) SVG barcode generator.
 * Zero external npm dependencies. 100% compliant with standard barcode scanners.
 */
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (104=StartB, 106=Stop)
];

const encodeCode128B = (text) => {
  const clean = String(text || "").replace(/[^\x20-\x7E]/g, "");
  if (!clean) return null;

  const codes = [104]; // Start Code B
  let checksum = 104;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(106); // Stop code

  let patternStr = "";
  for (const c of codes) {
    patternStr += CODE128_PATTERNS[c] || "";
  }

  // Convert width digits to bar/space sequences
  let isBar = true;
  let svgPaths = [];
  let currentX = 10;
  const barHeight = 50;

  for (let i = 0; i < patternStr.length; i++) {
    const width = parseInt(patternStr[i], 10) * 1.8;
    if (isBar) {
      svgPaths.push(
        `<rect x="${currentX}" y="0" width="${width}" height="${barHeight}" fill="#000000" />`
      );
    }
    currentX += width;
    isBar = !isBar;
  }

  const totalWidth = currentX + 10;
  return {
    svgHtml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${barHeight}" width="100%" height="${barHeight}" preserveAspectRatio="none" style="display:block;">${svgPaths.join("")}</svg>`,
    totalWidth,
  };
};

/**
 * Generate 4x6 thermal printable HTML
 */
export const buildPrintableLabelHtml = (order, brandSettings = {}) => {
  const rawLogo =
    brandSettings.brandLogoUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("brandLogoUrl")
      : "") ||
    "/logo.png";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const logoSrc =
    rawLogo.startsWith("http") || rawLogo.startsWith("data:")
      ? rawLogo
      : `${origin}${rawLogo.startsWith("/") ? "" : "/"}${rawLogo}`;

  const seller = {
    name: brandSettings.brandName || "PARIWESH",
    address:
      brandSettings.registeredAddress ||
      "Plot No. 12, Sanganer Industrial Area, Jaipur, Rajasthan - 302029",
    phone: brandSettings.supportPhone || "+91 97826 81155",
    gstin: brandSettings.gstinNumber || "08AAPPP1234A1Z9",
  };

  const awbNumber = order.awbCode || order.trackingId || "";
  const courierName =
    order.courierName || order.shippingProvider || "Surface Express";
  const isAwbReady = !!awbNumber;

  const barcodeValue = isAwbReady ? awbNumber : order.orderId;
  const barcode = encodeCode128B(barcodeValue);
  const orderBarcode = encodeCode128B(order.orderId);

  const customerName =
    order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const customerPhone =
    order.shippingAddress?.phone || order.customer?.phone || "";
  const customerStreet = order.shippingAddress?.street || "";
  const customerCity = order.shippingAddress?.city || "";
  const customerState = order.shippingAddress?.state || "Rajasthan";
  const customerPincode = order.shippingAddress?.pincode || "000000";

  const isCOD = order.paymentMethod === "COD";
  const grandTotal = Number(order.pricing?.grandTotal || 0);

  const totalUnits = (order.items || []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 1),
    0
  );
  const calculatedWeight = Math.max(
    0.5,
    Math.round(totalUnits * 0.45 * 100) / 100
  );

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const itemsListHtml = (order.items || [])
    .map(
      (it) =>
        `<tr>
          <td style="padding: 3.5px 6px; font-size: 10px; font-weight: bold; font-family: monospace; color: #111;">${it.sku || it.name || "PRW-ITEM"}</td>
          <td style="padding: 3.5px 6px; font-size: 10px; text-align: center; font-weight: bold; color: #111;">${it.quantity}</td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shipping Label - ${order.orderId}</title>
  <style>
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-size: 11px;
      line-height: 1.25;
    }
    .label-container {
      width: 100mm;
      min-height: 150mm;
      max-width: 100mm;
      margin: 0 auto;
      padding: 6mm 5mm;
      border: 2px solid #000;
      background: #fff;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .brand-logo {
      height: 30px;
      max-width: 120px;
      object-fit: contain;
    }
    .brand-text {
      display: inline-block;
      vertical-align: middle;
      margin-right: 6px;
    }
    .brand-name {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      display: inline-block;
      vertical-align: middle;
    }
    .brand-sub {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #333;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .courier-cell {
      text-align: center;
      padding: 5px 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
    .courier-name {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .courier-sub {
      font-size: 8.5px;
      font-weight: 700;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    /* AWB Barcode Section */
    .awb-section {
      border-bottom: 2px solid #000;
      padding: 6px 8px 4px 8px;
      text-align: center;
    }
    .barcode-svg-wrap {
      max-width: 290px;
      margin: 0 auto;
    }
    .awb-text {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 2px;
      font-family: monospace;
      margin-top: 3px;
    }
    .manual-awb-box {
      border: 1.5px dashed #444;
      padding: 10px 6px;
      background: #fafafa;
      font-size: 9px;
      font-weight: 800;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Payment & Specs Grid */
    .specs-row {
      border-bottom: 2px solid #000;
    }
    .payment-cell {
      border-right: 2px solid #000;
      text-align: center;
      padding: 6px 4px;
      vertical-align: middle !important;
    }
    .cod-box {
      background: #000;
      color: #fff;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 6px 2px;
    }
    .cod-title {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .cod-amount {
      font-size: 17px;
      font-weight: 900;
      margin-top: 1px;
      letter-spacing: 0.5px;
    }
    .prepaid-box {
      background: #fff;
      color: #000;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 6px 2px;
    }
    .prepaid-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .prepaid-note {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    .meta-cell {
      padding: 4px 6px;
      font-size: 9.5px;
      line-height: 1.4;
      vertical-align: middle !important;
    }
    .meta-line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 2px 0;
    }
    .meta-line:last-child {
      border-bottom: none;
    }

    /* Ship To & Pincode Grid */
    .shipto-row {
      border-bottom: 2px solid #000;
    }
    .address-cell {
      border-right: 2px solid #000;
      padding: 5px 6px;
    }
    .cell-header-label {
      font-size: 8.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #333;
      margin-bottom: 2px;
    }
    .customer-name {
      font-size: 13px;
      font-weight: 900;
      color: #000;
      text-transform: uppercase;
    }
    .customer-address {
      font-size: 10px;
      line-height: 1.35;
      margin-top: 2px;
      color: #111;
    }
    .pincode-cell {
      text-align: center;
      padding: 6px 4px;
      vertical-align: middle !important;
      background: #fff;
    }
    .pincode-title {
      font-size: 8.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #333;
    }
    .pincode-big {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 2px;
      line-height: 1.1;
      margin: 3px 0;
      font-family: Arial, sans-serif;
    }
    .pincode-state {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #222;
    }

    /* Return Address Section */
    .return-section {
      border-bottom: 2px solid #000;
      padding: 4px 6px;
      font-size: 9px;
      line-height: 1.3;
      background: #fafafa;
    }

    /* Items Manifest Table */
    .manifest-table {
      border-bottom: 2px solid #000;
    }
    .manifest-table th {
      background: #f0f0f0;
      border-bottom: 1.5px solid #000;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 6px;
    }
    .manifest-table td {
      border-bottom: 1px solid #e0e0e0;
      padding: 3px 6px;
      font-size: 9.5px;
    }
    .total-row td {
      border-top: 1.5px solid #000;
      border-bottom: none;
      font-weight: 900;
      background: #fafafa;
    }

    /* Secondary Order Barcode Footer */
    .footer-section {
      padding: 5px 6px;
      text-align: center;
      margin-top: auto;
    }
    .order-barcode-wrap {
      max-width: 200px;
      margin: 0 auto;
    }
    .order-ref-text {
      font-size: 9px;
      font-weight: 800;
      font-family: monospace;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .disclaimer-text {
      font-size: 7.5px;
      color: #555;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .label-wrapper {
        border: 2px solid #000;
        width: 100mm;
        min-height: 148mm;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="label-wrapper">
    <!-- Row 1: Header (Brand Left | Courier Right) -->
    <table class="grid-table header-row">
      <tr>
        <td class="brand-cell" style="width: 58%;">
          <div style="display: flex; align-items: center;">
            <img id="label-logo" src="${logoSrc}" alt="${seller.name}" class="brand-logo" onerror="this.style.display='none'" />
            <div>
              <div class="brand-name">${seller.name}</div>
              <div class="brand-sub">Direct Dispatch Parcel</div>
            </div>
          </div>
        </td>
        <td class="courier-cell" style="width: 42%;">
          <div class="courier-name">
            ${isAwbReady ? courierName : "SPEED POST / MANUAL"}
          </div>
          <div class="courier-sub">STANDARD SURFACE</div>
        </td>
      </tr>
    </table>

    <!-- Row 2: AWB Barcode Block -->
    <div class="awb-section">
      ${
        isAwbReady
          ? `
        <div class="barcode-svg-wrap">${barcode?.svgHtml || ""}</div>
        <div class="awb-text">AWB: ${awbNumber}</div>
      `
          : `
        <div class="manual-awb-box">
          <div>[ AFFIX SPEED POST / COURIER TRACKING BARCODE HERE ]</div>
          <div style="font-size: 10px; font-family: monospace; margin-top: 3px; font-weight: bold;">
            Order Ref: ${order.orderId}
          </div>
        </div>
      `
      }
    </div>

    <!-- Row 3: Payment Type & Parcel Specs (50/50 Split) -->
    <table class="grid-table specs-row">
      <tr>
        <td class="payment-cell" style="width: 50%; padding: 0;">
          ${
            isCOD
              ? `
            <div class="cod-box">
              <div class="cod-title">CASH ON DELIVERY (COD)</div>
              <div class="cod-amount">₹${grandTotal.toLocaleString("en-IN")}</div>
            </div>
          `
              : `
            <div class="prepaid-box">
              <div class="prepaid-title">PREPAID</div>
              <div class="prepaid-note">DO NOT COLLECT CASH</div>
            </div>
          `
          }
        </td>
        <td class="meta-cell" style="width: 50%;">
          <div class="meta-line">
            <span><strong>Date:</strong></span>
            <span>${orderDate}</span>
          </div>
          <div class="meta-line">
            <span><strong>Weight:</strong></span>
            <span>${calculatedWeight} KG</span>
          </div>
          <div class="meta-line">
            <span><strong>Dimensions:</strong></span>
            <span>28 x 22 x 5 CM</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Row 4: Ship To & Pincode Grid (70/30 Split) -->
    <table class="grid-table shipto-row">
      <tr>
        <td class="address-cell" style="width: 70%;">
          <div class="cell-header-label">SHIP TO / DELIVER TO:</div>
          <div class="customer-name">${customerName}</div>
          <div class="customer-address">
            ${customerStreet}<br />
            ${customerCity ? `${customerCity}, ` : ""}${customerState} - <strong>${customerPincode}</strong><br />
            <div style="margin-top: 3px; font-weight: bold;">
              Phone: ${customerPhone}
            </div>
          </div>
        </td>
        <td class="pincode-cell" style="width: 30%;">
          <div class="pincode-title">DESTINATION</div>
          <div class="pincode-big">${customerPincode}</div>
          <div class="pincode-state">${customerState}</div>
        </td>
      </tr>
    </table>

    <!-- Row 5: Return Address / Shipped By -->
    <div class="return-section">
      <div class="cell-header-label" style="margin-bottom: 1px;">SHIPPED BY (If undelivered, please return to):</div>
      <div>
        <strong>${seller.name}</strong>, ${seller.address}<br />
        <strong>Phone:</strong> ${seller.phone} &nbsp;|&nbsp; <strong>GSTIN:</strong> ${seller.gstin}
      </div>
    </div>

    <!-- Row 6: Item Manifest (Security Compliant: SKU Code & Qty Only) -->
    <table class="grid-table manifest-table">
      <thead>
        <tr>
          <th style="width: 78%; text-align: left;">SKU Code</th>
          <th style="width: 22%; text-align: center;">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsListHtml}
        <tr class="total-row">
          <td style="font-weight: bold; font-size: 9px;">Total Package Items</td>
          <td style="text-align: center; font-weight: bold; font-size: 9px;">${totalUnits}</td>
        </tr>
      </tbody>
    </table>

    <!-- Row 7: Order ID Barcode & Legal Disclaimer -->
    <div class="footer-section">
      ${
        orderBarcode
          ? `
        <div class="order-barcode-wrap">${orderBarcode.svgHtml}</div>
        <div class="order-ref-text">Order No: ${order.orderId}</div>
      `
          : `
        <div class="order-ref-text">Order No: ${order.orderId}</div>
      `
      }
      <div class="disclaimer-text">
        This is a computer generated label and does not require physical signature.
      </div>
    </div>
  </div>

  <script>
    function triggerPrint() {
      setTimeout(function() {
        window.print();
      }, 250);
    }
    window.onload = function() {
      var img = document.getElementById("label-logo");
      if (!img || img.complete) {
        triggerPrint();
      } else {
        img.onload = triggerPrint;
        img.onerror = triggerPrint;
      }
    };
  </script>
</body>
</html>
  `;
};

/**
 * ShippingLabelModal Component for Admin preview and printing
 */
const ShippingLabelModal = ({
  isOpen,
  onClose,
  order,
  brandSettings = {},
}) => {
  if (!isOpen || !order) return null;

  const rawLogo =
    brandSettings.brandLogoUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("brandLogoUrl")
      : "") ||
    "/logo.png";

  const seller = {
    name: brandSettings.brandName || "PARIWESH",
    address:
      brandSettings.registeredAddress ||
      "Plot No. 12, Sanganer Industrial Area, Jaipur, Rajasthan - 302029",
    phone: brandSettings.supportPhone || "+91 97826 81155",
    gstin: brandSettings.gstinNumber || "08AAPPP1234A1Z9",
    logoUrl: rawLogo,
  };

  const awbNumber = order.awbCode || order.trackingId || "";
  const courierName =
    order.courierName || order.shippingProvider || "Surface Express";
  const isAwbReady = !!awbNumber;

  const barcodeValue = isAwbReady ? awbNumber : order.orderId;
  const barcode = encodeCode128B(barcodeValue);
  const orderBarcode = encodeCode128B(order.orderId);

  const customerName =
    order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const customerPhone =
    order.shippingAddress?.phone || order.customer?.phone || "";
  const customerStreet = order.shippingAddress?.street || "";
  const customerCity = order.shippingAddress?.city || "";
  const customerState = order.shippingAddress?.state || "Rajasthan";
  const customerPincode = order.shippingAddress?.pincode || "000000";

  const isCOD = order.paymentMethod === "COD";
  const grandTotal = Number(order.pricing?.grandTotal || 0);

  const totalUnits = (order.items || []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 1),
    0
  );
  const calculatedWeight = Math.max(
    0.5,
    Math.round(totalUnits * 0.45 * 100) / 100
  );

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const handlePrint = () => {
    const html = buildPrintableLabelHtml(order, brandSettings);
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert("Please allow popups for this site to print shipping labels.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/65 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg shadow-2xl border border-neutral-200 w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden text-neutral-900 font-sans"
        >
          {/* Top Actions Bar */}
          <div className="bg-neutral-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <h3 className="text-sm font-semibold tracking-wide font-sans">
                Shiprocket Thermal Label (4x6" Grid)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {order.shippingLabelUrl && (
                <a
                  href={order.shippingLabelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition"
                  title="Open official Shiprocket courier label PDF"
                >
                  <RiExternalLinkLine size={13} />
                  Shiprocket Label
                </a>
              )}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded shadow transition"
              >
                <RiPrinterLine size={15} />
                Print Label (4x6)
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                aria-label="Close"
              >
                <RiCloseLine size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Label Preview (Exact Shiprocket Thermal 4x6 Box-in-Box Grid) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral-100 flex justify-center">
            <div className="bg-white border-2 border-black w-full max-w-[380px] shadow-lg text-[11px] leading-tight select-none">
              {/* Row 1: Header (Brand Left | Courier Right) */}
              <div className="grid grid-cols-12 border-b-2 border-black">
                <div className="col-span-7 p-2 border-r-2 border-black flex items-center gap-2">
                  <img
                    src={seller.logoUrl}
                    alt={seller.name}
                    className="h-7 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider leading-none">
                      {seller.name}
                    </h2>
                    <p className="text-[7.5px] font-bold text-neutral-600 uppercase tracking-wider mt-0.5">
                      Direct Dispatch Parcel
                    </p>
                  </div>
                </div>
                <div className="col-span-5 p-2 text-center flex flex-col justify-center items-center bg-neutral-50">
                  <div className="text-xs font-black uppercase tracking-wide leading-tight">
                    {isAwbReady ? courierName : "SPEED POST / MANUAL"}
                  </div>
                  <div className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
                    Standard Surface
                  </div>
                </div>
              </div>

              {/* Row 2: AWB Barcode Block */}
              <div className="border-b-2 border-black p-2.5 text-center bg-white">
                {isAwbReady ? (
                  <>
                    <div
                      className="flex justify-center max-w-[280px] mx-auto"
                      dangerouslySetInnerHTML={{
                        __html: barcode?.svgHtml || "",
                      }}
                    />
                    <div className="font-mono text-xs font-black tracking-widest mt-1">
                      AWB: {awbNumber}
                    </div>
                  </>
                ) : (
                  <div className="border border-dashed border-neutral-500 p-2 text-[9px] text-neutral-600 bg-neutral-50">
                    <strong className="tracking-wide">
                      [ AFFIX SPEED POST / COURIER TRACKING BARCODE HERE ]
                    </strong>
                    <div className="font-mono text-[10px] mt-0.5 font-bold">
                      Order Ref: {order.orderId}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Payment & Package Specs Grid */}
              <div className="grid grid-cols-2 border-b-2 border-black">
                {/* Left: Payment Box */}
                <div className="border-r-2 border-black flex flex-col justify-center">
                  {isCOD ? (
                    <div className="bg-black text-white p-2.5 text-center h-full flex flex-col justify-center items-center">
                      <div className="text-xs font-black tracking-widest uppercase">
                        CASH ON DELIVERY
                      </div>
                      <div className="text-base font-black tracking-wide mt-0.5">
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white text-black p-2.5 text-center h-full flex flex-col justify-center items-center">
                      <div className="text-xs font-black tracking-widest uppercase">
                        PREPAID
                      </div>
                      <div className="text-[9px] font-extrabold text-neutral-700 uppercase mt-0.5">
                        DO NOT COLLECT CASH
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Package Specs */}
                <div className="p-2 text-[9.5px] space-y-1 bg-white flex flex-col justify-center">
                  <div className="flex justify-between border-b border-neutral-200 pb-0.5">
                    <span className="font-bold text-neutral-600">Date:</span>
                    <span className="font-bold text-black">{orderDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-200 pb-0.5">
                    <span className="font-bold text-neutral-600">Weight:</span>
                    <span className="font-bold text-black">
                      {calculatedWeight} KG
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-neutral-600">Dims:</span>
                    <span className="font-bold text-black">28x22x5 CM</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Ship To & Pincode Grid (70/30) */}
              <div className="grid grid-cols-12 border-b-2 border-black">
                <div className="col-span-8 p-2 border-r-2 border-black space-y-0.5">
                  <div className="text-[8.5px] font-black uppercase text-neutral-500 tracking-wider">
                    SHIP TO / DELIVER TO:
                  </div>
                  <div className="font-black text-xs text-black uppercase">
                    {customerName}
                  </div>
                  <div className="text-[10px] text-neutral-800 leading-tight">
                    {customerStreet}
                    <br />
                    {customerCity ? `${customerCity}, ` : ""}
                    {customerState} - <strong>{customerPincode}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-black pt-0.5">
                    Phone: {customerPhone}
                  </div>
                </div>
                <div className="col-span-4 p-2 flex flex-col justify-center items-center text-center bg-white">
                  <div className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">
                    DESTINATION
                  </div>
                  <div className="text-xl font-black tracking-wider text-black my-0.5 font-mono">
                    {customerPincode}
                  </div>
                  <div className="text-[8px] font-black text-neutral-800 uppercase tracking-wide">
                    {customerState}
                  </div>
                </div>
              </div>

              {/* Row 5: Return Address / Shipped By */}
              <div className="border-b-2 border-black p-2 text-[9px] bg-neutral-50 leading-tight">
                <div className="text-[8px] font-black uppercase text-neutral-500 tracking-wider mb-0.5">
                  SHIPPED BY (If undelivered, please return to):
                </div>
                <div className="text-neutral-800">
                  <strong>{seller.name}</strong>, {seller.address}
                </div>
                <div className="text-neutral-700 mt-0.5">
                  <strong>Phone:</strong> {seller.phone} &nbsp;|&nbsp;{" "}
                  <strong>GSTIN:</strong> {seller.gstin}
                </div>
              </div>

              {/* Row 6: Item Manifest (Security Compliant: SKU Code & Qty Only) */}
              <div className="border-b-2 border-black">
                <table className="w-full text-left text-[9.5px]">
                  <thead className="bg-neutral-100 border-b border-black text-[8px] uppercase font-black text-neutral-700">
                    <tr>
                      <th className="py-1 px-2 border-r border-neutral-300">
                        SKU Code
                      </th>
                      <th className="py-1 px-2 text-center w-16">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {(order.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1 px-2 font-mono font-bold text-neutral-900 border-r border-neutral-200 truncate">
                          {it.sku || it.name || "PRW-ITEM"}
                        </td>
                        <td className="py-1 px-2 text-center font-bold text-neutral-900">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-neutral-50 font-bold border-t border-black text-[8.5px]">
                      <td className="py-1 px-2 border-r border-neutral-200">
                        Total Package Items
                      </td>
                      <td className="py-1 px-2 text-center">{totalUnits}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Row 7: Secondary Order Barcode Footer */}
              <div className="p-2 text-center bg-white space-y-0.5">
                {orderBarcode && (
                  <div
                    className="flex justify-center max-w-[180px] mx-auto"
                    dangerouslySetInnerHTML={{
                      __html: orderBarcode.svgHtml,
                    }}
                  />
                )}
                <div className="font-mono text-[9px] font-bold text-black tracking-wider">
                  Order No: {order.orderId}
                </div>
                <div className="text-[7.5px] text-neutral-500 uppercase tracking-tight">
                  This is a computer generated label and does not require physical
                  signature.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShippingLabelModal;
