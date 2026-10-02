import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Badge from "../../components/admin/ui/Badge.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiSearchLine,
  RiMailLine,
  RiRefreshLine,
  RiCloseLine,
  RiMailSendLine,
  RiMailCloseLine,
  RiMailForbidLine,
  RiEyeLine,
  RiSendPlaneLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiCheckLine,
  RiShoppingBag3Line,
  RiShieldCheckLine,
  RiCalendarLine,
} from "react-icons/ri";

const TYPE_LABELS = {
  otp: "OTP Code",
  order_placed: "Order Placed",
  payment_success: "Payment Confirmed",
  payment_failed: "Payment Failed",
  order_shipped: "Order Shipped",
  order_update: "Order Update",
  password_reset: "Password Reset",
  admin_order_notification: "Admin Alert",
  other: "Notification",
};

const resolveMailType = (mail) => {
  if (mail.type && mail.type !== "other") return mail.type;
  if (
    mail.subject?.toLowerCase().includes("order") ||
    mail.meta?.orderId ||
    mail.meta?.orderStatus
  ) {
    return "order_update";
  }
  return "other";
};

const statusBadge = (status) => {
  if (status === "sent") return { variant: "success", label: "Sent" };
  if (status === "failed") return { variant: "danger", label: "Failed" };
  return { variant: "warning", label: "Skipped" };
};

const typeBadge = (type) => {
  const map = {
    otp: "info",
    order_placed: "primary",
    payment_success: "success",
    payment_failed: "danger",
    order_shipped: "primary",
    order_update: "primary",
    password_reset: "danger",
    admin_order_notification: "dark",
    other: "default",
  };
  return map[type] || "default";
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extractOrderId = (mail) => {
  if (mail?.meta?.orderId) return mail.meta.orderId;
  if (mail?.meta?.orderNumber) return mail.meta.orderNumber;
  const match = mail?.subject?.match(/PRW[-\s]?\d{4}[-\s]?\d+/i);
  return match ? match[0].trim() : null;
};

const TIMEFRAMES = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
];

