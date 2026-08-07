import { authorizedRequest } from "./client.js";

/**
 * Generates Shipping Label PDF
 */
export const generateShiprocketLabel = async (shipmentId) => {
  console.log(
    `[Shiprocket API] Requesting Label PDF for shipment: ${shipmentId}`,
  );

  const res = await authorizedRequest("/v1/external/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Label generation failed with status ${res.status}: ${errText}`,
    );
  }

  const data = await res.json();
  if (!data.label_created || !data.label_url) {
    throw new Error(
      `Label response lacks URL details: ${JSON.stringify(data)}`,
    );
  }

  return data.label_url;
};
