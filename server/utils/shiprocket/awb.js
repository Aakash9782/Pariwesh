import { authorizedRequest } from "./client.js";

/**
 * Assigns AWB code using selected courierID
 */
export const assignShiprocketAWB = async (shipmentId, courierId) => {
  console.log(
    `[Shiprocket API] Assigning AWB on shipment: ${shipmentId} using courier: ${courierId}`,
  );

  const payload = {
    shipment_id: shipmentId,
  };
  if (courierId) {
    payload.courier_id = courierId;
  }

  const res = await authorizedRequest("/v1/external/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `AWB allocation failed with status ${res.status}: ${errText}`,
    );
  }

  const data = await res.json();
  const responseData = data?.data?.response;

  if (!responseData || !responseData.awb_code) {
    throw new Error(
      `AWB assignment returned empty code: ${JSON.stringify(data)}`,
    );
  }

  return {
    awbCode: String(responseData.awb_code),
    courierName: String(responseData.courier_name || "Shiprocket Delivery"),
    courierId: String(responseData.courier_company_id || courierId || ""),
  };
};