const MailPage = () => {
  const navigate = useNavigate();
  const { showAlert: alert } = useAlert();

  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({
    sent: 0,
    failed: 0,
    skipped: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [timeframe, setTimeframe] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resend state
  const [isResending, setIsResending] = useState(false);
  const [resendRecipient, setResendRecipient] = useState("");
  const [showRecipientEdit, setShowRecipientEdit] = useState(false);

  // Test mail modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // HTML copied state
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchEmails = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const params = { page, limit: 50 };
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.type = typeFilter;
        if (timeframe && timeframe !== "all") params.timeframe = timeframe;
        if (debouncedSearch) params.search = debouncedSearch;

        const res = await API.get("/emails", { params });
        if (res.data?.success) {
          const data = res.data.data || {};
          setEmails(data.emails || []);
          setPagination(
            data.pagination || { page: 1, limit: 50, total: 0, pages: 1 },
          );
          setStats(data.stats || { sent: 0, failed: 0, skipped: 0, total: 0 });
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load mail log");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, typeFilter, timeframe, debouncedSearch],
  );

  useEffect(() => {
    fetchEmails(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, timeframe, debouncedSearch]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    setShowRecipientEdit(false);
    setIsCopied(false);
    try {
      const res = await API.get(`/emails/${id}`);
      if (res.data?.success) {
        const item = res.data.data;
        setDetail(item);
        setResendRecipient(item?.to || "");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load email body");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setShowRecipientEdit(false);
  };

  // Resend email handler
  const handleResend = async () => {
    if (!detail?._id) return;
    try {
      setIsResending(true);
      const res = await API.post(`/emails/${detail._id}/resend`, {
        to: resendRecipient.trim(),
      });
      if (res.data?.success) {
        alert(res.data.message || "Email resent successfully!");
        fetchEmails(pagination.page);
        closeDetail();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  // Send Test Mail handler
  const handleSendTestMail = async (e) => {
    e.preventDefault();
    if (!testEmailInput.trim()) {
      alert("Please enter a valid recipient email");
      return;
    }
    try {
      setIsSendingTest(true);
      const res = await API.post("/emails/send-test", {
        to: testEmailInput.trim(),
      });
      if (res.data?.success) {
        alert(res.data.message || "Diagnostic test email dispatched!");
        setShowTestModal(false);
        setTestEmailInput("");
        fetchEmails(1);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to dispatch test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleCopyHtml = () => {
    if (!detail?.html) return;
    navigator.clipboard.writeText(detail.html);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    if (!detail?.html) return;
    const blob = new Blob([detail.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const deliverabilityRate =
    stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 100;

  const statCards = [
    {
      label: "Total Logged",
      value: stats.total,
      subtext: `${deliverabilityRate}% delivery rate`,
      icon: <RiMailLine size={18} />,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      label: "Delivered (Sent)",
      value: stats.sent,
      subtext: "Live verified dispatches",
      icon: <RiMailSendLine size={18} />,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Failed Outbound",
      value: stats.failed,
      subtext: stats.failed === 0 ? "Clean pipe (0 errors)" : "Requires review",
      icon: <RiMailCloseLine size={18} />,
      tone: "text-red-700 bg-red-50",
    },
    {
      label: "Skipped / Muted",
      value: stats.skipped,
      subtext: "Missing or invalid config",
      icon: <RiMailForbidLine size={18} />,
      tone: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      {/* Page Header */}
      <PageHeader
        title="Mail Log & Outbound Dispatcher"
        subtitle="Verified outbound email ledger — OTP codes, order confirmations, invoice alerts, and live SMTP diagnostics"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Mail Log" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
              onClick={() => setShowTestModal(true)}
            >
              <RiSendPlaneLine size={15} className="text-[#8a1c14]" />
              <span>Send Test Mail</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
              onClick={() => fetchEmails(pagination.page)}
            >
              <RiRefreshLine
                size={15}
                className={isLoading ? "animate-spin text-[#c5a880]" : ""}
              />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card
            key={s.label}
            className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200/90 shadow-2xs hover:shadow-xs transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {s.label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.tone}`}
              >
                {s.icon}
              </div>
            </div>
            <div>
              <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
                {isLoading ? "—" : s.value.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.subtext}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Card */}
      <Card className="p-4 space-y-3 bg-white border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <RiSearchLine
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by recipient, subject, or order number (PRW-...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe selector */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1 border border-slate-200 text-xs">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    timeframe === tf.id
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition cursor-pointer"
            >
              <option value="">Status: All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition cursor-pointer"
            >
              <option value="">Category: All</option>
              <option value="order_placed">Order Placed</option>
              <option value="order_update">Order Update</option>
              <option value="order_shipped">Order Shipped</option>
              <option value="payment_success">Payment Confirmed</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="otp">OTP Code</option>
              <option value="password_reset">Password Reset</option>
              <option value="admin_order_notification">Admin Alerts</option>
              <option value="other">Other Notifications</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Emails Table Card */}
      <Card className="overflow-hidden border-slate-200 shadow-2xs bg-white">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[950px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Dispatched At</th>
                <th className="py-3.5 px-5">Recipient Customer</th>
                <th className="py-3.5 px-5">Subject & Order Ref</th>
                <th className="py-3.5 px-5 text-center">Category</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-28" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-44" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-52" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-20 mx-auto" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-12 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : emails.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-slate-400 text-xs"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RiMailLine size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        No emails logged for this query.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your search keywords, status filter, or
                        timeframe.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                emails.map((mail) => {
                  const resolvedType = resolveMailType(mail);
                  const st = statusBadge(mail.status);
                  const orderId = extractOrderId(mail);

                  return (
                    <tr
                      key={mail._id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => openDetail(mail._id)}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(mail.createdAt)}
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-1.5">
                          <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                            {mail.to}
                          </p>
                        </div>
                        {mail.from ? (
                          <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                            from {mail.from}
                          </p>
                        ) : null}
                      </td>

                      {/* Subject with clickable Order ID */}
                      <td className="py-3.5 px-5 text-slate-700 max-w-[320px]">
                        <p className="truncate font-medium">{mail.subject}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {orderId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/orders?search=${orderId}`);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#8a1c14] bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-1.5 py-0.5 rounded cursor-pointer transition"
                              title="Click to view this order in Orders manager"
                            >
                              <RiShoppingBag3Line size={11} />
                              <span>{orderId}</span>
                              <RiExternalLinkLine size={10} />
                            </button>
                          ) : null}

                          {mail.error ? (
                            <span className="text-[10px] text-red-500 truncate">
                              Err: {mail.error}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <Badge variant={typeBadge(resolvedType)}>
                          {TYPE_LABELS[resolvedType] || resolvedType}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(mail._id);
                          }}
                          className="inline-flex items-center gap-1 text-[#c5a880] hover:text-[#a88f65] font-bold uppercase tracking-wider text-[11px] cursor-pointer"
                        >
                          <RiEyeLine size={15} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
              emails
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => fetchEmails(pagination.page - 1)}
                className="text-xs py-1.5 px-3"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchEmails(pagination.page + 1)}
                className="text-xs py-1.5 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs"
            onClick={closeDetail}
          />
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-fade-in">
            {/* Drawer Header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-200 shrink-0 bg-[#FAF9F6]">
              <div className="flex items-center gap-2">
                <RiMailLine className="text-[#8a1c14]" size={18} />
                <span className="text-sm font-semibold text-slate-800">
                  Email Dispatch Inspector
                </span>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-grow overflow-y-auto">
              {detailLoading || !detail ? (
                <div className="p-6 space-y-4">
                  <SkeletonLoader className="h-5 w-2/3" />
                  <SkeletonLoader className="h-4 w-1/2" />
                  <SkeletonLoader className="h-4 w-1/3" />
                  <SkeletonLoader className="h-64 w-full" />
                </div>
              ) : (
                <>
                  {/* Metadata Header Box */}
                  <div className="p-5 space-y-3 border-b border-slate-100 bg-[#FAF9F6]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={typeBadge(resolveMailType(detail))}>
                          {TYPE_LABELS[resolveMailType(detail)] || detail.type}
                        </Badge>
                        <Badge variant={statusBadge(detail.status).variant}>
                          {statusBadge(detail.status).label}
                        </Badge>
                      </div>

                      {/* Action buttons (Resend / Copy) */}
                      <div className="flex items-center gap-2">
                        {detail.html ? (
                          <>
                            <button
                              type="button"
                              onClick={handleCopyHtml}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs transition"
                              title="Copy raw HTML markup"
                            >
                              {isCopied ? (
                                <>
                                  <RiCheckLine
                                    size={14}
                                    className="text-emerald-600"
                                  />
                                  <span className="text-emerald-600 font-bold">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <RiFileCopyLine size={13} />
                                  <span>Copy HTML</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleOpenInNewTab}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs transition"
                              title="Open email in full browser tab"
                            >
                              <RiExternalLinkLine size={13} />
                              <span>Full View</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <h2 className="text-base font-semibold text-slate-900 leading-snug">
                      {detail.subject}
                    </h2>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs pt-1">
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Recipient Customer
                        </dt>
                        <dd className="text-slate-800 font-medium break-all flex items-center gap-1.5 mt-0.5">
                          <span>{detail.to}</span>
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Sender Address
                        </dt>
                        <dd className="text-slate-800 font-medium break-all mt-0.5">
                          {detail.from || "—"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Dispatched Timestamp
                        </dt>
                        <dd className="text-slate-800 font-mono mt-0.5">
                          {formatDate(detail.createdAt)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Associated Order
                        </dt>
                        <dd className="mt-0.5">
                          {extractOrderId(detail) ? (
                            <button
                              type="button"
                              onClick={() => {
                                closeDetail();
                                navigate(
                                  `/admin/orders?search=${extractOrderId(detail)}`,
                                );
                              }}
                              className="inline-flex items-center gap-1 font-mono font-bold text-[#8a1c14] hover:underline cursor-pointer"
                            >
                              <span>{extractOrderId(detail)}</span>
                              <RiExternalLinkLine size={12} />
                            </button>
                          ) : (
                            <span className="text-slate-400">
                              None / Account level
                            </span>
                          )}
                        </dd>
                      </div>

                      {detail.messageId ? (
                        <div className="sm:col-span-2">
                          <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                            Message ID (SMTP Reference)
                          </dt>
                          <dd className="text-slate-600 font-mono text-[10px] break-all mt-0.5">
                            {detail.messageId}
                          </dd>
                        </div>
                      ) : null}

                      {detail.error ? (
                        <div className="sm:col-span-2 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                          <dt className="text-[10px] uppercase tracking-wider text-red-600 font-bold">
                            Delivery Failure Log
                          </dt>
                          <dd className="text-red-700 font-mono text-[11px] mt-0.5">
                            {detail.error}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    {/* Resend Action Banner */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80">
                      {detail.type === "otp" ? (
                        <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg flex items-start gap-2">
                          <RiShieldCheckLine
                            size={16}
                            className="text-amber-700 shrink-0 mt-0.5"
                          />
                          <span>
                            <strong>Security Protected:</strong> OTP codes
                            expire within minutes and cannot be manually
                            re-sent. If a customer needs a code, they should
                            request a fresh one from the login screen.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              Customer did not receive this email?
                            </span>
                            {!showRecipientEdit && (
                              <button
                                type="button"
                                onClick={() => setShowRecipientEdit(true)}
                                className="text-[10px] text-[#c5a880] hover:text-[#a88f65] font-semibold underline cursor-pointer"
                              >
                                Change Recipient Email
                              </button>
                            )}
                          </div>

                          {showRecipientEdit ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="email"
                                value={resendRecipient}
                                onChange={(e) =>
                                  setResendRecipient(e.target.value)
                                }
                                placeholder="Enter customer email..."
                                className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-[#8a1c14]"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={handleResend}
                                disabled={isResending || !resendRecipient}
                                className="bg-[#8a1c14] hover:bg-[#701610] text-white text-xs py-1 px-3"
                              >
                                {isResending ? "Sending..." : "Send Now"}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleResend}
                              disabled={isResending}
                              className="w-full flex items-center justify-center gap-1.5 text-xs text-[#8a1c14] border-rose-200 bg-rose-50 hover:bg-rose-100 font-semibold py-1.5"
                            >
                              <RiMailSendLine size={15} />
                              <span>
                                {isResending
                                  ? "Dispatching..."
                                  : `Resend to ${detail.to}`}
                              </span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Preview */}
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                      Rendered Email Preview
                    </p>
                    {detail.html ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                        <iframe
                          title="Email body"
                          sandbox="allow-same-origin"
                          srcDoc={detail.html}
                          className="w-full min-h-[460px] border-0"
                        />
                      </div>
                    ) : detail.text ? (
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono">
                        {detail.text}
                      </pre>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No body content recorded for this transmission.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs"
            onClick={() => setShowTestModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#8a1c14] flex items-center justify-center">
                  <RiSendPlaneLine size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">
                    Live SMTP Delivery Test
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verify outbound mailing pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleSendTestMail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Test Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-[#8a1c14]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  A verification email will be dispatched immediately through
                  your configured provider.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTestModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSendingTest}
                  className="bg-[#8a1c14] hover:bg-[#701610] text-white text-xs px-4"
                >
                  {isSendingTest ? "Dispatching..." : "Send Test Email"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailPage;
