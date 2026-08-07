import { authorizedRequest } from "./client.js";

/**
 * Gets the best courier recommendations based on serviceability
 */
export const getCourierRecommendations = async (shipmentId) => {
  console.log(
    `[Shiprocket API] Fetching courier recommendations for shipment: ${shipmentId}`,
  );

  const res = await authorizedRequest(
    `/v1/external/courier/serviceability/?shipment_id=${shipmentId}`,
    {
      method: "GET",
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Courier recommendation query failed with status ${res.status}: ${errText}`,
    );
  }

  const data = await res.json();
  const companies = data?.data?.available_courier_companies || [];

  if (companies.length === 0) {
    throw new Error(`No couriers found servicing shipment ID: ${shipmentId}`);
  }

  // Filter out blockages and sort by weight/cheapest/rating
  const sorted = companies.sort(
    (a, b) => Number(b.rate || 0) - Number(a.rate || 0),
  );
  return sorted[0]; // Returns best recommended company
};
