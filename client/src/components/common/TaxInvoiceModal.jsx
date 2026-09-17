import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiPrinterLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import API from "../../services/api.js";

/**
 * Utility: Number to Indian Rupees in words
 */
const numberToWordsInr = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return "Zero Rupees Only";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty ",
    "Thirty ",
    "Forty ",
    "Fifty ",
    "Sixty ",
    "Seventy ",
    "Eighty ",
    "Ninety ",
  ];

  const inWords = (val) => {
    let str = "";
    if (val > 9999999) {
      str += inWords(Math.floor(val / 10000000)) + "Crore ";
      val %= 10000000;
    }
    if (val > 99999) {
      str += inWords(Math.floor(val / 100000)) + "Lakh ";
      val %= 100000;
    }
    if (val > 999) {
      str += inWords(Math.floor(val / 1000)) + "Thousand ";
      val %= 1000;
    }
    if (val > 99) {
      str += inWords(Math.floor(val / 100)) + "Hundred ";
      val %= 100;
    }
    if (val > 0) {
      if (str !== "") str += "And ";
      if (val < 20) str += a[val];
      else {
        str += b[Math.floor(val / 10)];
        if (val % 10) str += a[val % 10];
      }
    }
    return str;
  };

  return `${inWords(n).replace(/\s+/g, " ").trim()} Rupees Only`;
};

/**
 * Robust helper: Indian GST State Code mapping (all 36 States & UTs)
 */
export const getStateCode = (stateStr = "", gstin = "") => {
  if (gstin && typeof gstin === "string" && /^\d{2}/.test(gstin.trim())) {
    return gstin.trim().slice(0, 2);
  }
  const s = String(stateStr || "").toLowerCase().trim();
  const stateCodeMap = {
    "jammu and kashmir": "01",
    jk: "01",
    "himachal pradesh": "02",
    hp: "02",
    punjab: "03",
    pb: "03",
    chandigarh: "04",
    ch: "04",
    uttarakhand: "05",
    uk: "05",
    haryana: "06",
    hr: "06",
    delhi: "07",
    dl: "07",
    rajasthan: "08",
    rj: "08",
    "uttar pradesh": "09",
    up: "09",
    bihar: "10",
    br: "10",
    sikkim: "11",
    sk: "11",
    "arunachal pradesh": "12",
    ar: "12",
    nagaland: "13",
    nl: "13",
    manipur: "14",
    mn: "14",
    mizoram: "15",
    mz: "15",
    tripura: "16",
    tr: "16",
    meghalaya: "17",
    ml: "17",
    assam: "18",
    as: "18",
    "west bengal": "19",
    wb: "19",
    jharkhand: "20",
    jh: "20",
    odisha: "21",
    or: "21",
    chhattisgarh: "22",
    cg: "22",
    "madhya pradesh": "23",
    mp: "23",
    gujarat: "24",
    gj: "24",
    maharashtra: "27",
    mh: "27",
    "andhra pradesh": "28",
    ap: "28",
    karnataka: "29",
    ka: "29",
    goa: "30",
    ga: "30",
    kerala: "32",
    kl: "32",
    "tamil nadu": "33",
    tn: "33",
    puducherry: "34",
    py: "34",
    telangana: "36",
    ts: "36",
    andhra: "37",
    ladakh: "38",
  };

  for (const [key, code] of Object.entries(stateCodeMap)) {
    if (s === key || s.includes(key)) {
      return code;
    }
  }
  return "08";
};

/**
 * Checks if a given state is intra-state matching the seller's state
 */
export const isRajasthanState = (stateStr = "", sellerState = "Rajasthan") => {
  const s = String(stateStr || "").toLowerCase().trim();
  const seller = String(sellerState || "Rajasthan").toLowerCase().trim();
  return (
    s === "08" ||
    s === "rj" ||
    s.includes(seller) ||
    s.includes("rajasthan") ||
    s.includes("rajastan") ||
    s.startsWith("raj")
  );
};

/**
 * Dynamically parse address into clean display lines
 */
