import { authorizedRequest } from "./client.js";

/**
 * Generates Shipping Invoice PDF
 */
export const generateShiprocketInvoice = async (orderIds) => {
  // orderIds must be an array of Shiprocket Order IDs
  const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
  console.log(
    `[Shiprocket API] Requesting Invoice PDF for orders: ${ids.join(",")}`,
  );

  const res = await authorizedRequest("/v1/external/orders/print/invoice", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Invoice generation failed with status ${res.status}: ${errText}`,
    );
  }

  const data = await res.json();
  if (!data.invoice_url) {
    throw new Error(
      `Invoice response lacks URL details: ${JSON.stringify(data)}`,
    );
  }

  return data.invoice_url;
};
