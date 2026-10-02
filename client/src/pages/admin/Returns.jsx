import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiSearchLine,
  RiRefreshLine,
  RiCloseLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCarLine,
  RiAlertLine,
  RiExchangeLine,
  RiShoppingBag3Line,
  RiWhatsappLine,
  RiExternalLinkLine,
  RiMoneyDollarCircleLine,
  RiArchiveLine,
  RiTimeLine,
  RiCheckDoubleLine,
} from "react-icons/ri";

const WORKFLOW_TABS = [
  { id: "all", label: "All Tickets" },
  { id: "action_needed", label: "Needs Approval" },
  { id: "in_transit", label: "In-Transit Pickup" },
  { id: "warehouse_qc", label: "At Warehouse (QC)" },
  { id: "completed", label: "Completed & Refunded" },
  { id: "rejected", label: "Rejected / Disputed" },
];

const ReturnsPage = () => {
  const navigate = useNavigate();
  const { showAlert: alert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [workflowTab, setWorkflowTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [gradeFilter, setGradeFilter] = useState("");

  // Rejection & QC & Settlement Form States
  const [rejectionReason, setRejectionReason] = useState("");
  const [qcGrade, setQcGrade] = useState("A_GRADE");
  const [qcRemarks, setQcRemarks] = useState("");
  const [lossCategory, setLossCategory] = useState("NA");
  const [upiId, setUpiId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // Sync status filter choice if URL searchParams shifts
  useEffect(() => {
    const status = searchParams.get("status");
    if (status !== null) {
      setStatusFilter(status);
    }
  }, [searchParams]);

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
          : selectedReturn.qcGrading?.grade || "A_GRADE",
      );
      setQcRemarks(selectedReturn.qcGrading?.remarks || "");
      setLossCategory(selectedReturn.lossCategory || "NA");
      setUpiId(selectedReturn.refundDetails?.upiId || "");
      setTransactionId(selectedReturn.refundDetails?.transactionId || "");
    }
  }, [selectedReturn]);

  // Executive KPI summary metrics
  const returnMetrics = useMemo(() => {
    const totalClaims = returns.length;
    let pendingApproval = 0;
    let inTransit = 0;
    let qcPending = 0;
    let totalRefundOutflow = 0;

    returns.forEach((ret) => {
      const st = ret.status || "";
      if (st === "Return_Requested") pendingApproval++;
      else if (st === "Return_Approved" || st === "Return_In_Transit") inTransit++;
      else if (st === "Return_Received") qcPending++;

      if (st === "Return_Completed" || st === "Return_Requested" || st === "Return_Received") {
        totalRefundOutflow += Number(ret.refundDetails?.amount) || 0;
      }
    });

    return {
      totalClaims,
      pendingApproval,
      inTransit,
      qcPending,
      totalRefundOutflow,
    };
  }, [returns]);

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
          `Return status updated to ${statusPayload.status.replace(/_/g, " ")}`,
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

  // Mark request under Dispute
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

  // Helper to extract customer name, phone, order number
  const resolveCustomer = (ret) => {
    const name =
      ret.customerId?.name ||
      ret.orderId?.customer?.name ||
      "Pariwesh Client";
    const phone =
      ret.customerId?.phone ||
      ret.orderId?.customer?.phone ||
      "";
    const email =
      ret.customerId?.email ||
      ret.orderId?.customer?.email ||
      "";
    const orderNumber =
      ret.orderId?.orderId ||
      (ret.orderId && typeof ret.orderId === "string" ? ret.orderId : null);

    return { name, phone, email, orderNumber };
  };

  // Filter returns based on search, workflow tab, status, and grade
  const filteredReturns = useMemo(() => {
    return returns.filter((ret) => {
      const q = searchTerm.toLowerCase().trim();
      const { name, orderNumber } = resolveCustomer(ret);

      const matchesSearch =
        !q ||
        ret.returnId?.toLowerCase().includes(q) ||
        (orderNumber && orderNumber.toLowerCase().includes(q)) ||
        name.toLowerCase().includes(q);

      const matchesStatus = !statusFilter ? true : ret.status === statusFilter;
      const matchesGrade = !gradeFilter
        ? true
        : ret.qcGrading?.grade === gradeFilter;

      let matchesTab = true;
      if (workflowTab === "action_needed") {
        matchesTab = ret.status === "Return_Requested";
      } else if (workflowTab === "in_transit") {
        matchesTab =
          ret.status === "Return_Approved" ||
          ret.status === "Return_In_Transit";
      } else if (workflowTab === "warehouse_qc") {
        matchesTab = ret.status === "Return_Received";
      } else if (workflowTab === "completed") {
        matchesTab = ret.status === "Return_Completed";
      } else if (workflowTab === "rejected") {
        matchesTab =
          ret.status === "Return_Rejected" ||
          ret.status === "Return_Disputed";
      }

      return matchesSearch && matchesStatus && matchesGrade && matchesTab;
    });
  }, [returns, searchTerm, statusFilter, gradeFilter, workflowTab]);

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-700 pb-10">
      {/* 1. Page Header */}
      <PageHeader
        title="Reverse Logistics & Returns Pipeline"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Returns Pipeline" },
        ]}
        subtitle="Process customer claims, coordinate courier reverse pickups, audit warehouse QC grading, and settle refunds"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1.5 text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
            onClick={fetchReturns}
          >
            <RiRefreshLine
              size={15}
              className={isLoading ? "animate-spin text-[#c5a880]" : ""}
            />
            <span>Refresh Queue</span>
          </Button>
        }
      />

      {/* 2. Top Executive Return Logistics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Claims */}
        <Card
          className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer"
          onClick={() => {
            setWorkflowTab("all");
            setStatusFilter("");
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
              Total Return Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <RiArchiveLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              {isLoading ? "—" : returnMetrics.totalClaims}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Logged return claims ledger
            </p>
          </div>
        </Card>

        {/* Card 2: Action Needed (Requested) */}
        <Card
          className={`p-4 flex flex-col justify-between space-y-2 border shadow-2xs hover:shadow-xs transition cursor-pointer ${
            workflowTab === "action_needed"
              ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white border-slate-200"
          }`}
          onClick={() => {
            setWorkflowTab("action_needed");
            setStatusFilter("");
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-rose-700">
              Needs Approval
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <RiAlertLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-rose-900 tracking-tight font-mono">
              {isLoading ? "—" : returnMetrics.pendingApproval}
            </p>
            <p className="text-[10px] text-rose-600 font-medium mt-0.5">
              {returnMetrics.pendingApproval === 0
                ? "Queue clean (0 pending)"
                : "Awaiting admin authorization"}
            </p>
          </div>
        </Card>

        {/* Card 3: In-Transit / QC Audit */}
        <Card
          className={`p-4 flex flex-col justify-between space-y-2 border shadow-2xs hover:shadow-xs transition cursor-pointer ${
            workflowTab === "warehouse_qc"
              ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200"
          }`}
          onClick={() => {
            setWorkflowTab("warehouse_qc");
            setStatusFilter("");
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-amber-700">
              Warehouse QC Pending
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <RiTimeLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-amber-900 tracking-tight font-mono">
              {isLoading ? "—" : returnMetrics.qcPending}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Parcels received at warehouse
            </p>
          </div>
        </Card>

        {/* Card 4: Refund Outflow */}
        <Card className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
              Refund Exposure (₹)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <RiMoneyDollarCircleLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
              ₹
              {isLoading
                ? "—"
                : returnMetrics.totalRefundOutflow.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              Total refund claims value
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Workflow Stage Tabs & Controls */}
      <Card className="p-4 space-y-3.5 bg-white border-slate-200 shadow-2xs">
        {/* Workflow Lifecycle Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Pipeline:
          </span>
          {WORKFLOW_TABS.map((tab) => {
            const active = workflowTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setWorkflowTab(tab.id);
                  setStatusFilter("");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                  active
                    ? "bg-[#8a1c14] text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Status Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <RiSearchLine
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:border-[#8a1c14] focus:ring-1 focus:ring-[#8a1c14] outline-none placeholder:text-slate-400"
              placeholder="Search Return ID, Order ID (#PRW-...), or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:border-[#8a1c14] focus:ring-1 focus:ring-[#8a1c14] outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setWorkflowTab("all");
              }}
            >
              <option value="">Specific Status: All</option>
              <option value="Return_Requested">Return Requested</option>
              <option value="Return_Approved">Approved (Pickup Scheduled)</option>
              <option value="Return_In_Transit">Courier In Transit</option>
              <option value="Return_Received">Received at Warehouse</option>
              <option value="Return_Completed">Completed & Refunded</option>
              <option value="Return_Rejected">Rejected</option>
              <option value="Return_Disputed">Disputed</option>
            </select>
          </div>

          <div>
            <select
              className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:border-[#8a1c14] focus:ring-1 focus:ring-[#8a1c14] outline-none cursor-pointer"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option value="">QC Grade: All</option>
              <option value="PENDING">Pending Audit</option>
              <option value="A_GRADE">A Grade (Saleable & Restocked)</option>
              <option value="B_GRADE">B Grade (Minor Defect)</option>
              <option value="C_GRADE">C Grade (Damaged)</option>
              <option value="SCRAP">Scrap (Written Off)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 4. Main Data Roster Table */}
      <Card className="overflow-hidden border-slate-200 shadow-2xs bg-white">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[950px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Return Ticket ID</th>
                <th className="py-3.5 px-5">Order Ref & Customer</th>
                <th className="py-3.5 px-5">Claimed Garments</th>
                <th className="py-3.5 px-5">Refund Amount</th>
                <th className="py-3.5 text-center px-5">Status</th>
                <th className="py-3.5 text-center px-5">QC Grade</th>
                <th className="py-3.5 text-center px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-28 rounded" />
                    </td>
                    <td className="py-4 px-5 space-y-1.5">
                      <SkeletonLoader className="h-4 w-40 rounded" />
                      <SkeletonLoader className="h-3 w-28 rounded" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-20 rounded" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-20 rounded" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-5 w-24 mx-auto rounded" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-20 mx-auto rounded" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-7 w-20 mx-auto rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-16 text-slate-400 italic text-xs"
                  >
                    No return tickets found matching current pipeline filter.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => {
                  const { name, phone, orderNumber } = resolveCustomer(ret);
                  const cleanPhone = phone
                    ? phone.replace(/\D/g, "").slice(-10)
                    : "";
                  const itemsCount = (ret.items || []).reduce(
                    (acc, curr) => acc + (Number(curr.quantity) || 1),
                    0,
                  );
                  const isCOD = ret.orderId?.paymentMethod === "COD";

                  return (
                    <tr
                      key={ret._id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Return ID */}
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800 text-xs">
                        {ret.returnId}
                        <p className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                          {new Date(ret.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Order Ref & Customer details with direct WhatsApp */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          {orderNumber ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/orders?search=${orderNumber}`)
                              }
                              className="font-mono font-bold text-xs text-[#8a1c14] hover:underline flex items-center gap-1 cursor-pointer"
                              title="Jump to order details"
                            >
                              <span>#{orderNumber}</span>
                              <RiExternalLinkLine size={11} />
                            </button>
                          ) : (
                            <span className="font-mono text-xs text-slate-600">
                              Order Logged
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            ({isCOD ? "COD" : "Prepaid"})
                          </span>
                        </div>

                        {/* Customer Name & WhatsApp shortcut */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {name}
                          </span>

                          {cleanPhone && cleanPhone.length === 10 ? (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${name}, greetings from PARIWESH! We are updating you regarding your Return Request #${ret.returnId}.`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition shadow-2xs"
                              title="Message customer on WhatsApp"
                            >
                              <RiWhatsappLine size={11} />
                            </a>
                          ) : null}
                        </div>
                      </td>

                      {/* Items Count & Reason */}
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-800 text-xs block">
                          {itemsCount} {itemsCount > 1 ? "Garments" : "Garment"}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[180px] block mt-0.5">
                          Reason: {ret.reason || "Not specified"}
                        </span>
                      </td>

                      {/* Refund Amount */}
                      <td className="py-3.5 px-5 font-serif font-bold text-sm text-slate-900">
                        ₹{(Number(ret.refundDetails?.amount) || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`font-bold inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase border tracking-wider ${
                            ret.status === "Return_Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ret.status === "Return_Rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : ret.status === "Return_Disputed"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : ret.status === "Return_Requested"
                              ? "bg-rose-50 text-[#8a1c14] border-rose-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {ret.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* QC Grade */}
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`font-mono font-bold text-[9.5px] uppercase ${
                            ret.qcGrading?.grade === "A_GRADE"
                              ? "text-emerald-700"
                              : ret.qcGrading?.grade === "PENDING"
                              ? "text-amber-700"
                              : "text-rose-600"
                          }`}
                        >
                          {ret.qcGrading?.grade === "A_GRADE"
                            ? "A Grade (Restocked)"
                            : (ret.qcGrading?.grade || "PENDING").replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <Button
                          onClick={() => setSelectedReturn(ret)}
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-3 border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 font-semibold cursor-pointer shadow-2xs"
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

      {/* 5. Inspection & Operations Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative animate-scale-in my-8 text-xs text-slate-700">
            {/* Modal Exit */}
            <button
              onClick={() => {
                setSelectedReturn(null);
                setViewingPhoto(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <RiCloseLine size={22} />
            </button>

            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-serif font-bold text-slate-900">
                    Return Ticket: {selectedReturn.returnId}
                  </h3>
                  <span
                    className={`font-bold inline-block px-2 py-0.5 rounded text-[9px] uppercase border tracking-wider ${
                      selectedReturn.status === "Return_Completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedReturn.status === "Return_Requested"
                        ? "bg-rose-50 text-[#8a1c14] border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {selectedReturn.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Customer:{" "}
                  <strong className="text-slate-800">
                    {resolveCustomer(selectedReturn).name}
                  </strong>{" "}
                  • Mobile: {resolveCustomer(selectedReturn).phone || "—"}
                </p>
              </div>

              {/* Status Action Workflow Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedReturn.status === "Return_Requested" && (
                  <>
                    <Button
                      onClick={() =>
                        handleUpdateStatus({ status: "Return_Approved" })
                      }
                      disabled={actionLoading}
                      variant="primary"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 text-xs py-1.5 px-3"
                    >
                      <RiCheckboxCircleLine size={14} /> Approve Request
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt(
                          "Enter Rejection Reason:",
                          rejectionReason,
                        );
                        if (reason !== null && reason.trim()) {
                          handleUpdateStatus({
                            status: "Return_Rejected",
                            rejectionReason: reason.trim(),
                          });
                        }
                      }}
                      disabled={actionLoading}
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 flex items-center gap-1 text-xs py-1.5 px-3"
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
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 text-xs py-1.5 px-3"
                  >
                    <RiCarLine size={14} /> Mark Picked (In-Transit)
                  </Button>
                )}

                {selectedReturn.status === "Return_In_Transit" && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus({ status: "Return_Received" })
                    }
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 text-xs py-1.5 px-3"
                  >
                    <RiExchangeLine size={14} /> Mark Warehouse Received
                  </Button>
                )}
              </div>
            </div>

            {/* Content Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Claim details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                    Claimed Garments
                  </h4>
                  <div className="space-y-2 bg-[#FAF9F6] border border-slate-200 p-3 rounded-xl">
                    {(selectedReturn.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-b-0"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            {it.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {it.sku} | Size: {it.size} | Qty: {it.quantity}
                          </div>
                        </div>
                        <span className="font-serif font-bold text-slate-900">
                          ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                    Customer Reason & Claim Details
                  </h4>
                  <div className="space-y-2 bg-[#FAF9F6] border border-slate-200 p-3 rounded-xl text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">
                        Stated Reason:
                      </span>
                      <span className="font-bold text-slate-800">
                        {selectedReturn.reason}
                      </span>
                    </div>
                    {selectedReturn.rejectionReason && (
                      <div className="flex justify-between text-rose-600">
                        <span className="font-semibold">Rejection Note:</span>
                        <span className="font-bold">
                          {selectedReturn.rejectionReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Uploads */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                    Customer Evidence Photos
                  </h4>
                  {selectedReturn.evidenceTrail?.customerUploads?.length === 0 ? (
                    <p className="text-[10.5px] text-slate-400 italic">
                      No customer photos uploaded for this claim.
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      {selectedReturn.evidenceTrail.customerUploads.map(
                        (href, index) => (
                          <div
                            key={index}
                            onClick={() => setViewingPhoto(href)}
                            className="relative w-16 h-20 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-[#8a1c14] transition shadow-2xs"
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
              </div>

              {/* Right Column: QC Audit Form + Settlement */}
              <div className="bg-[#FAF9F6] border border-slate-200 p-5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                  Warehouse QC & Settlement Zone
                </h4>

                {selectedReturn.status !== "Return_Completed" &&
                selectedReturn.status !== "Return_Rejected" ? (
                  <form onSubmit={handleQCComplete} className="space-y-3.5">
                    {/* QC Grading */}
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold uppercase tracking-wider text-[9.5px]">
                        Quality Audit (QC) Grading
                      </label>
                      <select
                        value={qcGrade}
                        onChange={(e) => setQcGrade(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#8a1c14] outline-none"
                      >
                        <option value="A_GRADE">
                          A Grade (Pass & Auto-Restock into Inventory)
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

                    {/* Loss Category */}
                    {qcGrade !== "A_GRADE" && (
                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold uppercase tracking-wider text-[9.5px]">
                          Financial Loss Category *
                        </label>
                        <select
                          value={lossCategory}
                          onChange={(e) => setLossCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#8a1c14] outline-none"
                          required
                        >
                          <option value="NA">-- Select Category --</option>
                          <option value="Courier_Damage">Courier Damage</option>
                          <option value="Customer_Fraud">Customer Fraud</option>
                          <option value="Warehouse_Damage">Warehouse Damage</option>
                          <option value="Lost_Parcel">Lost Parcel</option>
                        </select>
                      </div>
                    )}

                    {/* QC Remarks */}
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold uppercase tracking-wider text-[9.5px]">
                        QC Remarks / Fabric Observation
                      </label>
                      <textarea
                        value={qcRemarks}
                        onChange={(e) => setQcRemarks(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#8a1c14] outline-none h-16 resize-none"
                        placeholder="e.g. Unworn with intact tag, verified eligible for restock..."
                      />
                    </div>

                    {/* Refund UPI ID (for COD) */}
                    {selectedReturn.orderId?.paymentMethod === "COD" && (
                      <Input
                        label="Customer Refund UPI ID"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. customer@okhdfcbank"
                      />
                    )}

                    {/* Transaction Reference UTR */}
                    <Input
                      label="Refund Gateway UTR / Reference ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. UTR-2026-9812..."
                    />

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        disabled={actionLoading}
                        variant="primary"
                        className="flex-grow bg-[#8a1c14] hover:bg-[#701610] text-white font-bold py-2 text-xs uppercase tracking-wider"
                      >
                        {actionLoading ? "Processing..." : "Complete QC & Refund"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleMarkDisputed}
                        disabled={actionLoading}
                        variant="outline"
                        className="text-amber-700 border-amber-300 hover:bg-amber-50 font-bold py-2 px-3 text-xs uppercase tracking-wider"
                      >
                        Dispute
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Settled sheet */
                  <div className="space-y-2.5 bg-white border border-slate-200 p-4 rounded-xl text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">
                        QC Audit Result:
                      </span>
                      <span className="font-bold text-emerald-700">
                        {selectedReturn.qcGrading?.grade === "A_GRADE"
                          ? "A Grade (Restocked)"
                          : selectedReturn.qcGrading?.grade}
                      </span>
                    </div>
                    {selectedReturn.refundDetails?.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">
                          Refund Reference:
                        </span>
                        <span className="font-mono text-slate-800 font-bold">
                          {selectedReturn.refundDetails.transactionId}
                        </span>
                      </div>
                    )}
                    {selectedReturn.lossCategory &&
                      selectedReturn.lossCategory !== "NA" && (
                        <div className="flex justify-between text-amber-700">
                          <span className="font-semibold">Loss Category:</span>
                          <span className="font-bold">
                            {selectedReturn.lossCategory.replace(/_/g, " ")}
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReturn(null)}
                className="text-xs"
              >
                Close Ticket Audit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-xl overflow-hidden p-2">
            <img
              src={viewingPhoto}
              alt="Evidence Full View"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;