export const splitAddressLines = (addressStr = "", fallback = []) => {
  if (!addressStr || typeof addressStr !== "string") return fallback;
  const lines = addressStr.includes("\n")
    ? addressStr.split(/\r?\n/)
    : addressStr.split(",");
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  return clean.length > 0 ? clean : fallback;
};

/**
 * Detect Indian State from an address string
 */
export const detectStateFromAddress = (addressStr = "", defaultState = "Rajasthan") => {
  if (!addressStr || typeof addressStr !== "string") return defaultState;
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry"
  ];
  for (const st of indianStates) {
    if (new RegExp(`\\b${st}\\b`, "i").test(addressStr)) {
      return st;
    }
  }
  return defaultState;
};

/**
 * Format Date as DD/MM/YYYY
 */
const formatDateDdMmYyyy = (dateVal) => {
  const d = new Date(dateVal || Date.now());
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Generates the clean standalone printable HTML string for window.print()
 */
export const buildPrintableInvoiceHtml = (order, brandSettings = {}) => {
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

  const brandName = brandSettings.brandName || "PARIWESH";
  const sellerGstin = (brandSettings.gstinNumber || "").trim();
  const sellerPhone =
    brandSettings.supportPhone || brandSettings.phone || "";
  const addressLines = splitAddressLines(brandSettings.registeredAddress, [
    "13 Goutam Vihar Gajsinghpura",
    "Ajmer Road Jaipur",
    "Jaipur 302021",
    "Rajasthan, India",
  ]);
  const sellerState = detectStateFromAddress(
    brandSettings.registeredAddress,
    "Rajasthan"
  );
  const sellerStateCode = getStateCode(sellerState, sellerGstin);

  const invoiceNo =
    order.invoiceNumber ||
    (order.orderId ? `INV-${order.orderId}` : `INV-${Date.now().toString().slice(-6)}`);
  const invoiceDate = formatDateDdMmYyyy(
    order.invoiceDate || order.createdAt || Date.now()
  );
  const orderDate = formatDateDdMmYyyy(order.createdAt || Date.now());

  const customerName =
    order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const customerPhone =
    order.shippingAddress?.phone || order.customer?.phone || "";
  const customerStreet = order.shippingAddress?.street || "";
  const customerCity = order.shippingAddress?.city || "";
  const customerState = order.shippingAddress?.state || "Rajasthan";
  const customerPincode = order.shippingAddress?.pincode || "";
  const customerStateCode = getStateCode(customerState);

  // Intra-state vs Inter-state determination
  const isIntraState = isRajasthanState(customerState, sellerState);

  // Courier and payment info
  const awbNumber = order.awbCode || order.trackingId || "";
  const courierName =
    order.courierName ||
    order.shippingProvider ||
    (awbNumber ? "Surface Courier" : "Standard Dispatch");
  const paymentMethodDisplay = String(
    order.paymentMethod || "Prepaid"
  ).toUpperCase();
  const eWaybillNo = order.eWaybillNo || "";

  // Items calculation with dynamic GST rate per item
  const items = (order.items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const grossTotal = price * qty;
    const gstRate = Number(item.gstRate ?? 5) || 5;
    const taxableTotal = grossTotal / (1 + gstRate / 100);
    const gstTotal = grossTotal - taxableTotal;
    const hsn = item.hsnCode || "6204";
    const sku = item.sku || item.productId || "-";

    return {
      sno: idx + 1,
      name: item.name || "Product Item",
      sku,
      hsn,
      qty,
      unitPrice: price,
      taxableTotal,
      gstTotal,
      grossTotal,
    };
  });

  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);
  const totalTaxable = items.reduce((acc, i) => acc + i.taxableTotal, 0);
  const totalGst = items.reduce((acc, i) => acc + i.gstTotal, 0);
  const grandTotal =
    Number(order.pricing?.grandTotal) ||
    items.reduce((acc, i) => acc + i.grossTotal, 0);

  const cgstAmount = isIntraState ? totalGst / 2 : 0;
  const sgstAmount = isIntraState ? totalGst / 2 : 0;
  const igstAmount = !isIntraState ? totalGst : 0;

  const itemRowsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #000; vertical-align: top; font-size: 11px; text-align: left;">
        <strong>${item.name}</strong><br />
        <span style="font-size: 10px; color: #111;">SKU : ${item.sku}</span>
      </td>
      <td style="padding: 6px 4px; border: 1px solid #000; text-align: center; vertical-align: top; font-size: 11px;">${item.hsn}</td>
      <td style="padding: 6px 4px; border: 1px solid #000; text-align: center; vertical-align: top; font-size: 11px;">${item.qty}</td>
      <td style="padding: 6px 6px; border: 1px solid #000; text-align: right; vertical-align: top; font-size: 11px;">${item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="padding: 6px 6px; border: 1px solid #000; text-align: right; vertical-align: top; font-size: 11px;">${item.taxableTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      ${
        isIntraState
          ? `
        <td style="padding: 6px 6px; border: 1px solid #000; text-align: right; vertical-align: top; font-size: 11px;">${(item.gstTotal / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="padding: 6px 6px; border: 1px solid #000; text-align: right; vertical-align: top; font-size: 11px;">${(item.gstTotal / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      `
          : `
        <td style="padding: 6px 6px; border: 1px solid #000; text-align: right; vertical-align: top; font-size: 11px;">${item.gstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      `
      }
      <td style="padding: 6px 6px; border: 1px solid #000; text-align: right; vertical-align: top; font-size: 11px; font-weight: bold;">${item.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${invoiceNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.35;
    }
    .invoice-card {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 18px 22px;
      background: #fff;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .two-col-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      margin-bottom: 14px;
    }
    .items-table th {
      background-color: #d8d8d8;
      border: 1px solid #000;
      padding: 6px 4px;
      font-size: 10.5px;
      font-weight: bold;
      text-align: center;
      color: #000;
    }
    .items-table td {
      border: 1px solid #000;
    }
    .net-total-row td {
      background-color: #d8d8d8;
      font-weight: bold;
      border: 1px solid #000;
      padding: 6px 6px;
      font-size: 11px;
    }
    .words-box {
      width: 100%;
      border: 1.5px solid #000;
      margin-bottom: 14px;
    }
    .words-box td {
      padding: 7px 12px;
      font-size: 11.5px;
    }
    .terms-box {
      width: 100%;
      border: 1.5px solid #000;
      border-collapse: collapse;
    }
    .terms-box td {
      padding: 8px 12px;
      vertical-align: top;
    }
    .reverse-charge {
      font-size: 10.5px;
      margin-top: 5px;
      color: #000;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-card {
        border: 2px solid #000;
        max-width: 100%;
        padding: 16px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Top Header: Logo on Left | TAX INVOICE + Powered by Brand on Right -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: middle; width: 50%;">
          <img id="invoice-logo" src="${logoSrc}" alt="${brandName}" style="height: 52px; max-width: 180px; object-fit: contain; display: block;" onerror="this.style.display='none'" />
        </td>
        <td style="vertical-align: middle; text-align: right; width: 50%;">
          <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">TAX INVOICE</div>
          <div style="font-size: 11px; color: #222; margin-top: 2px;">Powered by ${brandName}</div>
        </td>
      </tr>
    </table>

    <!-- Two-Column Block: Sold By | Delivered To -->
    <table class="two-col-table">
      <tr>
        <!-- Left Column: Sold By -->
        <td style="width: 50%; vertical-align: top; padding-right: 15px;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; text-align: center;">Sold By:</div>
          <div style="font-size: 11px; line-height: 1.35;">
            <strong>${brandName}</strong><br />
            ${addressLines.join("<br />")}<br />
            ${sellerState ? `${sellerState}<br />` : ""}
            State Code : ${sellerStateCode}<br />
            ${sellerPhone ? `Ph: ${sellerPhone}<br />` : ""}
            ${sellerGstin ? `GSTIN No.: ${sellerGstin}` : ""}
          </div>
          <div style="margin-top: 14px; font-size: 11px; line-height: 1.45;">
            <div><strong>Invoice No. :</strong> ${invoiceNo}</div>
            <div><strong>Invoice Date :</strong> ${invoiceDate}</div>
            <div><strong>Order No. :</strong> ${order.orderId || "-"}</div>
            <div><strong>Order Date :</strong> ${orderDate}</div>
          </div>
        </td>

        <!-- Right Column: Delivered To -->
        <td style="width: 50%; vertical-align: top; padding-left: 15px;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; text-align: center;">Delivered To:</div>
          <div style="font-size: 11px; line-height: 1.35;">
            <strong>${customerName}</strong><br />
            ${customerStreet}<br />
            ${customerCity ? `${customerCity} ` : ""}${customerPincode}<br />
            ${customerState}<br />
            India<br />
            State Code : ${customerStateCode}
            ${customerPhone ? `<br />Ph: ${customerPhone}` : ""}
          </div>
          <div style="margin-top: 14px; font-size: 11px; line-height: 1.45;">
            <div><strong>Payment Method :</strong> ${paymentMethodDisplay}</div>
            <div><strong>Shipped By :</strong> ${courierName}</div>
            <div><strong>AWB No. :</strong> ${awbNumber || "-"}</div>
            <div><strong>eWaybill No. :</strong> ${eWaybillNo || "-"}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Main Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 36%;">Description</th>
          <th style="width: 8%;">HSN</th>
          <th style="width: 5%;">Qty</th>
          <th style="width: 12%;">Unit Price</th>
          <th style="width: 13%;">Taxable Value</th>
          ${
            isIntraState
              ? `
            <th style="width: 8%;">CGST</th>
            <th style="width: 8%;">SGST</th>
          `
              : `
            <th style="width: 16%;">IGST</th>
          `
          }
          <th style="width: 13%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        <tr class="net-total-row">
          <td style="text-align: center; font-weight: bold;">Net Total</td>
          <td style="border: 1px solid #000;"></td>
          <td style="text-align: center; font-weight: bold;">${totalQty}</td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000; text-align: right;">${totalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          ${
            isIntraState
              ? `
            <td style="border: 1px solid #000; text-align: right;">${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="border: 1px solid #000; text-align: right;">${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          `
              : `
            <td style="border: 1px solid #000; text-align: right;">${igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          `
          }
          <td style="text-align: right; font-weight: bold;">${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <!-- Net Amount Payable (In Words) Box -->
    <table class="words-box">
      <tr>
        <td style="font-weight: bold; width: 45%; text-align: left;">
          Net Amount Payable (In Words):
        </td>
        <td style="text-align: right; font-weight: 500;">
          ${numberToWordsInr(grandTotal)}
        </td>
      </tr>
    </table>

    <!-- Bottom Box: Legal Policy on Left | Authorised Signature on Right -->
    <table class="terms-box">
      <tr>
        <td style="width: 60%; border-right: 1.5px solid #000; font-size: 10.5px; line-height: 1.45;">
          <div>All disputes are subject to ${sellerState} jurisdiction only.</div>
          <div style="margin-top: 8px;">
            Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.
          </div>
        </td>
        <td style="width: 40%; text-align: center; vertical-align: top;">
          <div style="font-size: 11px; font-weight: bold;">Authorised Signature for</div>
          <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; margin-top: 3px;">
            ${brandName}
          </div>
          <div style="height: 38px;"></div>
        </td>
      </tr>
    </table>

    <!-- Reverse Charge Note -->
    <div class="reverse-charge">
      Whether tax is payable under reverse charge:No
    </div>
  </div>

  <script>
    function triggerPrint() {
      setTimeout(function() {
        window.print();
      }, 250);
    }
    window.onload = function() {
      var img = document.getElementById("invoice-logo");
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
 * TaxInvoiceModal Component for interactive on-screen preview & printing
 */
const TaxInvoiceModal = ({
  isOpen,
  onClose,
  order,
  brandSettings = {},
}) => {
  const [liveSettings, setLiveSettings] = useState(brandSettings || {});

  useEffect(() => {
    if (
      brandSettings &&
      brandSettings.brandName &&
      brandSettings.registeredAddress
    ) {
      setLiveSettings(brandSettings);
      return;
    }

    let isMounted = true;
    API.get("/settings")
      .then((res) => {
        if (isMounted && res?.data?.data) {
          setLiveSettings((prev) => ({ ...res.data.data, ...brandSettings }));
        }
      })
      .catch(() => {
        if (typeof window !== "undefined") {
          const cachedName = localStorage.getItem("brandName");
          const cachedLogo = localStorage.getItem("brandLogoUrl");
          if (cachedName || cachedLogo) {
            setLiveSettings((prev) => ({
              ...prev,
              brandName: cachedName || prev.brandName,
              brandLogoUrl: cachedLogo || prev.brandLogoUrl,
            }));
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [brandSettings]);

  if (!isOpen || !order) return null;

  const rawLogo =
    liveSettings.brandLogoUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("brandLogoUrl")
      : "") ||
    "/logo.png";

  const brandName = liveSettings.brandName || "PARIWESH";
  const sellerGstin = (liveSettings.gstinNumber || "").trim();
  const sellerPhone =
    liveSettings.supportPhone || liveSettings.phone || "";
  const addressLines = splitAddressLines(liveSettings.registeredAddress, [
    "13 Goutam Vihar Gajsinghpura",
    "Ajmer Road Jaipur",
    "Jaipur 302021",
    "Rajasthan, India",
  ]);
  const sellerState = detectStateFromAddress(
    liveSettings.registeredAddress,
    "Rajasthan"
  );
  const sellerStateCode = getStateCode(sellerState, sellerGstin);

  const invoiceNo =
    order.invoiceNumber ||
    (order.orderId ? `INV-${order.orderId}` : `INV-${Date.now().toString().slice(-6)}`);
  const invoiceDate = formatDateDdMmYyyy(
    order.invoiceDate || order.createdAt || Date.now()
  );
  const orderDate = formatDateDdMmYyyy(order.createdAt || Date.now());

  const customerName =
    order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const customerPhone =
    order.shippingAddress?.phone || order.customer?.phone || "";
  const customerStreet = order.shippingAddress?.street || "";
  const customerCity = order.shippingAddress?.city || "";
  const customerState = order.shippingAddress?.state || "Rajasthan";
  const customerPincode = order.shippingAddress?.pincode || "";
  const customerStateCode = getStateCode(customerState);

  const isIntraState = isRajasthanState(customerState, sellerState);

  const awbNumber = order.awbCode || order.trackingId || "";
  const courierName =
    order.courierName ||
    order.shippingProvider ||
    (awbNumber ? "Surface Courier" : "Standard Dispatch");
  const paymentMethodDisplay = String(
    order.paymentMethod || "Prepaid"
  ).toUpperCase();
  const eWaybillNo = order.eWaybillNo || "";

  const items = (order.items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const grossTotal = price * qty;
    const gstRate = Number(item.gstRate ?? 5) || 5;
    const taxableTotal = grossTotal / (1 + gstRate / 100);
    const gstTotal = grossTotal - taxableTotal;
    const hsn = item.hsnCode || "6204";
    const sku = item.sku || item.productId || "-";

    return {
      sno: idx + 1,
      name: item.name || "Product Item",
      sku,
      hsn,
      qty,
      unitPrice: price,
      taxableTotal,
      gstTotal,
      grossTotal,
    };
  });

  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);
  const totalTaxable = items.reduce((acc, i) => acc + i.taxableTotal, 0);
  const totalGst = items.reduce((acc, i) => acc + i.gstTotal, 0);
  const grandTotal =
    Number(order.pricing?.grandTotal) ||
    items.reduce((acc, i) => acc + i.grossTotal, 0);

  const cgstAmount = isIntraState ? totalGst / 2 : 0;
  const sgstAmount = isIntraState ? totalGst / 2 : 0;
  const igstAmount = !isIntraState ? totalGst : 0;

  const handlePrint = () => {
    const html = buildPrintableInvoiceHtml(order, liveSettings);
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert(
        "Please allow popups for this site to print or save the Tax Invoice."
      );
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
          className="bg-white rounded-lg shadow-2xl border border-neutral-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden text-neutral-900 font-sans"
        >
          {/* Top Actions Bar */}
          <div className="bg-neutral-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <h3 className="text-sm font-semibold tracking-wide font-sans text-neutral-100">
                Tax Invoice &mdash; {invoiceNo}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {order.shippingInvoiceUrl && (
                <a
                  href={order.shippingInvoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition"
                  title="Open official Shiprocket courier invoice PDF"
                >
                  <RiExternalLinkLine size={13} />
                  Shiprocket Invoice
                </a>
              )}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded shadow transition"
              >
                <RiPrinterLine size={15} />
                Print / Save PDF
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

          {/* Scrollable Invoice Canvas (100% Dynamic - Zero Hardcoding) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral-100 flex justify-center">
            <div className="bg-white border-2 border-black p-5 sm:p-7 w-full max-w-2xl text-[11px] leading-tight text-black shadow-lg">
              {/* Top Header: Logo on Left | TAX INVOICE + Powered by Brand on Right */}
              <div className="flex justify-between items-center pb-4 mb-3 border-b border-neutral-300">
                <div>
                  <img
                    src={rawLogo}
                    alt={brandName}
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-black tracking-wide uppercase">
                    TAX INVOICE
                  </h2>
                  <p className="text-xs text-neutral-700 font-medium mt-0.5">
                    Powered by {brandName}
                  </p>
                </div>
              </div>

              {/* Two-Column Block: Sold By | Delivered To */}
              <div className="grid grid-cols-2 gap-6 pb-4">
                {/* Left: Sold By */}
                <div>
                  <div className="font-black text-xs uppercase text-center mb-1">
                    Sold By:
                  </div>
                  <div className="text-[11px] leading-snug space-y-0.5">
                    <p className="font-bold">{brandName}</p>
                    {addressLines.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                    {sellerState && <p>{sellerState}</p>}
                    <p>State Code : {sellerStateCode}</p>
                    {sellerPhone && <p>Ph: {sellerPhone}</p>}
                    {sellerGstin && <p>GSTIN No.: {sellerGstin}</p>}
                  </div>
                  <div className="mt-3.5 text-[11px] leading-relaxed">
                    <p>
                      <strong>Invoice No. :</strong> {invoiceNo}
                    </p>
                    <p>
                      <strong>Invoice Date :</strong> {invoiceDate}
                    </p>
                    <p>
                      <strong>Order No. :</strong> {order.orderId || "-"}
                    </p>
                    <p>
                      <strong>Order Date :</strong> {orderDate}
                    </p>
                  </div>
                </div>

                {/* Right: Delivered To */}
                <div>
                  <div className="font-black text-xs uppercase text-center mb-1">
                    Delivered To:
                  </div>
                  <div className="text-[11px] leading-snug space-y-0.5">
                    <p className="font-bold">{customerName}</p>
                    <p>{customerStreet}</p>
                    <p>
                      {customerCity ? `${customerCity} ` : ""}
                      {customerPincode}
                    </p>
                    <p>{customerState}</p>
                    <p>India</p>
                    <p>State Code : {customerStateCode}</p>
                    {customerPhone && <p>Ph: {customerPhone}</p>}
                  </div>
                  <div className="mt-3.5 text-[11px] leading-relaxed">
                    <p>
                      <strong>Payment Method :</strong> {paymentMethodDisplay}
                    </p>
                    <p>
                      <strong>Shipped By :</strong> {courierName}
                    </p>
                    <p>
                      <strong>AWB No. :</strong> {awbNumber || "-"}
                    </p>
                    <p>
                      <strong>eWaybill No. :</strong> {eWaybillNo || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-3">
                <table className="w-full border-collapse border border-black text-[10.5px]">
                  <thead>
                    <tr className="bg-[#d8d8d8] text-black font-bold text-center">
                      <th className="border border-black py-1.5 px-2 text-left w-[36%]">
                        Description
                      </th>
                      <th className="border border-black py-1.5 px-1 w-[8%]">
                        HSN
                      </th>
                      <th className="border border-black py-1.5 px-1 w-[6%]">
                        Qty
                      </th>
                      <th className="border border-black py-1.5 px-1.5 text-right w-[12%]">
                        Unit Price
                      </th>
                      <th className="border border-black py-1.5 px-1.5 text-right w-[13%]">
                        Taxable Value
                      </th>
                      {isIntraState ? (
                        <>
                          <th className="border border-black py-1.5 px-1 w-[8%] text-right">
                            CGST
                          </th>
                          <th className="border border-black py-1.5 px-1 w-[8%] text-right">
                            SGST
                          </th>
                        </>
                      ) : (
                        <th className="border border-black py-1.5 px-1 w-[16%] text-right">
                          IGST
                        </th>
                      )}
                      <th className="border border-black py-1.5 px-1.5 text-right w-[13%]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="border border-black py-1.5 px-2 text-left">
                          <strong className="text-black block">{it.name}</strong>
                          <span className="text-[9.5px] text-neutral-800">
                            SKU : {it.sku}
                          </span>
                        </td>
                        <td className="border border-black py-1.5 px-1 text-center font-mono">
                          {it.hsn}
                        </td>
                        <td className="border border-black py-1.5 px-1 text-center font-bold">
                          {it.qty}
                        </td>
                        <td className="border border-black py-1.5 px-1.5 text-right">
                          {it.unitPrice.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border border-black py-1.5 px-1.5 text-right">
                          {it.taxableTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        {isIntraState ? (
                          <>
                            <td className="border border-black py-1.5 px-1 text-right">
                              {(it.gstTotal / 2).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="border border-black py-1.5 px-1 text-right">
                              {(it.gstTotal / 2).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </>
                        ) : (
                          <td className="border border-black py-1.5 px-1 text-right">
                            {it.gstTotal.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        )}
                        <td className="border border-black py-1.5 px-1.5 text-right font-bold">
                          {it.grossTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#d8d8d8] font-bold">
                      <td className="border border-black py-1.5 px-2 text-center">
                        Net Total
                      </td>
                      <td className="border border-black py-1.5 px-1"></td>
                      <td className="border border-black py-1.5 px-1 text-center">
                        {totalQty}
                      </td>
                      <td className="border border-black py-1.5 px-1.5"></td>
                      <td className="border border-black py-1.5 px-1.5 text-right">
                        {totalTaxable.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      {isIntraState ? (
                        <>
                          <td className="border border-black py-1.5 px-1 text-right">
                            {cgstAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="border border-black py-1.5 px-1 text-right">
                            {sgstAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </>
                      ) : (
                        <td className="border border-black py-1.5 px-1 text-right">
                          {igstAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      )}
                      <td className="border border-black py-1.5 px-1.5 text-right font-black">
                        {grandTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Amount Payable (In Words) Box */}
              <div className="border-[1.5px] border-black px-3 py-2 mb-3 flex justify-between items-center">
                <span className="font-bold text-xs">
                  Net Amount Payable (In Words):
                </span>
                <span className="font-medium text-xs text-right">
                  {numberToWordsInr(grandTotal)}
                </span>
              </div>

              {/* Bottom Box: Legal Policy on Left | Authorised Signature on Right */}
              <div className="border-[1.5px] border-black grid grid-cols-12">
                <div className="col-span-7 p-2.5 border-r-[1.5px] border-black text-[10px] leading-relaxed">
                  <p>All disputes are subject to {sellerState} jurisdiction only.</p>
                  <p className="mt-2">
                    Goods once sold will only be taken back or exchanged as per
                    the store's exchange/return policy.
                  </p>
                </div>
                <div className="col-span-5 p-2.5 text-center flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold">
                      Authorised Signature for
                    </p>
                    <p className="text-xs font-black uppercase mt-1">
                      {brandName}
                    </p>
                  </div>
                  <div className="h-6"></div>
                </div>
              </div>

              {/* Reverse Charge Note */}
              <div className="text-[10px] mt-1 text-neutral-800">
                Whether tax is payable under reverse charge:No
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaxInvoiceModal;

