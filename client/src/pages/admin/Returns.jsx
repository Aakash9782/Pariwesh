import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import Select from "../../components/admin/ui/Select.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiSearchLine,
  RiFileList3Line,
  RiCloseLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiAttachmentLine,
  RiCarLine,
  RiExchangeBoxLine,
  RiAlertLine,
  RiExchangeLine,
} from "react-icons/ri";

const ReturnsPage = () => {
  const { showAlert: alert } = useAlert();
  const [searchParams] = useSearchParams();

  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [gradeFilter, setGradeFilter] = useState("");

  // Sync status filter choice if URL searchParams shifts
  useEffect(() => {
    const status = searchParams.get("status");
    if (status !== null) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  // Rejection & QC & Settlement Form States
  const [rejectionReason, setRejectionReason] = useState("");
  const [qcGrade, setQcGrade] = useState("A_GRADE");
  const [qcRemarks, setQcRemarks] = useState("");
  const [lossCategory, setLossCategory] = useState("NA");
  const [upiId, setUpiId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/returns");
      if (res.data?.success) {
        setReturns(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load return requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Set local state when selectedReturn shifts
  useEffect(() => {
    if (selectedReturn) {
      setRejectionReason(selectedReturn.rejectionReason || "");
      setQcGrade(
        selectedReturn.qcGrading?.grade === "PENDING"
          ? "A_GRADE"
          : selectedReturn.qcGrading?.grade,
      );
      setQcRemarks(selectedReturn.qcGrading?.remarks || "");
      setLossCategory(selectedReturn.lossCategory || "NA");
      setUpiId(selectedReturn.refundDetails?.upiId || "");
      setTransactionId(selectedReturn.refundDetails?.transactionId || "");
    }
  }, [selectedReturn]);

  const handleUpdateStatus = async (statusPayload) => {
    if (!selectedReturn) return;
    try {
      setActionLoading(true);
      const res = await API.put(
        `/returns/${selectedReturn._id}`,
        statusPayload,
      );
      if (res.data?.success) {
        alert(
          `Return status updated to ${statusPayload.status.replace("_", " ")}`,
        );
        fetchReturns();
        setSelectedReturn(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update return status");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit final QC inspection and trigger refund completion
  const handleQCComplete = async (e) => {
    e.preventDefault();
    if (!selectedReturn) return;

    if (qcGrade !== "A_GRADE" && (lossCategory === "NA" || !lossCategory)) {
      alert("Loss category code must be defined for non-A Grade returns.");
      return;
    }

    if (selectedReturn.orderId?.paymentMethod === "COD" && !upiId.trim()) {
      alert("UPI ID is required to complete COD return refunds.");
      return;
    }

    const payload = {
      status: "Return_Completed",
      qcGrading: {
        grade: qcGrade,
        remarks: qcRemarks,
      },
      lossCategory: qcGrade === "A_GRADE" ? "NA" : lossCategory,
      refundDetails: {
        upiId: upiId.trim(),
        transactionId: transactionId.trim(),
      },
    };

    await handleUpdateStatus(payload);
  };

  // Mark request under Dispute (Courier loss/fraud mismatch)
  const handleMarkDisputed = async () => {
    if (lossCategory === "NA" || !lossCategory) {
      alert("Please select a specific Loss Category to route to dispute.");
      return;
    }
    const payload = {
      status: "Return_Disputed",
      lossCategory,
      refundDetails: {
        upiId: upiId.trim(),
        transactionId: transactionId.trim(),
      },
    };
    await handleUpdateStatus(payload);
  };

  // Filter returns lists
  const filteredReturns = returns.filter((ret) => {
    const matchesSearch =
      ret.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.orderId?.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ret.customerId?.name &&
        ret.customerId.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter ? ret.status === statusFilter : true;
    const matchesGrade = gradeFilter
      ? ret.qcGrading?.grade === gradeFilter
      : true;

    return matchesSearch && matchesStatus && matchesGrade;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-700">
      {/* 1. Header Section */}
      <PageHeader
        title="Reverse Logistics & Returns"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Returns" },
        ]}
        subtitle="Verify refund claims, audit QC grades, track warehouse entry and process settlements."
      />

      {/* 2. Search & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#FAF9F6] p-4 rounded-lg border border-slate-200">
        <div className="relative">
          <RiSearchLine
            className="absolute left-3 top-3 text-slate-400"
            size={17}
          />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
            placeholder="Search Return ID, Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Return_Requested">Return Requested</option>
            <option value="Return_Approved">Approved (In Transit)</option>
            <option value="Return_Rejected">Rejected</option>
            <option value="Return_In_Transit">Courier In Transit</option>
            <option value="Return_Received">Received at Whse</option>
            <option value="Return_Completed">Completed</option>
            <option value="Return_Disputed">Disputed</option>
          </select>
        </div>

        <div>
          <select
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">All QC Grades</option>
            <option value="PENDING">Pending Audit</option>
            <option value="A_GRADE">A Grade (Saleable)</option>
            <option value="B_GRADE">B Grade (Discount Retail)</option>
            <option value="C_GRADE">C Grade (Damaged Item)</option>
            <option value="SCRAP">Scrap (Write Off)</option>
          </select>
        </div>

        <div>
          <Button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setGradeFilter("");
            }}
            variant="outline"
            size="sm"
            className="w-full h-full text-slate-700 hover:text-slate-900 border-slate-200"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* 3. Main Data Roster Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Return ID</th>
                <th className="px-6 py-4">Order ID / Customer</th>
                <th className="px-6 py-4">Quantity / Items</th>
                <th className="px-6 py-4">Refund Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">QC Grade</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <SkeletonLoader className="h-4 w-28 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <SkeletonLoader className="h-4 w-40 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <SkeletonLoader className="h-4 w-16 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <SkeletonLoader className="h-4 w-20 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <SkeletonLoader className="h-4 w-24 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <SkeletonLoader className="h-4 w-24 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <SkeletonLoader className="h-8 w-20 ml-auto rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-12 text-slate-500 font-medium"
                  >
                    No matching return requests found in record queue.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret, idx) => {
                  const itemsCount = ret.items.reduce(
                    (acc, curr) => acc + curr.quantity,
                    0,
                  );
                  const isCOD = ret.orderId?.paymentMethod === "COD";

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors text-slate-700"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {ret.returnId}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-mono text-slate-800 font-medium">
                          {ret.orderId?.orderId || "Order details deleted"}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-bold">
                            {ret.customerId?.name || "Member Client"}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span>{isCOD ? "COD" : "Prepaid"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">
                        {itemsCount} {itemsCount > 1 ? "items" : "item"}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#c5a880]">
                        ₹{ret.refundDetails?.amount || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase border ${
                            ret.status === "Return_Completed"
                              ? "bg-emerald-55 text-emerald-700 border-emerald-100"
                              : ret.status === "Return_Rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : ret.status === "Return_Disputed"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-slate-100 text-slate-605 border border-slate-200"
                          }`}
                        >
                          {ret.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold text-[9px] uppercase ${
                            ret.qcGrading?.grade === "A_GRADE"
                              ? "text-emerald-600"
                              : ret.qcGrading?.grade === "PENDING"
                                ? "text-amber-550"
                                : "text-rose-500"
                          }`}
                        >
                          {ret.qcGrading?.grade.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => setSelectedReturn(ret)}
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1.5 px-3 h-auto text-[#c5a880] border-[#c5a880]/30 hover:bg-[#c5a880]/10"
                        >
                          Inspect Ticket
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Inspection & Operations Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative animate-fade-in my-8 text-xs text-slate-700">
            {/* Modal Exit */}
            <button
              onClick={() => {
                setSelectedReturn(null);
                setViewingPhoto(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 focus:outline-none"
            >
              <RiCloseLine size={22} />
            </button>

            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800">
                  Return Ticket Audit: {selectedReturn.returnId}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-bold tracking-wide">
                  Order reference: {selectedReturn.orderId?.orderId} | Status:{" "}
                  <span className="text-[#c5a880]">
                    {selectedReturn.status.replace("_", " ")}
                  </span>
                </p>
              </div>

              {/* Action buttons list based on Status */}
              <div className="flex items-center gap-2">
                {selectedReturn.status === "Return_Requested" && (
                  <>
                    <Button
                      onClick={() =>
                        handleUpdateStatus({ status: "Return_Approved" })
                      }
                      loading={actionLoading}
                      variant="primary"
                      size="sm"
                      className="bg-emerald-605 hover:bg-emerald-700 border-none flex items-center gap-1"
                    >
                      <RiCheckboxCircleLine size={14} /> Approve Request
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt(
                          "Enter Rejection Reason:",
                          rejectionReason,
                        );
                        if (reason !== null) {
                          handleUpdateStatus({
                            status: "Return_Rejected",
                            rejectionReason: reason,
                          });
                        }
                      }}
                      loading={actionLoading}
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 flex items-center gap-1"
                    >
                      <RiCloseCircleLine size={14} /> Reject Request
                    </Button>
                  </>
                )}

                {selectedReturn.status === "Return_Approved" && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus({ status: "Return_In_Transit" })
                    }
                    loading={actionLoading}
                    variant="outline"
                    size="sm"
                    className="text-slate-700 border-slate-200 flex items-center gap-1.5"
                  >
                    <RiCarLine size={14} /> Mark Picked (In Transit)
                  </Button>
                )}

                {selectedReturn.status === "Return_In_Transit" && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus({ status: "Return_Received" })
                    }
                    loading={actionLoading}
                    variant="outline"
                    size="sm"
                    className="text-slate-700 border-slate-200 flex items-center gap-1.5"
                  >
                    <RiExchangeLine size={14} /> Mark Warehouse Received
                  </Button>
                )}
              </div>
            </div>

            {/* Content Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Return Claims data */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                    Claimed Items
                  </h4>
                  <div className="space-y-3 bg-slate-50 border border-slate-200 p-3 rounded">
                    {selectedReturn.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            {it.name}
                          </div>
                          <div className="text-[10px] text-slate-505 uppercase">
                            SKU: {it.sku} | Size: {it.size} | Qty: {it.quantity}
                          </div>
                        </div>
                        <span className="font-bold text-slate-600">
                          ₹{it.price * it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                    Return Details & Reason
                  </h4>
                  <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">
                        User Reason:
                      </span>
                      <span className="font-bold text-slate-800">
                        {selectedReturn.reason}
                      </span>
                    </div>
                    {selectedReturn.rejectionReason && (
                      <div className="flex justify-between text-rose-600">
                        <span className="font-semibold">Rejection Reason:</span>
                        <span className="font-bold">
                          {selectedReturn.rejectionReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                    Claim Evidence Uploads
                  </h4>
                  {selectedReturn.evidenceTrail?.customerUploads?.length ===
                  0 ? (
                    <p className="text-[10px] text-slate-500 italic">
                      No photos/videos uploaded by customer.
                    </p>
                  ) : (
                    <div className="flex gap-3">
                      {selectedReturn.evidenceTrail.customerUploads.map(
                        (href, index) => (
                          <div
                            key={index}
                            onClick={() => setViewingPhoto(href)}
                            className="relative w-16 h-20 bg-slate-100 border border-slate-200 rounded overflow-hidden cursor-pointer hover:border-[#c5a880] transition-all"
                          >
                            <img
                              src={href}
                              alt="Evidence"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Audit Trail Timeline */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                    Reverse Logistics Timeline TAT
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Requested at:</span>
                      <span className="text-slate-800 font-semibold">
                        {new Date(
                          selectedReturn.timeline.requestedAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedReturn.timeline.reviewedAt && (
                      <div className="flex justify-between">
                        <span>Reviewed:</span>
                        <span className="text-slate-800 font-semibold">
                          {new Date(
                            selectedReturn.timeline.reviewedAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedReturn.timeline.pickedAt && (
                      <div className="flex justify-between">
                        <span>Picked:</span>
                        <span className="text-slate-800 font-semibold">
                          {new Date(
                            selectedReturn.timeline.pickedAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedReturn.timeline.receivedAt && (
                      <div className="flex justify-between">
                        <span>Received Whse:</span>
                        <span className="text-slate-800 font-semibold">
                          {new Date(
                            selectedReturn.timeline.receivedAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedReturn.timeline.qcCompletedAt && (
                      <div className="flex justify-between">
                        <span>QC Done:</span>
                        <span className="text-slate-800 font-semibold">
                          {new Date(
                            selectedReturn.timeline.qcCompletedAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: QC Audit Form + Financial Settlement */}
              <div className="bg-[#FAF9F6] border border-slate-200 p-5 rounded-lg space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                    Action Dashboard Zone
                  </h4>
                  {selectedReturn.status !== "Return_Completed" &&
                  selectedReturn.status !== "Return_Rejected" ? (
                    <form onSubmit={handleQCComplete} className="space-y-4">
                      {/* QC Grading Options */}
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                          Quality (QC) Grading
                        </label>
                        <select
                          value={qcGrade}
                          onChange={(e) => setQcGrade(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded p-2 outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] text-xs"
                        >
                          <option value="A_GRADE">
                            A Grade (Pass & Auto-Restock)
                          </option>
                          <option value="B_GRADE">
                            B Grade (Minor Defect - No Restock)
                          </option>
                          <option value="C_GRADE">
                            C Grade (Damaged - No Restock)
                          </option>
                          <option value="SCRAP">
                            Scrap (Discard - Write Off)
                          </option>
                        </select>
                      </div>

                      {/* Loss Category Dropdown (Conditional on B, C, Scrap) */}
                      {qcGrade !== "A_GRADE" && (
                        <div className="space-y-1">
                          <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                            Financial Loss Category *
                          </label>
                          <select
                            value={lossCategory}
                            onChange={(e) => setLossCategory(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-800 rounded p-2 outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] text-xs"
                            required
                          >
                            <option value="NA">-- Select Category --</option>
                            <option value="Courier_Damage">
                              Courier Damage
                            </option>
                            <option value="Customer_Fraud">
                              Customer Fraud
                            </option>
                            <option value="Warehouse_Damage">
                              Warehouse Damage
                            </option>
                            <option value="Lost_Parcel">Lost Parcel</option>
                          </select>
                        </div>
                      )}

                      {/* QC Remarks */}
                      <div className="space-y-1">
                        <label className="block text-slate-505 font-bold uppercase tracking-wider text-[9px]">
                          QC Remarks / Observation
                        </label>
                        <textarea
                          value={qcRemarks}
                          onChange={(e) => setQcRemarks(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded p-2 outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] text-xs h-16 resize-none"
                          placeholder="Write feedback remarks..."
                        />
                      </div>

                      {/* Refund UPI ID (Modify check for COD order) */}
                      {selectedReturn.orderId?.paymentMethod === "COD" && (
                        <Input
                          label="Refund GPay/UPI ID Address"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="customer@upi"
                        />
                      )}

                      {/* Refund Transaction UTR ID */}
                      <Input
                        label="Gateway Transaction UTR / Ref ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. UTR-129381..."
                      />

                      <div className="flex gap-2 pt-2">
                        <Button
                          type="submit"
                          disabled={actionLoading}
                          variant="primary"
                          className="flex-grow font-bold py-2 text-xs uppercase tracking-wider"
                        >
                          Complete QC & Refund
                        </Button>
                        <Button
                          type="button"
                          onClick={handleMarkDisputed}
                          disabled={actionLoading}
                          variant="outline"
                          className="text-amber-600 border-amber-200 hover:bg-amber-50 font-bold py-2 px-3 text-xs uppercase tracking-wider"
                        >
                          Dispute
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Closed State info sheet
                    <div className="space-y-3 bg-white border border-slate-200 p-4 rounded text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">
                          Ticket Status:
                        </span>
                        <span className="font-bold text-slate-800 uppercase">
                          {selectedReturn.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">
                          QC Grade Result:
                        </span>
                        <span className="font-bold text-emerald-600 uppercase">
                          {selectedReturn.qcGrading?.grade.replace("_", " ")}
                        </span>
                      </div>
                      {selectedReturn.qcGrading?.remarks && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">
                            QC Remarks:
                          </span>
                          <span className="text-slate-700 font-semibold">
                            {selectedReturn.qcGrading.remarks}
                          </span>
                        </div>
                      )}
                      {selectedReturn.lossCategory !== "NA" && (
                        <div className="flex justify-between text-rose-600">
                          <span className="text-slate-500 font-semibold">
                            Loss Reason Category:
                          </span>
                          <span className="font-bold">
                            {selectedReturn.lossCategory}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-100 pt-2 text-[#c5a880]">
                        <span className="font-bold">Refund Amount:</span>
                        <span className="font-bold">
                          ₹{selectedReturn.refundDetails?.amount}
                        </span>
                      </div>
                      {selectedReturn.refundDetails?.upiId && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-semibold">
                            UPI ID Refunded:
                          </span>
                          <span className="font-bold text-slate-800">
                            {selectedReturn.refundDetails.upiId}
                          </span>
                        </div>
                      )}
                      {selectedReturn.refundDetails?.transactionId && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-semibold">
                            Trans Ref ID (UTR):
                          </span>
                          <span className="font-mono text-slate-800 font-semibold">
                            {selectedReturn.refundDetails.transactionId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Viewing High Res Evidence Overlay */}
            {viewingPhoto && (
              <div
                onClick={() => setViewingPhoto(null)}
                className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 cursor-pointer"
              >
                <img
                  src={viewingPhoto}
                  alt="High Res Claim"
                  className="max-h-full max-w-full object-contain rounded"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;
