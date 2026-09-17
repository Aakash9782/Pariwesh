import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiPrinterLine,
  RiDownloadLine,
  RiExternalLinkLine,
  RiShieldCheckLine,
} from "react-icons/ri";

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
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n) => {
    let str = "";
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) str += a[n];
      else {
        str += b[Math.floor(n / 10)];
        if (n % 10) str += " " + a[n % 10];
      }
    }
    return str;
  };

  return `${inWords(n).trim()} Rupees Only`;
};

/**
 * Robust helper: checks if the destination is within Rajasthan (Intra-state CGST+SGST)
 */
export const isRajasthanState = (stateStr = "") => {
  const s = String(stateStr || "").toLowerCase().trim();
  return (
    s === "08" ||
    s === "rj" ||
    s.includes("rajasthan") ||
    s.includes("rajastan") ||
    s.startsWith("raj")
  );
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

  const seller = {
    name: brandSettings.brandName || "PARIWESH",
    tagline: "Royal Ethnic Attire",
    logoUrl: logoSrc,
    address:
      brandSettings.registeredAddress ||
      "Plot No. 12, Sanganer Industrial Area, Jaipur, Rajasthan - 302029",
    gstin: brandSettings.gstinNumber || "08AAPPP1234A1Z9",
    state: "Rajasthan (08)",
    phone: brandSettings.supportPhone || "+91 97826 81155",
    email: brandSettings.supportEmail || "contact@pariwesh.co",
  };

  const invoiceNo = `INV-${order.orderId}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  const customerName =
    order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const customerPhone =
    order.shippingAddress?.phone || order.customer?.phone || "";
  const customerEmail =
    order.shippingAddress?.email || order.customer?.email || "";
  const customerStreet = order.shippingAddress?.street || "";
  const customerCity = order.shippingAddress?.city || "";
  const customerState = order.shippingAddress?.state || "Rajasthan";
  const customerPincode = order.shippingAddress?.pincode || "";

  // Intra-state vs Inter-state determination
  const isIntraState = isRajasthanState(customerState);

  // Items calculation with 5% inclusive GST
  const items = (order.items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const grossTotal = price * qty;
    const taxableTotal = grossTotal / 1.05;
    const gstTotal = grossTotal - taxableTotal;
    const hsn = item.hsnCode || "6204";

    return {
      sno: idx + 1,
      name: item.name,
      size: item.size || "-",
      sku: item.sku || "-",
      hsn,
      qty,
      unitPrice: price,
      taxableTotal,
      gstTotal,
      grossTotal,
    };
  });

  const totalTaxable = items.reduce((acc, i) => acc + i.taxableTotal, 0);
  const totalGst = items.reduce((acc, i) => acc + i.gstTotal, 0);
  const delivery = Number(order.pricing?.delivery) || 0;
  const discount = Number(order.pricing?.discount) || 0;
  const grandTotal =
    Number(order.pricing?.grandTotal) ||
    Math.round(totalTaxable + totalGst + delivery - discount);

  const cgstAmount = isIntraState ? totalGst / 2 : 0;
  const sgstAmount = isIntraState ? totalGst / 2 : 0;
  const igstAmount = !isIntraState ? totalGst : 0;

  const itemRowsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${item.sno}</td>
      <td style="padding: 8px 6px; border: 1px solid #ddd; font-size: 11px;">
        <strong style="color: #111;">${item.name}</strong>
        <div style="color: #666; font-size: 10px;">Size: ${item.size} | SKU: ${item.sku}</div>
      </td>
      <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${item.hsn}</td>
      <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${item.qty}</td>
      <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: right; font-size: 11px;">₹${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: right; font-size: 11px;">₹${item.taxableTotal.toFixed(2)}</td>
      <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">5%</td>
      ${
        isIntraState
          ? `
        <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: right; font-size: 11px;">₹${(item.gstTotal / 2).toFixed(2)}</td>
        <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: right; font-size: 11px;">₹${(item.gstTotal / 2).toFixed(2)}</td>
      `
          : `
        <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: right; font-size: 11px;">₹${item.gstTotal.toFixed(2)}</td>
      `
      }
      <td style="padding: 8px 6px; border: 1px solid #ddd; text-align: right; font-size: 11px; font-weight: bold;">₹${item.grossTotal.toFixed(2)}</td>
    </tr>
  `,
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
      margin: 12mm 10mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #222;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.4;
    }
    .invoice-card {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #ccc;
      padding: 24px;
      box-sizing: border-box;
      background: #fff;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #926f34;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #777;
      margin-top: 2px;
    }
    .tax-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #fbf6ec;
      border: 1px solid #d4af37;
      color: #926f34;
      font-weight: bold;
      font-size: 11px;
      letter-spacing: 1px;
      border-radius: 3px;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #926f34;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
      background: #fafafa;
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 4px;
    }
    .meta-box h4 {
      margin: 0 0 6px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #926f34;
      font-weight: 700;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.data-table th {
      background: #f4ede2;
      border: 1px solid #d0c0a5;
      padding: 8px 6px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #333;
      font-weight: 700;
    }
    .totals-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      gap: 20px;
    }
    .words-box {
      flex: 1;
      font-size: 11px;
      background: #fcfcfc;
      border: 1px dashed #ccc;
      padding: 10px;
      border-radius: 4px;
    }
    .summary-table {
      width: 320px;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 5px 8px;
      font-size: 11px;
    }
    .summary-table tr.grand-row td {
      border-top: 2px solid #926f34;
      font-size: 14px;
      font-weight: 800;
      color: #926f34;
      padding-top: 8px;
    }
    .footer-notes {
      border-top: 1px solid #ddd;
      margin-top: 20px;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .signatory {
      text-align: right;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-card {
        border: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header-grid">
      <div>
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
          <img id="invoice-logo" src="${logoSrc}" alt="${seller.name}" style="height: 48px; max-width: 170px; object-fit: contain;" onerror="this.style.display='none'" />
          <div>
            <h1 class="brand-title" style="font-size: 22px; line-height: 1.1;">${seller.name}</h1>
            <div class="brand-sub">${seller.tagline}</div>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #444; line-height: 1.45;">
          ${seller.address}<br />
          <strong>GSTIN:</strong> ${seller.gstin} | <strong>State:</strong> ${seller.state}<br />
          <strong>Email:</strong> ${seller.email} | <strong>Phone:</strong> ${seller.phone}
        </div>
      </div>
      <div style="text-align: right;">
        <span class="tax-badge">TAX INVOICE</span>
        <div style="margin-top: 10px; font-size: 11px;">
          <div><strong>Invoice No:</strong> ${invoiceNo}</div>
          <div><strong>Date:</strong> ${invoiceDate}</div>
          <div><strong>Order ID:</strong> ${order.orderId}</div>
          <div><strong>Payment Mode:</strong> ${order.paymentMethod || "Prepaid"} (${order.paymentStatus || "Paid"})</div>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Billed & Shipped To:</h4>
        <div style="font-size: 12px; font-weight: bold; color: #111;">${customerName}</div>
        <div style="font-size: 11px; color: #444; margin-top: 2px;">
          ${customerStreet}<br />
          ${customerCity ? `${customerCity}, ` : ""}${customerState} - ${customerPincode}<br />
          <strong>Phone:</strong> ${customerPhone}
          ${customerEmail ? `<br /><strong>Email:</strong> ${customerEmail}` : ""}
        </div>
      </div>
      <div class="meta-box">
        <h4>Place of Supply & Tax Details:</h4>
        <div style="font-size: 11px; color: #444;">
          <strong>Place of Supply:</strong> ${customerState}<br />
          <strong>Tax Type:</strong> ${
            isIntraState
              ? "Intra-State (CGST 2.5% + SGST 2.5%)"
              : "Inter-State (IGST 5.0%)"
          }<br />
          <strong>Prices:</strong> Inclusive of 5% GST<br />
          <strong>Reverse Charge:</strong> No
        </div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Item Description</th>
          <th style="width: 50px;">HSN</th>
          <th style="width: 35px;">Qty</th>
          <th style="width: 70px;">Rate</th>
          <th style="width: 75px;">Taxable</th>
          <th style="width: 45px;">GST</th>
          ${
            isIntraState
              ? `
            <th style="width: 65px;">CGST</th>
            <th style="width: 65px;">SGST</th>
          `
              : `
            <th style="width: 75px;">IGST</th>
          `
          }
          <th style="width: 80px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <div class="totals-grid">
      <div class="words-box">
        <div style="color: #666; font-size: 10px; text-transform: uppercase;">Amount in Words:</div>
        <strong style="color: #222; font-size: 11px;">${numberToWordsInr(grandTotal)}</strong>

        <div style="margin-top: 14px; font-size: 10px; color: #666;">
          <strong>Declaration:</strong><br />
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
        </div>
      </div>

      <div>
        <table class="summary-table">
          <tr>
            <td style="color: #555;">Taxable Subtotal:</td>
            <td style="text-align: right; font-weight: 600;">₹${totalTaxable.toFixed(2)}</td>
          </tr>
          ${
            isIntraState
              ? `
            <tr>
              <td style="color: #555;">CGST (2.5%):</td>
              <td style="text-align: right; font-weight: 600;">₹${cgstAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #555;">SGST (2.5%):</td>
              <td style="text-align: right; font-weight: 600;">₹${sgstAmount.toFixed(2)}</td>
            </tr>
          `
              : `
            <tr>
              <td style="color: #555;">IGST (5.0%):</td>
              <td style="text-align: right; font-weight: 600;">₹${igstAmount.toFixed(2)}</td>
            </tr>
          `
          }
          <tr>
            <td style="color: #555;">Total Tax (5%):</td>
            <td style="text-align: right; font-weight: 600;">₹${totalGst.toFixed(2)}</td>
          </tr>
          ${
            delivery > 0
              ? `
            <tr>
              <td style="color: #555;">Shipping / Delivery:</td>
              <td style="text-align: right; font-weight: 600;">₹${delivery.toFixed(2)}</td>
            </tr>
          `
              : ""
          }
          ${
            discount > 0
              ? `
            <tr>
              <td style="color: #c62828;">Discount Applied:</td>
              <td style="text-align: right; font-weight: 600; color: #c62828;">-₹${discount.toFixed(2)}</td>
            </tr>
          `
              : ""
          }
          <tr class="grand-row">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${grandTotal.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer-notes">
      <div style="font-size: 10px; color: #888;">
        This is a computer-generated invoice. No physical signature is required.
      </div>
      <div class="signatory">
        <div style="font-size: 11px; font-weight: bold; color: #333;">For ${seller.name}</div>
        <div style="margin-top: 24px; font-size: 10px; color: #666; border-top: 1px dashed #aaa; padding-top: 4px;">Authorized Signatory</div>
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
  if (!isOpen || !order) return null;

  const rawLogo =
    brandSettings.brandLogoUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("brandLogoUrl")
      : "") ||
    "/logo.png";

  const seller = {
    name: brandSettings.brandName || "PARIWESH",
    tagline: "Royal Ethnic Attire",
    logoUrl: rawLogo,
    address:
      brandSettings.registeredAddress ||
      "Plot No. 12, Sanganer Industrial Area, Jaipur, Rajasthan - 302029",
    gstin: brandSettings.gstinNumber || "08AAPPP1234A1Z9",
    state: "Rajasthan (08)",
    phone: brandSettings.supportPhone || "+91 97826 81155",
    email: brandSettings.supportEmail || "contact@pariwesh.co",
  };

  const invoiceNo = `INV-${order.orderId}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  const customerName =
    order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const customerPhone =
    order.shippingAddress?.phone || order.customer?.phone || "";
  const customerEmail =
    order.shippingAddress?.email || order.customer?.email || "";
  const customerStreet = order.shippingAddress?.street || "";
  const customerCity = order.shippingAddress?.city || "";
  const customerState = order.shippingAddress?.state || "Rajasthan";
  const customerPincode = order.shippingAddress?.pincode || "";

  const isIntraState = isRajasthanState(customerState);

  const items = (order.items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const grossTotal = price * qty;
    const taxableTotal = grossTotal / 1.05;
    const gstTotal = grossTotal - taxableTotal;
    const hsn = item.hsnCode || "6204";

    return {
      sno: idx + 1,
      name: item.name,
      size: item.size || "-",
      sku: item.sku || "-",
      hsn,
      qty,
      unitPrice: price,
      taxableTotal,
      gstTotal,
      grossTotal,
    };
  });

  const totalTaxable = items.reduce((acc, i) => acc + i.taxableTotal, 0);
  const totalGst = items.reduce((acc, i) => acc + i.gstTotal, 0);
  const delivery = Number(order.pricing?.delivery) || 0;
  const discount = Number(order.pricing?.discount) || 0;
  const grandTotal =
    Number(order.pricing?.grandTotal) ||
    Math.round(totalTaxable + totalGst + delivery - discount);

  const cgstAmount = isIntraState ? totalGst / 2 : 0;
  const sgstAmount = isIntraState ? totalGst / 2 : 0;
  const igstAmount = !isIntraState ? totalGst : 0;

  const handlePrint = () => {
    const html = buildPrintableInvoiceHtml(order, brandSettings);
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert(
        "Please allow popups for this site to print or save the Tax Invoice.",
      );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg shadow-2xl border border-borderLight w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-800"
        >
          {/* Top Actions Bar */}
          <div className="bg-neutral-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-accent-gold inline-block"></span>
              <h3 className="text-sm font-semibold tracking-wide font-sans text-neutral-100">
                Tax Invoice Preview &mdash; {invoiceNo}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-accent-gold text-neutral-950 hover:bg-[#d5b88f] rounded shadow transition"
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

          {/* Scrollable Invoice Canvas */}
          <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/50">
            <div className="bg-white p-6 sm:p-8 rounded border border-neutral-200 shadow-sm max-w-3xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-accent-gold pb-5 gap-4">
                <div>
                  <div className="flex items-center gap-3.5 mb-2">
                    <img
                      src={seller.logoUrl}
                      alt={seller.name}
                      className="h-12 w-auto object-contain max-w-[160px]"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-widest text-[#926f34] uppercase">
                        {seller.name}
                      </h1>
                      <p className="text-[10px] tracking-widest uppercase text-neutral-500 font-semibold mt-0.5">
                        {seller.tagline}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 mt-2 space-y-0.5">
                    <p>{seller.address}</p>
                    <p>
                      <span className="font-semibold text-neutral-800">
                        GSTIN:
                      </span>{" "}
                      {seller.gstin} &nbsp;|&nbsp;{" "}
                      <span className="font-semibold text-neutral-800">
                        State:
                      </span>{" "}
                      {seller.state}
                    </p>
                    <p>
                      <span className="font-semibold text-neutral-800">
                        Email:
                      </span>{" "}
                      {seller.email} &nbsp;|&nbsp;{" "}
                      <span className="font-semibold text-neutral-800">
                        Phone:
                      </span>{" "}
                      {seller.phone}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right w-full sm:w-auto">
                  <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-300 text-[#926f34] text-xs font-bold tracking-wider uppercase rounded">
                    Tax Invoice
                  </span>
                  <div className="text-xs text-neutral-700 mt-2.5 space-y-1">
                    <p>
                      <span className="text-neutral-500 font-medium">
                        Invoice No:
                      </span>{" "}
                      <strong className="text-neutral-900">{invoiceNo}</strong>
                    </p>
                    <p>
                      <span className="text-neutral-500 font-medium">
                        Invoice Date:
                      </span>{" "}
                      {invoiceDate}
                    </p>
                    <p>
                      <span className="text-neutral-500 font-medium">
                        Order ID:
                      </span>{" "}
                      {order.orderId}
                    </p>
                    <p>
                      <span className="text-neutral-500 font-medium">
                        Payment:
                      </span>{" "}
                      <span className="font-semibold">
                        {order.paymentMethod || "COD"}
                      </span>{" "}
                      ({order.paymentStatus || "Pending"})
                    </p>
                  </div>
                </div>
              </div>

              {/* Bill To / Ship To / Tax Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded border border-neutral-200 text-xs">
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#926f34] mb-1.5">
                    Billed & Shipped To:
                  </h4>
                  <div className="font-bold text-neutral-900 text-sm">
                    {customerName}
                  </div>
                  <div className="text-neutral-600 mt-1 space-y-0.5">
                    <p>{customerStreet}</p>
                    <p>
                      {customerCity ? `${customerCity}, ` : ""}
                      {customerState} - {customerPincode}
                    </p>
                    <p>
                      <strong className="text-neutral-700">Phone:</strong>{" "}
                      {customerPhone}
                    </p>
                    {customerEmail && (
                      <p>
                        <strong className="text-neutral-700">Email:</strong>{" "}
                        {customerEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#926f34] mb-1.5">
                    Place of Supply & GST:
                  </h4>
                  <div className="text-neutral-600 space-y-1">
                    <p>
                      <strong className="text-neutral-700">
                        Place of Supply:
                      </strong>{" "}
                      {customerState}
                    </p>
                    <p>
                      <strong className="text-neutral-700">Tax Type:</strong>{" "}
                      <span className="inline-block px-1.5 py-0.5 bg-neutral-200/80 rounded text-[11px] font-medium text-neutral-800">
                        {isIntraState
                          ? "Intra-State (CGST 2.5% + SGST 2.5%)"
                          : "Inter-State (IGST 5.0%)"}
                      </span>
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      * Selling prices are inclusive of 5% GST.
                    </p>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-100/50 text-neutral-800 border-y border-amber-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 text-center w-8">#</th>
                      <th className="py-2.5 px-2">Item Description</th>
                      <th className="py-2.5 px-2 text-center">HSN</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Selling Price</th>
                      <th className="py-2.5 px-2 text-right">Taxable</th>
                      <th className="py-2.5 px-2 text-center">GST</th>
                      {isIntraState ? (
                        <>
                          <th className="py-2.5 px-2 text-right">CGST</th>
                          <th className="py-2.5 px-2 text-right">SGST</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-2 text-right">IGST</th>
                      )}
                      <th className="py-2.5 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {items.map((it) => (
                      <tr key={it.sno} className="hover:bg-neutral-50/80">
                        <td className="py-2 px-2 text-center text-neutral-400">
                          {it.sno}
                        </td>
                        <td className="py-2 px-2">
                          <strong className="text-neutral-900 block">
                            {it.name}
                          </strong>
                          <span className="text-[10px] text-neutral-500">
                            Size: {it.size} | SKU: {it.sku}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-neutral-600">
                          {it.hsn}
                        </td>
                        <td className="py-2 px-2 text-center font-medium">
                          {it.qty}
                        </td>
                        <td className="py-2 px-2 text-right">
                          ₹{it.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-neutral-700">
                          ₹{it.taxableTotal.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center text-neutral-600">
                          5%
                        </td>
                        {isIntraState ? (
                          <>
                            <td className="py-2 px-2 text-right text-neutral-600">
                              ₹{(it.gstTotal / 2).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right text-neutral-600">
                              ₹{(it.gstTotal / 2).toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <td className="py-2 px-2 text-right text-neutral-600">
                            ₹{it.gstTotal.toFixed(2)}
                          </td>
                        )}
                        <td className="py-2 px-2 text-right font-bold text-neutral-900">
                          ₹{it.grossTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Summary */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2 border-t border-neutral-200">
                <div className="flex-1 space-y-3">
                  <div className="bg-neutral-50 p-3 rounded border border-dashed border-neutral-300 text-xs">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                      Amount in Words
                    </span>
                    <p className="font-semibold text-neutral-800 mt-0.5">
                      {numberToWordsInr(grandTotal)}
                    </p>
                  </div>

                  <div className="text-[11px] text-neutral-500 leading-relaxed">
                    <p className="font-semibold text-neutral-700">
                      Declaration:
                    </p>
                    <p>
                      We declare that this invoice shows the actual price of the
                      goods described and that all particulars are true and
                      correct.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-80">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td className="py-1.5 text-neutral-600">
                          Taxable Subtotal:
                        </td>
                        <td className="py-1.5 text-right font-medium text-neutral-800">
                          ₹{totalTaxable.toFixed(2)}
                        </td>
                      </tr>
                      {isIntraState ? (
                        <>
                          <tr>
                            <td className="py-1.5 text-neutral-600">
                              CGST (2.5%):
                            </td>
                            <td className="py-1.5 text-right font-medium text-neutral-800">
                              ₹{cgstAmount.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-neutral-600">
                              SGST (2.5%):
                            </td>
                            <td className="py-1.5 text-right font-medium text-neutral-800">
                              ₹{sgstAmount.toFixed(2)}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td className="py-1.5 text-neutral-600">
                            IGST (5.0%):
                          </td>
                          <td className="py-1.5 text-right font-medium text-neutral-800">
                            ₹{igstAmount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-1.5 text-neutral-600">
                          Total GST (5%):
                        </td>
                        <td className="py-1.5 text-right font-semibold text-neutral-800">
                          ₹{totalGst.toFixed(2)}
                        </td>
                      </tr>
                      {delivery > 0 && (
                        <tr>
                          <td className="py-1.5 text-neutral-600">
                            Shipping Charge:
                          </td>
                          <td className="py-1.5 text-right font-medium text-neutral-800">
                            ₹{delivery.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {discount > 0 && (
                        <tr>
                          <td className="py-1.5 text-red-600">
                            Discount Applied:
                          </td>
                          <td className="py-1.5 text-right font-semibold text-red-600">
                            -₹{discount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-accent-gold">
                        <td className="py-2.5 text-sm font-extrabold text-[#926f34]">
                          Grand Total:
                        </td>
                        <td className="py-2.5 text-right text-base font-extrabold text-[#926f34]">
                          ₹{grandTotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatory Footer */}
              <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-end text-xs text-neutral-500 gap-4">
                <p className="text-[11px] text-neutral-400">
                  Computer generated Tax Invoice. Does not require physical
                  signature.
                </p>
                <div className="text-right">
                  <p className="font-bold text-neutral-800">
                    For {seller.name}
                  </p>
                  <div className="mt-8 border-t border-neutral-300 pt-1 text-[10px] text-neutral-500">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaxInvoiceModal;
