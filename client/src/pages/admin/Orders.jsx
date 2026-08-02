import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import Select from "../../components/admin/ui/Select.jsx";
import StatusPill from "../../components/admin/ui/StatusPill.jsx";
import Badge from "../../components/admin/ui/Badge.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import Modal from "../../components/admin/ui/Modal.jsx";
import EmptyState from "../../components/admin/ui/EmptyState.jsx";
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
  RiArrowRightSLine,
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
      "\ufeffOrder ID,Customer Name,Phone,Email,Total,Order Status,Payment Status,Courier,AWB,Created Date\n";
    const rows = orders
      .map(
        (o) =>
          `"${o.orderId}","${o.customer?.name || ""}","${o.customer?.phone || ""}","${o.customer?.email || ""}",${o.pricing?.grandTotal || o.totalPrice || 0},"${o.orderStatus || ""}","${o.paymentStatus || ""}","${o.shippingProvider || "Not Assigned"}","${o.trackingId || "Pending"}","${new Date(o.createdAt).toLocaleDateString()}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pariwesh_logistics_dispatch_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
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
      <PageHeader
        title="Order Dispatch Queue"
        subtitle="Manage courier configuration, payment loggers, and customer parcel workflows"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Orders" },
        ]}
        actions={
          <Button
            variant="outline"
            className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 border-slate-200"
            onClick={handleExportExcel}
          >
            <RiFileExcelLine size={16} />
            <span>Export Logistics xls</span>
          </Button>
        }
      />

      {/* Advanced filters */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <RiSearchLine
            className="absolute left-3 top-3 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by Order ID, buyer name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          />
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="all">Date: All Time</option>
          <option value="today">Today</option>
          <option value="week">Past 7 Days</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
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
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
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
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="">Courier Co</option>
          {COURIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Card>

      {/* Orders Table Panel */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[900px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-5">Order ID</th>
                <th className="py-4 px-5">Customer Billing Details</th>
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Items Qty</th>
                <th className="py-4 text-right px-5">Bill Value</th>
                <th className="py-4 text-center px-5">Courier provider</th>
                <th className="py-4 text-center px-5">Status Flags</th>
                <th className="py-4 text-center px-5">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-5 space-y-1.5">
                      <SkeletonLoader className="h-4 w-32" />
                      <SkeletonLoader className="h-3 w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-3.5 w-20" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-3.5 w-10 mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <SkeletonLoader className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-20 mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-7 w-16 mx-auto rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No orders catalog matches the filters query
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-5 font-semibold font-mono text-slate-800 text-xs uppercase">
                      #{ord.orderId}
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-900 text-xs">
                        {ord.customer?.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {ord.customer?.phone} | {ord.paymentMethod}
                      </p>
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-mono text-[10px]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-mono text-center border-none">
                      {ord.items?.reduce((ttl, itm) => ttl + itm.quantity, 0)}{" "}
                      Units
                    </td>
                    <td className="py-4 text-right px-5 font-bold text-slate-900 text-xs border-none">
                      ₹{ord.pricing?.grandTotal || ord.totalPrice}
                    </td>
                    <td className="py-4 text-center px-5 border-none">
                      {ord.shippingProvider ? (
                        <span className="font-medium text-slate-700">
                          {ord.shippingProvider}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center px-5 space-y-1 border-none">
                      <div className="flex flex-col items-center gap-1">
                        <StatusPill status={ord.orderStatus} />
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                            ord.paymentStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-705 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-center px-5 border-none">
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setInternalNotes(ord.internalNotes || "");
                          setCustomerNotes(ord.customerNotes || "");
                          setShowNotesForm(false);
                        }}
                        className="text-[#c5a880] hover:underline font-semibold text-xs flex items-center justify-center mx-auto"
                      >
                        Inspect <RiArrowRightSLine className="ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side Inspect Overlay (Refactored to gorgeous light drawer/modal) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl h-[92vh] overflow-y-auto p-6 space-y-6 flex flex-col justify-between animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 shrink-0">
              <div>
                <h3 className="font-display font-medium text-base text-slate-900 tracking-wide uppercase">
                  Inspect Details: #{selectedOrder.orderId}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono font-bold">
                  Date Placed:{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-[#c5a880] p-1.5 hover:bg-slate-50 rounded-full transition"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Content area */}
            <div className="space-y-5 flex-grow overflow-y-auto py-2 pr-1">
              {/* Customer information segment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#FAF9F6]/50 border border-slate-200 p-4 rounded-lg">
                  <h4 className="text-[10px] uppercase font-bold text-[#c5a880] tracking-wider mb-2.5 flex items-center">
                    <RiCustomerServiceLine className="mr-1.5" size={14} />{" "}
                    Billing Address
                  </h4>
                  <p className="text-slate-900 text-xs font-semibold">
                    {selectedOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    {selectedOrder.shippingAddress?.street}
                  </p>
                  <p className="text-slate-600 text-xs">
                    {selectedOrder.shippingAddress?.city},{" "}
                    {selectedOrder.shippingAddress?.state}
                  </p>
                  <p className="text-slate-500 text-xs font-mono mt-1 font-semibold">
                    Pincode: {selectedOrder.shippingAddress?.pincode}
                  </p>
                </div>

                <div className="bg-[#FAF9F6]/50 border border-slate-200 p-4 rounded-lg">
                  <h4 className="text-[10px] uppercase font-bold text-[#c5a880] tracking-wider mb-2.5 flex items-center">
                    <RiCarLine className="mr-1.5" size={14} /> Shipment Courier
                  </h4>
                  <p className="text-slate-600 text-xs flex justify-between">
                    <span>Courier:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedOrder.shippingProvider || "Unallocated"}
                    </span>
                  </p>
                  <p className="text-slate-600 text-xs mt-1 font-mono flex justify-between">
                    <span>AWB Code:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedOrder.trackingId || "AWB-Pending"}
                    </span>
                  </p>
                  <p className="text-slate-600 text-xs mt-1 flex justify-between items-center">
                    <span>Payment Method:</span>
                    <span className="text-[#c5a880] text-[10px] font-bold uppercase bg-amber-50 px-2 py-0.5 rounded">
                      {selectedOrder.paymentMethod}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => openShipForm(selectedOrder)}
                    className="mt-3 text-[10px] uppercase tracking-wider text-[#c5a880] hover:underline font-bold text-left"
                  >
                    {selectedOrder.trackingId
                      ? "Edit AWB / courier"
                      : "Assign AWB & ship"}
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-3 bg-[#FAF9F6] border-b border-slate-200 text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Ordered Garments ({selectedOrder.items?.length})
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3.5">
                        {item.image && (
                          <img
                            src={item.image}
                            className="w-10 h-12 object-cover rounded border border-slate-100"
                            alt=""
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-505 text-slate-500 font-mono mt-0.5">
                            SKU: {item.sku} | Size: {item.size}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 font-medium font-mono text-[11px]">
                          ₹{item.price} x {item.quantity}
                        </p>
                        <p className="text-[#c5a880] font-bold font-mono text-xs">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-3">
                <div className="text-xs text-slate-505 text-slate-500 uppercase font-bold border-b border-slate-100 pb-2">
                  Pricing details breakdown
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Subtotal</span>
                    <span className="text-slate-800 font-semibold font-mono">
                      ₹
                      {selectedOrder.pricing?.subtotal ||
                        selectedOrder.totalPrice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-550 text-slate-500">
                    <span>Discount Code</span>
                    <span className="text-red-500 font-mono">
                      -₹{selectedOrder.pricing?.discount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Courier Delivery Fee</span>
                    <span className="text-slate-800 font-mono">
                      ₹{selectedOrder.pricing?.delivery || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-[#c5a880] pt-2 border-t border-slate-100">
                    <span>Grand Total</span>
                    <span className="font-mono text-xs">
                      ₹
                      {selectedOrder.pricing?.grandTotal ||
                        selectedOrder.totalPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* CRM / Notes Module Form */}
              <div className="bg-[#FAF9F6]/40 border border-slate-200 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500">
                    Store Internal & Customer Notes
                  </h4>
                  <button
                    onClick={() => setShowNotesForm(!showNotesForm)}
                    className="text-xs text-[#c5a880] font-semibold hover:underline"
                  >
                    {showNotesForm ? "Close note panel" : "Modify notes"}
                  </button>
                </div>

                {showNotesForm ? (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] text-slate-555 text-slate-500 font-bold uppercase tracking-wider text-left">
                        Internal Notes (Auditors only)
                      </label>
                      <input
                        type="text"
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="e.g. Delayed shipment packaging, checked for premium quality suits"
                        className="w-full bg-[#FAF9F6] border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-[#c5a880]"
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-left">
                        Customer Delivery notes
                      </label>
                      <input
                        type="text"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="e.g. Deliver during weekends afternoon only"
                        className="w-full bg-[#FAF9F6] border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-[#c5a880]"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      className="flex items-center space-x-1.5"
                    >
                      <RiSaveLine size={14} />
                      <span>Save Notes</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="bg-white p-3 rounded border border-slate-100 text-slate-600">
                      <strong className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                        Internal:
                      </strong>{" "}
                      {selectedOrder.internalNotes || (
                        <span className="italic text-slate-400">None</span>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-100 text-slate-600 text-slate-600">
                      <strong className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                        Customer:
                      </strong>{" "}
                      {selectedOrder.customerNotes || (
                        <span className="italic text-slate-400">None</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="border-t border-slate-100 pt-4 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3 bg-white">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintInvoice(selectedOrder)}
                className="flex items-center justify-center space-x-1.5 border-slate-200"
              >
                <RiPrinterLine size={15} />
                <span>Invoice PDF</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintLabel(selectedOrder)}
                className="flex items-center justify-center space-x-1.5 text-[#c5a880] border-[#c5a880]/30"
              >
                <RiFileList3Line size={15} />
                <span>AWB Label</span>
              </Button>

              <select
                value={selectedOrder.orderStatus}
                onChange={(e) =>
                  handleUpdateStatus(
                    selectedOrder._id,
                    e.target.value,
                    selectedOrder.paymentStatus,
                  )
                }
                className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
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
                className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
              >
                <option value="Pending">Payment: Pending</option>
                <option value="Paid">Payment: Completed</option>
                <option value="Refunded">Payment: Refunded</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Ship Form Modal */}
      {showShipForm && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xl animate-zoom-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-slate-900 font-display font-medium text-base">
                  Ship Order Packet
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter tracking configuration for order{" "}
                  <span className="text-slate-800 font-mono font-bold">
                    #{selectedOrder.orderId}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShipForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                Courier Provider *
              </label>
              <select
                value={shipForm.shippingProvider}
                onChange={(e) =>
                  setShipForm({ ...shipForm, shippingProvider: e.target.value })
                }
                className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880]"
              >
                {COURIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                AWB / Tracking Code *
              </label>
              <input
                type="text"
                value={shipForm.trackingId}
                onChange={(e) =>
                  setShipForm({ ...shipForm, trackingId: e.target.value })
                }
                placeholder="Paste AWB from Delhivery / Shiprocket / etc."
                className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                disabled={shipSaving}
                onClick={handleConfirmShip}
                className="flex-1"
              >
                {shipSaving ? "Marking…" : "Mark Shipped"}
              </Button>
              <Button
                variant="outline"
                disabled={shipSaving}
                onClick={handleSaveShipmentOnly}
                className="border-slate-200"
              >
                Save AWB Only
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
