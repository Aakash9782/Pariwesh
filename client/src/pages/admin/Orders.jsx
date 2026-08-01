import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { useSearchParams } from "react-router-dom";
import {
  RiSearchLine,
  RiPrinterLine,
  RiFileExcelLine,
  RiFileList3Line,
  RiCarLine,
  RiCloseLine,
  RiCustomerServiceLine,
  RiCalendarLine,
  RiSaveLine,
} from "react-icons/ri";

const COURIERS = [
  "Delhivery",
  "Shiprocket",
  "BlueDart",
  "Xpressbees",
  "India Post",
  "DTDC",
  "Other",
];

const OrdersPage = () => {
  const { showAlert: alert } = useAlert();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [payFilter, setPayFilter] = useState(
    searchParams.get("paymentStatus") || "",
  );
  const [methodFilter, setMethodFilter] = useState(
    searchParams.get("paymentMethod") || "",
  );
  const [courierFilter, setCourierFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("date") || "all",
  );

  const [showNotesForm, setShowNotesForm] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [showShipForm, setShowShipForm] = useState(false);
  const [shipForm, setShipForm] = useState({
    trackingId: "",
    shippingProvider: "Delhivery",
  });
  const [shipSaving, setShipSaving] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/orders");
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update filters dynamically when searchParams changes
  useEffect(() => {
    const status = searchParams.get("status");
    if (status !== null) setStatusFilter(status);
    const pay = searchParams.get("paymentStatus");
    if (pay !== null) setPayFilter(pay);
    const method = searchParams.get("paymentMethod");
    if (method !== null) setMethodFilter(method);
    const dateVal = searchParams.get("date");
    if (dateVal !== null) setDateFilter(dateVal);
  }, [searchParams]);

  // Detect URL search parameter to inspect order
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId && orders.length > 0) {
      const matched = orders.find((o) => o._id === viewId);
      if (matched) {
        setSelectedOrder(matched);
        setInternalNotes(matched.internalNotes || "");
        setCustomerNotes(matched.customerNotes || "");
      }
    }
  }, [searchParams, orders]);

  const openShipForm = (order = selectedOrder) => {
    if (!order) return;
    setShipForm({
      trackingId: order.trackingId || "",
      shippingProvider: order.shippingProvider || "Delhivery",
    });
    setShowShipForm(true);
  };

  const handleUpdateStatus = async (orderId, newStatus, currentPayStatus) => {
    if (newStatus === "Shipped") {
      openShipForm(selectedOrder);
      return;
    }
    try {
      const updateData = { orderStatus: newStatus };
      if (newStatus === "Delivered") {
        updateData.paymentStatus = "Paid";
      }
      const res = await API.put(`/orders/${orderId}/status`, updateData);
      if (res.data?.success) {
        alert(`Order status updated to ${newStatus}`);
        fetchOrders();
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Status transition failed");
    }
  };

  const handleConfirmShip = async () => {
    if (!selectedOrder) return;
    if (!shipForm.trackingId.trim()) {
      alert("Enter the real AWB / tracking ID from your courier");
      return;
    }
    if (!shipForm.shippingProvider.trim()) {
      alert("Select a courier / shipping provider");
      return;
    }
    try {
      setShipSaving(true);
      const res = await API.put(`/orders/${selectedOrder._id}/status`, {
        orderStatus: "Shipped",
        trackingId: shipForm.trackingId.trim(),
        shippingProvider: shipForm.shippingProvider.trim(),
      });
      if (res.data?.success) {
        alert("Order marked Shipped — customer emailed with AWB");
        setShowShipForm(false);
        fetchOrders();
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to ship order");
    } finally {
      setShipSaving(false);
    }
  };

  const handleSaveShipmentOnly = async () => {
    if (!selectedOrder) return;
    if (!shipForm.trackingId.trim() || !shipForm.shippingProvider.trim()) {
      alert("AWB and courier are both required");
      return;
    }
    try {
      setShipSaving(true);
      const res = await API.put(`/orders/${selectedOrder._id}/status`, {
        trackingId: shipForm.trackingId.trim(),
        shippingProvider: shipForm.shippingProvider.trim(),
      });
      if (res.data?.success) {
        alert("Shipment details saved");
        setShowShipForm(false);
        fetchOrders();
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save shipment");
    } finally {
      setShipSaving(false);
    }
  };

  // Modify payment status separately
  const handleUpdatePaymentStatus = async (orderId, status) => {
    try {
      const res = await API.put(`/orders/${orderId}/status`, {
        paymentStatus: status,
      });
      if (res.data?.success) {
        alert(`Payment status set to ${status}`);
        fetchOrders();
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Order Notes
  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    try {
      const res = await API.put(`/orders/${selectedOrder._id}/status`, {
        internalNotes,
        customerNotes,
      });
      if (res.data?.success) {
        alert("Order operational notes saved");
        fetchOrders();
        // Update local object
        setSelectedOrder({
          ...selectedOrder,
          internalNotes,
          customerNotes,
        });
        setShowNotesForm(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to commit notes");
    }
  };

  // Print Invoice Builder (Dynamic Popup Styled HTML)
  const handlePrintInvoice = (order) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.orderId}</title>
          <style>
            body { font-family: monospace; padding: 40px; color: #111; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .bill-to { margin: 30px 0; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { bg-color: #f5f5f5; }
            .totals { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div>
              <h2>PARIWESH ENTERPRISE LOGISTICS</h2>
              <p>GSTIN: 07AAPPP1234A1Z9</p>
              <p>Email: contact@pariwesh.co | Support: +91 9782XXXXXX</p>
            </div>
            <div>
              <h3>ORDER INVOICE</h3>
              <p>Invoice No: INV-${order.orderId}</p>
              <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="bill-to">
            <strong>BILL TO:</strong>
            <p>${order.shippingAddress?.fullName}</p>
            <p>${order.shippingAddress?.street}, ${order.shippingAddress?.city}</p>
            <p>${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}</p>
            <p>Phone: ${order.shippingAddress?.phone}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Details</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.sku}</td>
                  <td>${item.size}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td>₹${item.price * item.quantity}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="totals font-sans">
            <p>Subtotal: ₹${order.pricing?.subtotal || order.totalPrice}</p>
            <p>Discount: -₹${order.pricing?.discount || 0}</p>
            <p>Delivery Charges: ₹${order.pricing?.delivery || 0}</p>
            <h3>Grand Total: ₹${order.pricing?.grandTotal || order.totalPrice}</h3>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Print AWB Shipping Label Builder
  const handlePrintLabel = (order) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>AWB Shipping Label</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .label-box { border: 3px double #000; padding: 20px; width: 400px; margin: auto; text-align: left; }
            .barcode { font-family: monospace; font-size: 28px; letter-spacing: 6px; text-align: center; margin: 15px 0; border: 1px solid #000; padding: 10px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="label-box">
            <h2 style="text-align: center; border-bottom: 2px solid #000; margin: 0 0 15px; padding-bottom: 5px;">
              PARIWESH SHIPMENT LABEL
            </h2>
            <p><strong>AWB Tracking ID:</strong> ${order.trackingId || "AWB-PENDING"}</p>
            <p><strong>Carrier:</strong> ${order.shippingProvider || "Delhivery Service"}</p>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <hr />
            <p><strong>SHIP TO:</strong></p>
            <h3>${order.shippingAddress?.fullName}</h3>
            <p>${order.shippingAddress?.street}, ${order.shippingAddress?.city}</p>
            <p>${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}</p>
            <p>Mobile: ${order.shippingAddress?.phone}</p>
            <hr />
            <div class="barcode">|||| | |||||| || | || ||</div>
            <p style="text-align: center; font-size: 11px; color:#500;">COD AMOUNT TO COLLECT: ₹${order.paymentMethod === "COD" ? order.pricing?.grandTotal || order.totalPrice : 0}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Excel Spreadsheet table exporter (CSV compatible format)
  const handleExportExcel = () => {
    const headers =
      "OrderID,Client,Phone,Email,Total,Status,PaymentStatus,Provider,AWB_Code,CreatedDate\n";
    const rows = orders
      .map(
        (o) =>
          `"${o.orderId}","${o.customer?.name}","${o.customer?.phone}","${o.customer?.email}",${o.pricing?.grandTotal || o.totalPrice},"${o.orderStatus}","${o.paymentStatus}","${o.shippingProvider}","${o.trackingId}","${new Date(o.createdAt).toLocaleDateString()}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], {
      type: "application/vnd.ms-excel",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pariwesh_order_dispatch_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    alert("Orders tracking sheet exported");
  };

  // Filter Queue Logic
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.phone.includes(searchTerm);

    const matchStatus = statusFilter ? o.orderStatus === statusFilter : true;
    const matchPay = payFilter ? o.paymentStatus === payFilter : true;
    const matchMethod = methodFilter ? o.paymentMethod === methodFilter : true;
    const matchCourier = courierFilter
      ? o.shippingProvider === courierFilter
      : true;

    // Date range filter
    let matchDate = true;
    if (dateFilter === "today") {
      const today = new Date().setHours(0, 0, 0, 0);
      matchDate = new Date(o.createdAt) >= today;
    } else if (dateFilter === "week") {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      matchDate = new Date(o.createdAt) >= lastWeek;
    }

    return (
      matchSearch &&
      matchStatus &&
      matchPay &&
      matchMethod &&
      matchCourier &&
      matchDate
    );
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold tracking-wide text-white">
            Order Dispatch Queue
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Accept courier bindings, adjust payment ledger, and export logistics
            excel sheet
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 text-accent-gold text-xs font-bold py-2.5 px-4.5 rounded-lg border border-slate-800 transition"
        >
          <RiFileExcelLine size={16} />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Advanced filters */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <RiSearchLine
            className="absolute left-3.5 top-3.5 text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by Order ID, buyer name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="all">Date: All Time</option>
          <option value="today">Today</option>
          <option value="week">Past 7 Days</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="">Status: All</option>
          <option value="Placed">Placed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Payment */}
        <select
          value={payFilter}
          onChange={(e) => setPayFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="">Payment: All</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Refunded">Refunded</option>
        </select>

        {/* Courier */}
        <select
          value={courierFilter}
          onChange={(e) => setCourierFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="">Courier Co</option>
          <option value="Delhivery">Delhivery</option>
          <option value="Shiprocket">Shiprocket</option>
          <option value="BlueDart">BlueDart</option>
          <option value="Xpressbees">Xpressbees</option>
        </select>
      </div>

      {/* Orders Table Panel */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
            <tr>
              <th className="py-4.5 px-5">Order ID</th>
              <th className="py-4.5 px-5">Customer Billing Details</th>
              <th className="py-4.5 px-5">Date</th>
              <th className="py-4.5 px-5">Items Qty</th>
              <th className="py-4.5 text-right px-5">Bill Value</th>
              <th className="py-4.5 text-center px-5">Courier provider</th>
              <th className="py-4.5 text-center px-5">Status Flags</th>
              <th className="py-4.5 text-center px-5">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/40">
                  <td className="py-4.5 px-5">
                    <Skeleton className="h-4.5 w-24" />
                  </td>
                  <td className="py-4.5 px-5 space-y-1.5">
                    <Skeleton className="h-4.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="py-4.5 px-5">
                    <Skeleton className="h-3.5 w-20" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-3.5 w-10 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-right">
                    <Skeleton className="h-4.5 w-16 ml-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4.5 w-20 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4.5 w-16 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-7 w-16 mx-auto" />
                  </td>
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-500 italic"
                >
                  No orders catalog matches the filters query
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition">
                  <td className="py-4.5 px-5 font-bold tracking-wider font-mono text-slate-200 text-xs uppercase">
                    {ord.orderId}
                  </td>
                  <td className="py-4.5 px-5 space-y-0.5">
                    <p className="font-semibold text-slate-200 text-sm tracking-tight">
                      {ord.customer?.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono pr-2">
                      {ord.customer?.phone} | {ord.paymentMethod}
                    </p>
                  </td>
                  <td className="py-4.5 px-5 text-slate-400 font-mono text-[10px]">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4.5 px-5 text-slate-400 font-mono text-center">
                    {ord.items?.reduce((ttl, itm) => ttl + itm.quantity, 0)}{" "}
                    Units
                  </td>
                  <td className="py-4.5 text-right px-5 font-bold text-slate-200 text-xs">
                    ₹{ord.pricing?.grandTotal || ord.totalPrice}
                  </td>
                  <td className="py-4.5 text-center px-5">
                    {ord.shippingProvider ? (
                      <span className="font-semibold text-slate-400">
                        {ord.shippingProvider}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4.5 text-center px-5 space-y-1">
                    <span
                      className={`block px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        ord.orderStatus === "Delivered"
                          ? "bg-green-500/10 text-green-400 border border-green-900/10"
                          : ord.orderStatus === "Cancelled"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-900/10"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-900/10"
                      }`}
                    >
                      {ord.orderStatus}
                    </span>
                    <span
                      className={`block px-2 py-0.5 rounded text-[8px] font-bold ${
                        ord.paymentStatus === "Paid"
                          ? "bg-emerald-600/10 text-emerald-400"
                          : "bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4.5 text-center px-5">
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setInternalNotes(ord.internalNotes || "");
                        setCustomerNotes(ord.customerNotes || "");
                        setShowNotesForm(false);
                      }}
                      className="text-accent-gold hover:underline font-semibold"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Side Inspect Overlay details view modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl h-[90vh] overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-4.5">
              <div>
                <h3 className="font-display font-medium text-lg text-white">
                  Inspect Details: {selectedOrder.orderId}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">
                  DatePlaced:{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-accent-gold p-1"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* Content area */}
            <div className="space-y-6 flex-grow py-4">
              {/* Customer information segment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg">
                  <h4 className="text-[10px] uppercase font-extrabold text-accent-gold tracking-wider mb-2 flex items-center">
                    <RiCustomerServiceLine className="mr-1.5" /> Billing Address
                  </h4>
                  <p className="text-slate-200 text-xs font-semibold">
                    {selectedOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-slate-400 text-xs mt-1.5">
                    {selectedOrder.shippingAddress?.street}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {selectedOrder.shippingAddress?.city},{" "}
                    {selectedOrder.shippingAddress?.state}
                  </p>
                  <p className="text-slate-400 text-xs font-mono mt-1">
                    Pincode: {selectedOrder.shippingAddress?.pincode}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg">
                  <h4 className="text-[10px] uppercase font-extrabold text-accent-gold tracking-wider mb-2 flex items-center">
                    <RiCarLine className="mr-1.5" /> Shipment Courier
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Courier:{" "}
                    <span className="text-slate-200 font-semibold">
                      {selectedOrder.shippingProvider || "Unallocated"}
                    </span>
                  </p>
                  <p className="text-slate-400 text-xs mt-1 font-mono">
                    AWB Code:{" "}
                    <span className="text-slate-200">
                      {selectedOrder.trackingId || "AWB-Pending"}
                    </span>
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Pay Methods:{" "}
                    <span className="text-accent-gold text-[10px] font-bold uppercase">
                      {selectedOrder.paymentMethod}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => openShipForm(selectedOrder)}
                    className="mt-3 text-[10px] uppercase tracking-wider text-accent-gold hover:underline"
                  >
                    {selectedOrder.trackingId
                      ? "Edit AWB / courier"
                      : "Assign AWB & ship"}
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-slate-900 border border-slate-850 rounded-lg overflow-hidden">
                <div className="p-3.5 bg-slate-950 border-b border-slate-850 text-xs font-bold uppercase text-slate-400">
                  Ordered Garments ({selectedOrder.items?.length})
                </div>
                <div className="divide-y divide-slate-800">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3.5">
                        {item.image && (
                          <img
                            src={item.image}
                            className="w-9 h-11 object-cover rounded border border-slate-800"
                            alt=""
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-200">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            SKU: {item.sku} | Size: {item.size}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-semibold">
                        <p className="text-slate-300">
                          ₹{item.price} x {item.quantity}
                        </p>
                        <p className="text-accent-gold font-bold">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-lg space-y-3.5">
                <div className="text-xs text-slate-400 uppercase font-bold border-b border-slate-850 pb-2">
                  Pricing details breakdown
                </div>
                <div className="text-xs space-y-2 font-sans">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-slate-100 font-semibold font-mono">
                      ₹{selectedOrder.pricing?.subtotal}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Discount Code</span>
                    <span className="text-red-400 font-mono">
                      -₹{selectedOrder.pricing?.discount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Couriers fee</span>
                    <span className="text-slate-100 font-mono">
                      ₹{selectedOrder.pricing?.delivery || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-accent-gold pt-2 border-t border-slate-800">
                    <span>Grand Total</span>
                    <span className="font-mono">
                      ₹
                      {selectedOrder.pricing?.grandTotal ||
                        selectedOrder.totalPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* CRM / Notes Module Form */}
              <div className="bg-slate-905 border border-slate-850 p-4.5 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] uppercase font-extrabold text-slate-400">
                    Store Internal & Customer Notes
                  </h4>
                  <button
                    onClick={() => setShowNotesForm(!showNotesForm)}
                    className="text-xs text-accent-gold font-bold hover:underline"
                  >
                    {showNotesForm ? "Close note panel" : "Modify notes"}
                  </button>
                </div>

                {showNotesForm ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Internal Office Notes (Auditors only)
                      </label>
                      <input
                        type="text"
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="e.g. Delayed shipment packaging, checked for premium quality suits"
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Customer Delivery notes
                      </label>
                      <input
                        type="text"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="e.g. Deliver during weekends afternoon only"
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="bg-accent-gold text-slate-950 text-xs font-bold py-2 px-4 rounded hover:bg-yellow-500 flex items-center space-x-1.5"
                    >
                      <RiSaveLine size={14} />
                      <span>Save Notes</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <p className="bg-slate-950/40 p-2.5 rounded border border-slate-850 text-slate-400">
                      <strong>Internal:</strong>{" "}
                      {selectedOrder.internalNotes || (
                        <span className="italic text-slate-600">None</span>
                      )}
                    </p>
                    <p className="bg-slate-950/40 p-2.5 rounded border border-slate-850 text-slate-400">
                      <strong>Customer:</strong>{" "}
                      {selectedOrder.customerNotes || (
                        <span className="italic text-slate-600">None</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="border-t border-slate-850 p-4.5 bg-slate-950 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <button
                onClick={() => handlePrintInvoice(selectedOrder)}
                className="flex items-center justify-center space-x-1.5 border border-slate-800 hover:border-slate-700 text-slate-350 text-xs font-semibold py-2 px-3 rounded-lg bg-slate-900 transition"
              >
                <RiPrinterLine size={15} />
                <span>Invoice PDF</span>
              </button>

              <button
                onClick={() => handlePrintLabel(selectedOrder)}
                className="flex items-center justify-center space-x-1.5 border border-slate-800 hover:border-slate-700 text-slate-350 text-xs font-semibold py-2 px-3 rounded-lg bg-slate-900 transition"
              >
                <RiFileList3Line size={15} />
                <span>AWB Label</span>
              </button>

              <select
                value={selectedOrder.orderStatus}
                onChange={(e) =>
                  handleUpdateStatus(
                    selectedOrder._id,
                    e.target.value,
                    selectedOrder.paymentStatus,
                  )
                }
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none"
              >
                <option value="Placed">Status: Placed</option>
                <option value="Processing">Status: Pack & Processing</option>
                <option value="Shipped">Status: Ship Parcel</option>
                <option value="Delivered">Status: Mark Delivered</option>
                <option value="Cancelled">Status: Cancel Booking</option>
              </select>

              <select
                value={selectedOrder.paymentStatus}
                onChange={(e) =>
                  handleUpdatePaymentStatus(selectedOrder._id, e.target.value)
                }
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none"
              >
                <option value="Pending">Payment: Pending</option>
                <option value="Paid">Payment: Completed</option>
                <option value="Refunded">Payment: Refunded</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {showShipForm && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-display text-lg">
                  Ship order
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the real AWB from your courier dashboard for{" "}
                  <span className="text-slate-200 font-mono">
                    {selectedOrder.orderId}
                  </span>
                  . Fake codes are no longer generated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShipForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Courier *
              </label>
              <select
                value={shipForm.shippingProvider}
                onChange={(e) =>
                  setShipForm({ ...shipForm, shippingProvider: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5"
              >
                {COURIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                AWB / Tracking ID *
              </label>
              <input
                type="text"
                value={shipForm.trackingId}
                onChange={(e) =>
                  setShipForm({ ...shipForm, trackingId: e.target.value })
                }
                placeholder="Paste AWB from Delhivery / Shiprocket / etc."
                className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg p-2.5 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={shipSaving}
                onClick={handleConfirmShip}
                className="flex-1 bg-accent-gold text-secondary text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg disabled:opacity-50"
              >
                {shipSaving ? "Saving…" : "Mark shipped"}
              </button>
              <button
                type="button"
                disabled={shipSaving}
                onClick={handleSaveShipmentOnly}
                className="px-3 border border-slate-700 text-slate-300 text-xs rounded-lg hover:border-slate-500"
              >
                Save AWB only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
