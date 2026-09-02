const brand = {
  name: "PARIWESH",
  gold: "#C5A880",
  dark: "#1A1A1A",
  muted: "#6B6B6B",
  bg: "#F7F5F2",
  white: "#FFFFFF",
  success: "#2E7D32",
  danger: "#C62828",
  border: "#E8E2D9",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatInr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (d) =>
  new Date(d || Date.now()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const wrapLayout = ({ title, eyebrow, bodyHtml, footerNote }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.bg};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:${brand.white};border:1px solid ${brand.border};">
          <tr>
            <td style="height:4px;background:${brand.gold};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              <div style="font-size:22px;letter-spacing:0.28em;font-weight:700;color:${brand.dark};">${brand.name}</div>
              <div style="margin-top:10px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${brand.gold};">${escapeHtml(eyebrow || "")}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${brand.dark};font-weight:500;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:${brand.bg};border-top:1px solid ${brand.border};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
                ${escapeHtml(footerNote || "Thank you for shopping with PARIWESH.")}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const orderItemsRows = (items = []) =>
  items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${brand.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${brand.dark};">
          <strong>${escapeHtml(item.name)}</strong><br/>
          <span style="color:${brand.muted};font-size:12px;">
            SKU: ${escapeHtml(item.sku || "-")}
            ${item.size ? ` · Size ${escapeHtml(item.size)}` : ""}
            ${item.color ? ` · ${escapeHtml(item.color)}` : ""}
            · Qty ${escapeHtml(item.quantity)}
          </span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${brand.border};text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${brand.dark};white-space:nowrap;">
          ${formatInr(Number(item.price) * Number(item.quantity || 1))}
        </td>
      </tr>`,
    )
    .join("");

const orderDetailsBlock = (order) => {
  const addr = order.shippingAddress || {};
  const pricing = order.pricing || {};
  const customer = order.customer || {};

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td style="padding:12px;background:${brand.bg};border:1px solid ${brand.border};">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${brand.muted};">Order ID</div>
          <div style="margin-top:4px;font-size:16px;color:${brand.gold};font-weight:700;">${escapeHtml(order.orderId)}</div>
          <div style="margin-top:8px;font-size:12px;color:${brand.muted};">${formatDate(order.createdAt)}</div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
      <tr>
        <td width="50%" valign="top" style="padding-right:10px;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${brand.muted};margin-bottom:6px;">Customer</div>
          <div style="color:${brand.dark};line-height:1.5;">
            ${escapeHtml(customer.name || addr.fullName || "")}<br/>
            ${escapeHtml(customer.phone || addr.phone || "")}<br/>
            ${escapeHtml(customer.email || "")}
          </div>
        </td>
        <td width="50%" valign="top" style="padding-left:10px;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${brand.muted};margin-bottom:6px;">Ship to</div>
          <div style="color:${brand.dark};line-height:1.5;">
            ${escapeHtml(addr.fullName || "")}<br/>
            ${escapeHtml(addr.street || "")}<br/>
            ${escapeHtml(addr.city || "")}${addr.state ? `, ${escapeHtml(addr.state)}` : ""} - ${escapeHtml(addr.pincode || "")}<br/>
            ${escapeHtml(addr.phone || "")}
          </div>
        </td>
      </tr>
    </table>

    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${brand.muted};margin:8px 0 6px;font-family:Arial,Helvetica,sans-serif;">Items</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${orderItemsRows(order.items)}
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
      <tr>
        <td style="padding:4px 0;color:${brand.muted};">Subtotal</td>
        <td style="padding:4px 0;text-align:right;color:${brand.dark};">${formatInr(pricing.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:${brand.muted};">Delivery</td>
        <td style="padding:4px 0;text-align:right;color:${brand.dark};">${Number(pricing.delivery) === 0 ? "FREE" : formatInr(pricing.delivery)}</td>
      </tr>
      ${
        Number(pricing.discount) > 0
          ? `<tr>
        <td style="padding:4px 0;color:${brand.success};">Discount${pricing.appliedCoupon ? ` (${escapeHtml(pricing.appliedCoupon)})` : ""}</td>
        <td style="padding:4px 0;text-align:right;color:${brand.success};">- ${formatInr(pricing.discount)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:10px 0 0;border-top:1px solid ${brand.border};font-weight:700;color:${brand.dark};">Grand Total</td>
        <td style="padding:10px 0 0;border-top:1px solid ${brand.border};text-align:right;font-weight:700;color:${brand.gold};font-size:16px;">${formatInr(pricing.grandTotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0 0;color:${brand.muted};">Payment</td>
        <td style="padding:8px 0 0;text-align:right;color:${brand.dark};">${escapeHtml(order.paymentMethod || "-")} · ${escapeHtml(order.paymentStatus || "-")}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:${brand.muted};">Order status</td>
        <td style="padding:4px 0;text-align:right;color:${brand.dark};">${escapeHtml(order.orderStatus || "-")}</td>
      </tr>
    </table>
  `;
};

export const buildOrderPlacedEmail = (order) => {
  const isOnline = order.paymentMethod === "ONLINE";
  const title = isOnline
    ? "Order placed — complete your payment"
    : "Order confirmed";
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
      Hi ${escapeHtml(order.customer?.name || order.shippingAddress?.fullName || "there")},
      your PARIWESH order has been placed successfully.
      ${
        isOnline
          ? " Please complete online payment if the checkout window is still open, or retry from your profile."
          : " We will process your COD order shortly."
      }
    </p>
    ${orderDetailsBlock(order)}
  `;
  return {
    subject: `${brand.name} · Order ${order.orderId} placed`,
    html: wrapLayout({
      title,
      eyebrow: "Order receipt",
      bodyHtml,
      footerNote:
        "You will receive another email when payment status changes. For help, reply to this email.",
    }),
  };
};

export const buildPaymentSuccessEmail = (order) => {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
      Hi ${escapeHtml(order.customer?.name || "there")},
      we have received your payment for order <strong style="color:${brand.dark};">${escapeHtml(order.orderId)}</strong>.
      Your order is confirmed and will be processed soon.
    </p>
    <div style="margin:14px 0;padding:12px 14px;background:#E8F5E9;border:1px solid #C8E6C9;color:${brand.success};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;">
      Payment status: PAID
      ${order.razorpayPaymentId ? `<div style="margin-top:4px;font-weight:500;color:${brand.muted};">Txn: ${escapeHtml(order.razorpayPaymentId)}</div>` : ""}
    </div>
    ${orderDetailsBlock(order)}
  `;
  return {
    subject: `${brand.name} · Payment received for ${order.orderId}`,
    html: wrapLayout({
      title: "Payment successful",
      eyebrow: "Payment confirmation",
      bodyHtml,
      footerNote:
        "Thank you for your purchase. We will update you on shipping.",
    }),
  };
};

export const buildPaymentFailedEmail = (order, reason = "") => {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
      Hi ${escapeHtml(order.customer?.name || "there")},
      payment for order <strong style="color:${brand.dark};">${escapeHtml(order.orderId)}</strong> was not completed.
      ${reason ? ` Reason: ${escapeHtml(reason)}.` : ""}
      Your order is saved — you can retry payment from your profile or place a new order.
    </p>
    <div style="margin:14px 0;padding:12px 14px;background:#FFEBEE;border:1px solid #FFCDD2;color:${brand.danger};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;">
      Payment status: ${escapeHtml(order.paymentStatus || "Failed")}
    </div>
    ${orderDetailsBlock(order)}
  `;
  return {
    subject: `${brand.name} · Payment incomplete for ${order.orderId}`,
    html: wrapLayout({
      title: "Payment not completed",
      eyebrow: "Payment update",
      bodyHtml,
      footerNote:
        "If amount was deducted, it will be auto-refunded by the bank/Razorpay as per policy. Contact support with your Order ID.",
    }),
  };
};

export const buildOrderShippedEmail = (order) => {
  const provider = order.shippingProvider || "our courier partner";
  const awb = order.trackingId || "";
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
      Hi ${escapeHtml(order.customer?.name || order.shippingAddress?.fullName || "there")},
      your PARIWESH order <strong style="color:${brand.dark};">${escapeHtml(order.orderId)}</strong> is on its way.
    </p>
    <div style="margin:14px 0;padding:12px 14px;background:#E3F2FD;border:1px solid #BBDEFB;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${brand.dark};">
      <div style="font-weight:700;margin-bottom:6px;">Shipment details</div>
      <div>Courier: ${escapeHtml(provider)}</div>
      <div style="margin-top:4px;">AWB / Tracking ID: <strong style="font-family:Consolas,Monaco,monospace;letter-spacing:0.04em;">${escapeHtml(awb)}</strong></div>
    </div>
    ${orderDetailsBlock(order)}
  `;
  return {
    subject: `${brand.name} · Order ${order.orderId} shipped`,
    html: wrapLayout({
      title: "Your order has shipped",
      eyebrow: "Shipping update",
      bodyHtml,
      footerNote:
        "Track your parcel on the courier website using the AWB above. For help, reply to this email.",
    }),
  };
};

export const buildOrderStatusUpdateEmail = (order, settings) => {
  const brandName = settings?.brandName || brand.name || "PARIWESH";
  const supportEmail = settings?.supportEmail || "contact@pariwesh.co";
  const brandLogoUrl = settings?.brandLogoUrl || "";
  const frontendUrl = (
    settings?.frontendUrl ||
    process.env.FRONTEND_URL ||
    "https://pariwesh.in"
  ).trim();
  const trackUrl = `${frontendUrl}/profile`;
  const shopUrl = `${frontendUrl}/shop`;

  const status = order.orderStatus || "";
  let displayStatus = status;
  if (status === "Placed") displayStatus = "Order Placed";
  else if (status === "Confirmed") displayStatus = "Order Confirmed";
  else if (status.startsWith("Return_")) {
    displayStatus = status.replace(/_/g, " ");
  }

  let description = `Your order status has been updated to ${displayStatus}.`;
  if (status === "Processing") {
    description = "Your order is now being carefully processed by our team.";
  } else if (status === "Packed") {
    description =
      "Great news! Your order has been packed and is ready for shipment.";
  } else if (status === "Ready to Ship") {
    description =
      "Your order has been packed successfully and is ready to be handed over to our delivery partner.";
  } else if (status === "Shipped") {
    description = "Your order has been shipped successfully.";
  } else if (status === "Out for Delivery") {
    description = "Your package is out for delivery and should reach you soon.";
  } else if (status === "Delivered") {
    description =
      "Your order has been delivered successfully. Thank you for placing your trust in us!";
  } else if (status === "Cancelled") {
    description = "We regret to inform you that your order has been cancelled.";
  } else if (status === "Returned") {
    description = "Your return request has been processed.";
  } else if (status === "Refunded") {
    description = "Your refund has been initiated/completed.";
  } else if (status === "Placed") {
    description = "Your order has been placed successfully.";
  } else if (status === "Confirmed") {
    description = "Your order has been confirmed.";
  }

  const isTrackingAllowed = [
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ].includes(status);
  const hasTracking =
    isTrackingAllowed && order.trackingId && order.shippingProvider;

  let trackingHtml = "";
  if (hasTracking) {
    trackingHtml = `
      <div style="margin:18px 0;padding:16px;background:#E3F2FD;border:1px solid #BBDEFB;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${brand.dark};">
        <div style="font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;color:#1565C0;">Delivery Details</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;font-family:Arial,sans-serif;">
          <tr>
            <td style="padding:4px 0;color:${brand.muted};width:120px;">Courier Name</td>
            <td style="padding:4px 0;font-weight:600;color:${brand.dark};">${escapeHtml(order.shippingProvider)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:${brand.muted};">Tracking ID</td>
            <td style="padding:4px 0;font-weight:700;font-family:Consolas,monospace;color:${brand.dark};">${escapeHtml(order.trackingId)}</td>
          </tr>
        </table>
      </div>
    `;
  }

  const shopButtonText =
    status === "Delivered" ? "Shop Again" : "Continue Shopping";
  let buttonsHtml = `<div style="margin:24px 0 16px;">`;
  if (isTrackingAllowed && order.trackingId) {
    buttonsHtml += `
      <a href="${escapeHtml(trackUrl)}" style="display:inline-block;padding:12px 24px;margin-right:12px;margin-bottom:8px;background:${brand.gold};color:${brand.white};text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;border-radius:2px;">Track Order</a>
    `;
  }
  buttonsHtml += `
      <a href="${escapeHtml(shopUrl)}" style="display:inline-block;padding:12px 24px;margin-bottom:8px;background:${brand.dark};color:${brand.white};text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;border-radius:2px;">${escapeHtml(shopButtonText)}</a>
    </div>
  `;

  const detailsBlockHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td style="padding:12px;background:${brand.bg};border:1px solid ${brand.border};">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${brand.muted};">Order ID</div>
          <div style="margin-top:4px;font-size:16px;color:${brand.gold};font-weight:700;">${escapeHtml(order.orderId)}</div>
          <div style="margin-top:8px;font-size:12px;color:${brand.muted};">${formatDate(order.createdAt)}</div>
        </td>
      </tr>
    </table>
  `;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
      Hi ${escapeHtml(order.customer?.name || order.shippingAddress?.fullName || "there")},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${brand.dark};font-family:Arial,sans-serif;font-weight:500;">
      ${escapeHtml(description)}
    </p>
    <div style="margin:16px 0;padding:12px 14px;background:${brand.bg};border:1px solid ${brand.border};font-family:Arial,sans-serif;font-size:13px;">
      Current Status: <strong style="text-transform:uppercase;color:${brand.gold};">${escapeHtml(displayStatus)}</strong>
    </div>
    ${trackingHtml}
    ${buttonsHtml}
    ${detailsBlockHtml}
  `;

  const dynamicEyebrow = `${brandName} Order Update`;

  return {
    subject: `${brandName} · Update for Order ${order.orderId}`,
    html: wrapLayoutWithSettings({
      title: `Order Status: ${displayStatus}`,
      eyebrow: dynamicEyebrow,
      bodyHtml,
      footerNote: `If you have any questions or require support, feel free to contact us at ${supportEmail}.`,
      settings,
    }),
  };
};

const wrapLayoutWithSettings = ({
  title,
  eyebrow,
  bodyHtml,
  footerNote,
  settings,
}) => {
  const brandName = settings?.brandName || brand.name || "PARIWESH";
  const brandLogoUrl = settings?.brandLogoUrl || "";

  const logoSection = brandLogoUrl
    ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(brandName)}" style="max-height:45px;max-width:240px;object-fit:contain;" />`
    : `<div style="font-size:22px;letter-spacing:0.28em;font-weight:700;color:${brand.dark};">${escapeHtml(brandName)}</div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.bg};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:${brand.white};border:1px solid ${brand.border};">
          <tr>
            <td style="height:4px;background:${brand.gold};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              ${logoSection}
              <div style="margin-top:10px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${brand.gold};">${escapeHtml(eyebrow || "")}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${brand.dark};font-weight:500;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:${brand.bg};border-top:1px solid ${brand.border};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
                ${escapeHtml(footerNote || `Thank you for shopping with ${brandName}.`)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const buildOtpEmail = ({ name, otp, expiresMinutes = 10 }) => ({
  subject: `${brand.name} · Your verification code`,
  html: wrapLayout({
    title: "Email verification",
    eyebrow: "One-time password",
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
        Hi ${escapeHtml(name || "there")}, use this code to verify your PARIWESH account.
        It expires in ${escapeHtml(expiresMinutes)} minutes. Do not share it with anyone.
      </p>
      <div style="margin:22px 0;padding:18px;text-align:center;background:${brand.bg};border:1px solid ${brand.border};">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${brand.muted};">Your OTP</div>
        <div style="margin-top:10px;font-family:Consolas,Monaco,monospace;font-size:32px;letter-spacing:0.35em;font-weight:700;color:${brand.dark};">${escapeHtml(otp)}</div>
      </div>
      <p style="margin:0;font-size:12px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
        If you did not request this, you can ignore this email.
      </p>
    `,
    footerNote: "PARIWESH never asks for your OTP by phone or chat.",
  }),
});

export const buildPasswordResetOtpEmail = ({
  name,
  otp,
  expiresMinutes = 10,
}) => ({
  subject: `${brand.name} · Password Reset Verification Code`,
  html: wrapLayout({
    title: "Reset Your Password",
    eyebrow: "Account Security",
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
        Hi ${escapeHtml(name || "there")}, we received a request to reset the password for your PARIWESH account.
        Use the verification code below to proceed with resetting your password.
        It expires in ${escapeHtml(expiresMinutes)} minutes.
      </p>
      <div style="margin:22px 0;padding:18px;text-align:center;background:${brand.bg};border:1px solid ${brand.border};">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${brand.muted};">Reset OTP Code</div>
        <div style="margin-top:10px;font-family:Consolas,Monaco,monospace;font-size:32px;letter-spacing:0.35em;font-weight:700;color:${brand.dark};">${escapeHtml(otp)}</div>
      </div>
      <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
        Do not share this code with anyone. If you did not request a password reset, please ignore this email or reach out to support to secure your account.
      </p>
    `,
    footerNote: "PARIWESH never asks for your OTP or password by phone or chat.",
  }),
});

export const buildPasswordChangedSuccessEmail = ({ name }) => ({
  subject: `${brand.name} · Security Alert: Password Changed`,
  html: wrapLayout({
    title: "Password Changed Successfully",
    eyebrow: "Security Alert",
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
        Hi ${escapeHtml(name || "there")}, your PARIWESH account password was changed successfully.
      </p>
      <div style="margin:16px 0;padding:14px;background:#E8F5E9;border:1px solid #C8E6C9;color:${brand.success};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;">
        ✓ Your password has been updated. You can now use your new password to sign in.
      </div>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
        If you did not perform this change, please contact our support team immediately at contact@pariwesh.co to protect your account.
      </p>
    `,
    footerNote: "PARIWESH account security notification.",
  }),
});

export const buildAdminOrderNotificationEmail = (order) => {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${brand.muted};font-family:Arial,Helvetica,sans-serif;">
      Hello Admin,<br/><br/>
      A new order <strong style="color:${brand.dark};">${escapeHtml(order.orderId)}</strong> has been placed successfully by the customer.
    </p>
    ${orderDetailsBlock(order)}
  `;
  return {
    subject: `[New Order] ${order.orderId} Confirmed (${order.paymentMethod})`,
    html: wrapLayout({
      title: "New Order Confirmed",
      eyebrow: "Admin notification",
      bodyHtml,
      footerNote:
        "This email was automatically generated for the PARIWESH Administrators.",
    }),
  };
};
