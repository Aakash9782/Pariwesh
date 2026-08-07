import { authorizedRequest } from "./client.js";

/**
 * Generates Shipment Manifest PDF by first generating the manifest
 * and then requesting the print job.
 */
export const generateShiprocketManifest = async (shipmentId) => {
  console.log(
    `[Shiprocket API] Step 1: Generating manifest for shipment: ${shipmentId}`,
  );

  const genRes = await authorizedRequest("/v1/external/manifests/generate", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  if (!genRes.ok) {
    const errText = await genRes.text();
    throw new Error(
      `Manifest generation failed with status ${genRes.status}: ${errText}`,
    );
  }

  console.log(
    `[Shiprocket API] Step 2: Requesting Print Manifest PDF for shipment: ${shipmentId}`,
  );

  const printRes = await authorizedRequest("/v1/external/manifests/print", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  if (!printRes.ok) {
    const errText = await printRes.text();
    throw new Error(
      `Manifest print request failed with status ${printRes.status}: ${errText}`,
    );
  }

  const data = await printRes.json();
  if (!data.manifest_url) {
    throw new Error(
      `Manifest print response lacks manifest_url details: ${JSON.stringify(data)}`,
    );
  }

  return data.manifest_url;
};
