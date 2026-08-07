import { authorizedRequest } from "./client.js";

/**
 * Requests Courier Pickup
 */
export const requestShiprocketPickup = async (shipmentId) => {
  console.log(
    `[Shiprocket API] Requesting pickup courier collection for shipment: ${shipmentId}`,
  );

  const res = await authorizedRequest("/v1/external/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Pickup initiation failed with status ${res.status}: ${errText}`,
    );
  }

  const data = await res.json();
  const responseData = data?.response;

  if (!responseData) {
    throw new Error(
      `Pickup result payload is unreadable: ${JSON.stringify(data)}`,
    );
  }

  return {
    pickupToken: String(
      responseData.pickup_token || responseData.pickup_id || "pickup_success",
    ),
    pickupScheduledAt: responseData.pickup_scheduled_date
      ? new Date(responseData.pickup_scheduled_date)
      : new Date(),
  };
};
