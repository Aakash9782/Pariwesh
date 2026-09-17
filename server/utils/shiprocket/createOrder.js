import { authorizedRequest } from "./client.js";

/**
 * Creates an order in Shiprocket (Adhoc)
 */
export const createShiprocketOrder = async (order) => {
  console.log(
    `[Shiprocket API] Creating order for local order: ${order.orderId}`,
  );

  // Split name into first and last name for billing_customer_name
  const nameParts = (order.customer.name || "Customer").trim().split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "Customer";

  // Order items structure formatting
  const orderItems = order.items.map((item) => ({
    name: item.name || "Product Item",
    sku: item.sku || "PROD-GENERIC",
    units: Number(item.quantity) || 1,
    selling_price: Number(item.price || 0),
    discount: 0,
    tax: Number(item.gstRate ?? 5) || 5,
    hsn: Number(item.hsnCode || 6204) || 6204,
  }));

  // Build order payload
  // Format date: YYYY-MM-DD HH:mm
  const orderDate = new Date(order.createdAt || Date.now())
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");

  // Compute realistic parcel weight & dimensions from ordered garment units
  const totalUnits = (order.items || []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 1),
    0,
  );
  const calculatedWeight = Math.max(
    0.5,
    Math.round(totalUnits * 0.45 * 100) / 100,
  );
  const length = 28;
  const breadth = Math.min(25, 18 + totalUnits * 2);
  const height = Math.min(15, 3 + totalUnits * 2);

  const payload = {
    order_id: order.orderId,
    order_date: orderDate,
    pickup_location:
      process.env.SHIPROCKET_PICKUP_LOCATION || "Primary Warehouse",
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: order.shippingAddress.street || "Street address",
    billing_city: order.shippingAddress.city || "City",
    billing_pincode: order.shippingAddress.pincode || "302001",
    billing_state: order.shippingAddress.state || "State",
    billing_country: "India",
    billing_email: order.customer.email || "customer@pariwesh.co",
    billing_phone:
      order.shippingAddress.phone || order.customer.phone || "0000000000",
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
    sub_total:
      Number(order.pricing?.subtotal) || Number(order.pricing?.grandTotal),
    total_discount: Number(order.pricing?.discount || 0),
    shipping_charges: Number(order.pricing?.delivery || 0),
    length,
    breadth,
    height,
    weight: calculatedWeight,
  };

  const res = await authorizedRequest("/v1/external/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Order creation failed with status ${res.status}: ${errText}`,
    );
  }

  const data = await res.json();
  if (!data.order_id || !data.shipment_id) {
    throw new Error(
      `Invalid response payload from order creation: ${JSON.stringify(data)}`,
    );
  }

  return {
    shiprocketOrderId: String(data.order_id),
    shiprocketShipmentId: String(data.shipment_id),
  };
};
