import React, { useState, useEffect, useCallback } from "react";
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
} from "react-icons/ri";

const TYPE_LABELS = {
  otp: "OTP",
  order_placed: "Order Placed",
  payment_success: "Payment Success",
  payment_failed: "Payment Failed",
  order_shipped: "Order Shipped",
  other: "Other",
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

const MailPage = () => {
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
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchEmails = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params = { page, limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
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
  }, [statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    fetchEmails(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on filter/search only
  }, [statusFilter, typeFilter, debouncedSearch]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await API.get(`/emails/${id}`);
      if (res.data?.success) {
        setDetail(res.data.data);
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
  };

  const statCards = [
    {
      label: "Total Logged",
      value: stats.total,
      icon: <RiMailLine size={18} />,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      label: "Sent",
      value: stats.sent,
      icon: <RiMailSendLine size={18} />,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: <RiMailCloseLine size={18} />,
      tone: "text-red-700 bg-red-50",
    },
    {
      label: "Skipped",
      value: stats.skipped,
      icon: <RiMailForbidLine size={18} />,
      tone: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mail Log"
        subtitle="Every outbound email from the store — OTP, orders, payments — with full body preview"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Mail" },
        ]}
        actions={
          <Button
            variant="outline"
            className="flex items-center space-x-2 text-slate-700 border-slate-200"
            onClick={() => fetchEmails(pagination.page)}
          >
            <RiRefreshLine size={16} />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.tone}`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {s.label}
              </p>
              <p className="text-xl font-display font-semibold text-slate-900 font-mono">
                {isLoading ? "—" : s.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="sm:col-span-2 relative">
          <RiSearchLine
            className="absolute left-3 top-3 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by recipient, subject, or from..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="">Status: All</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="">Type: All</option>
          <option value="otp">OTP</option>
          <option value="order_placed">Order Placed</option>
          <option value="payment_success">Payment Success</option>
          <option value="payment_failed">Payment Failed</option>
          <option value="order_shipped">Order Shipped</option>
          <option value="other">Other</option>
        </select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[900px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-5">When</th>
                <th className="py-4 px-5">Recipient</th>
                <th className="py-4 px-5">Subject</th>
                <th className="py-4 px-5 text-center">Type</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-center">Action</th>
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
                      <SkeletonLoader className="h-4 w-40" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-48" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-14 mx-auto" />
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
                      <RiMailLine size={28} className="text-slate-300" />
                      <p>No emails logged yet.</p>
                      <p className="text-[10px] text-slate-400">
                        OTP, order, and payment mails will appear here as they
                        are sent.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                emails.map((mail) => {
                  const st = statusBadge(mail.status);
                  return (
                    <tr
                      key={mail._id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => openDetail(mail._id)}
                    >
                      <td className="py-3.5 px-5 text-slate-500 font-mono whitespace-nowrap">
                        {formatDate(mail.createdAt)}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                          {mail.to}
                        </p>
                        {mail.from ? (
                          <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                            from {mail.from}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 max-w-[280px]">
                        <p className="truncate font-medium">{mail.subject}</p>
                        {mail.error ? (
                          <p className="text-[10px] text-red-500 truncate mt-0.5">
                            {mail.error}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <Badge variant={typeBadge(mail.type)}>
                          {TYPE_LABELS[mail.type] || mail.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(mail._id);
                          }}
                          className="inline-flex items-center gap-1 text-[#c5a880] hover:text-[#a88f65] font-semibold uppercase tracking-wider text-[10px]"
                        >
                          <RiEyeLine size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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

      {/* Detail drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            onClick={closeDetail}
          />
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-fade-in">
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <RiMailLine className="text-[#c5a880]" size={18} />
                <span className="text-sm font-semibold text-slate-800">
                  Email Details
                </span>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

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
                  <div className="p-5 space-y-3 border-b border-slate-100 bg-[#FAF9F6]">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={typeBadge(detail.type)}>
                        {TYPE_LABELS[detail.type] || detail.type}
                      </Badge>
                      <Badge variant={statusBadge(detail.status).variant}>
                        {statusBadge(detail.status).label}
                      </Badge>
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 leading-snug">
                      {detail.subject}
                    </h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          To
                        </dt>
                        <dd className="text-slate-800 font-medium break-all">
                          {detail.to}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          From
                        </dt>
                        <dd className="text-slate-800 font-medium break-all">
                          {detail.from || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Sent At
                        </dt>
                        <dd className="text-slate-800 font-mono">
                          {formatDate(detail.createdAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Message ID
                        </dt>
                        <dd className="text-slate-600 font-mono text-[10px] break-all">
                          {detail.messageId || "—"}
                        </dd>
                      </div>
                      {detail.error ? (
                        <div className="sm:col-span-2">
                          <dt className="text-[10px] uppercase tracking-wider text-red-400 font-semibold">
                            Error
                          </dt>
                          <dd className="text-red-600">{detail.error}</dd>
                        </div>
                      ) : null}
                      {detail.meta && Object.keys(detail.meta).length > 0 ? (
                        <div className="sm:col-span-2">
                          <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                            Meta
                          </dt>
                          <dd className="text-slate-600 font-mono text-[10px] bg-white border border-slate-200 rounded p-2 mt-1">
                            {JSON.stringify(detail.meta, null, 2)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                      Body Preview
                    </p>
                    {detail.html ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <iframe
                          title="Email body"
                          sandbox=""
                          srcDoc={detail.html}
                          className="w-full min-h-[420px] border-0"
                        />
                      </div>
                    ) : detail.text ? (
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-4">
                        {detail.text}
                      </pre>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No body content stored for this email.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailPage;
