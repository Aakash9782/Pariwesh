import { authorizedRequest } from "./client.js";

/**
 * Cancels Shiprocket Order
 */
export const cancelShiprocketOrder = async (shiprocketOrderId) => {
  console.log(
    `[Shiprocket API] Requesting cancellation of order: ${shiprocketOrderId}`,
  );

  const res = await authorizedRequest("/v1/external/orders/cancel", {
    method: "POST",
    body: JSON.stringify({ ids: [shiprocketOrderId] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Cancellation failed with status ${res.status}: ${errText}`,
    );
  }

  return true;
};
