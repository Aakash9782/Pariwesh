import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiSearchLine,
  RiDownloadLine,
  RiLockLine,
  RiLockUnlockLine,
  RiShoppingBag3Line,
  RiCloseLine,
  RiGroupLine,
  RiWhatsappLine,
  RiMailLine,
  RiUserStarLine,
  RiUserHeartLine,
  RiUserFollowLine,
  RiMoneyDollarCircleLine,
  RiExternalLinkLine,
  RiMapPinLine,
  RiRefreshLine,
} from "react-icons/ri";

const LIFECYCLE_SEGMENTS = [
  { id: "all", label: "All Clients" },
  { id: "repeat", label: "VIP Repeat (2+ Orders)" },
  { id: "single", label: "Single Buyers (1 Order)" },
  { id: "leads", label: "New Leads (0 Orders)" },
];

const CustomersPage = () => {
  const navigate = useNavigate();
  const { showAlert: alert, showConfirm } = useAlert();
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lifecycleSegment, setLifecycleSegment] = useState("all");

  // Inspect Modal
  const [inspectUser, setInspectUser] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [userRes, orderRes] = await Promise.all([
        API.get("/users"),
        API.get("/orders"),
      ]);
      if (userRes.data?.success) {
        setUsers(userRes.data.data || []);
      }
      if (orderRes.data?.success) {
        setOrders(orderRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load customer list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Detect URL search parameter to inspect specific user by Email
  useEffect(() => {
    const searchEmail = searchParams.get("search");
    if (searchEmail && users.length > 0) {
      const matched = users.find(
        (u) => u.email?.toLowerCase() === searchEmail.toLowerCase(),
      );
      if (matched) {
        setInspectUser(matched);
      }
    }
  }, [searchParams, users]);

  // Unified, rock-solid order matching across userId, email, and phone
  const getCustomerOrders = useCallback(
    (u) => {
      if (!u || !orders.length) return [];
      const uId = u._id ? String(u._id) : "";
      const uEmail = u.email ? u.email.trim().toLowerCase() : "";
      const uPhone = u.phone ? u.phone.replace(/\D/g, "").slice(-10) : "";

      const matched = orders.filter((o) => {
        const oUserId = o.customer?.userId ? String(o.customer.userId) : "";
        const oEmail = o.customer?.email
          ? o.customer.email.trim().toLowerCase()
          : "";
        const oPhone = o.customer?.phone
          ? o.customer.phone.replace(/\D/g, "").slice(-10)
          : "";

        if (uId && oUserId && uId === oUserId) return true;
        if (uEmail && oEmail && uEmail === oEmail) return true;
        if (uPhone && oPhone && uPhone === oPhone) return true;
        return false;
      });

      // Deduplicate orders by orderId or _id
      const map = new Map();
      matched.forEach((ord) => {
        map.set(ord.orderId || ord._id, ord);
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    },
    [orders],
  );

  // Compute total realized spend (excluding cancelled and refunded)
  const getCustomerTotalSpend = useCallback(
    (u) => {
      const custOrders = getCustomerOrders(u);
      return custOrders.reduce((total, o) => {
        const st = (o.orderStatus || "").toLowerCase();
        if (st === "cancelled" || st === "refunded") return total;
        return total + (o.pricing?.grandTotal || o.totalPrice || 0);
      }, 0);
    },
    [getCustomerOrders],
  );

  // Extract customer's latest delivery city / state
  const getCustomerLocation = useCallback(
    (u) => {
      const custOrders = getCustomerOrders(u);
      for (const ord of custOrders) {
        if (ord.shippingAddress?.city) {
          const parts = [ord.shippingAddress.city, ord.shippingAddress.state].filter(
            Boolean,
          );
          return parts.join(", ");
        }
      }
      return null;
    },
    [getCustomerOrders],
  );

  // CRM Executive KPI summary calculations
  const crmMetrics = useMemo(() => {
    const totalRegistered = users.length;
    let payingBuyers = 0;
    let repeatBuyers = 0;
    let totalLtv = 0;

    users.forEach((u) => {
      const ords = getCustomerOrders(u);
      const spend = getCustomerTotalSpend(u);
      if (ords.length > 0) {
        payingBuyers++;
        totalLtv += spend;
      }
      if (ords.length >= 2) {
        repeatBuyers++;
      }
    });

    const repeatRate =
      payingBuyers > 0 ? Math.round((repeatBuyers / payingBuyers) * 100) : 0;

    return {
      totalRegistered,
      payingBuyers,
      repeatBuyers,
      repeatRate,
      totalLtv,
    };
  }, [users, getCustomerOrders, getCustomerTotalSpend]);

  // Suspension / Ban actions
  const handleToggleSuspension = async (userObj) => {
    const nextStatus = userObj.status === "suspended" ? "active" : "suspended";
    const promptMsg =
      nextStatus === "suspended"
        ? `Confirm suspending user: ${userObj.name}? They will be blocked from logging in.`
        : `Re-activate access for: ${userObj.name}?`;

    const confirmed = await showConfirm(promptMsg, "Suspension Access");
    if (!confirmed) return;

    try {
      const res = await API.put(`/users/${userObj._id}`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        alert(`${userObj.name} status updated to ${nextStatus}`);
        fetchData();
        if (inspectUser && inspectUser._id === userObj._id) {
          setInspectUser(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status policy");
    }
  };

  // Comprehensive CSV export
  const handleExportRoster = () => {
    const headers =
      "Name,Email,Phone,Role,Status,Total Orders,Total Spend (INR),Location,Registered Date\n";
    const rows = filteredUsers
      .map((u) => {
        const ords = getCustomerOrders(u);
        const spend = getCustomerTotalSpend(u);
        const loc = getCustomerLocation(u) || "—";
        const cleanName = (u.name || "").replace(/"/g, '""');
        return `"${cleanName}","${u.email || ""}","${u.phone || ""}","${
          u.role || "customer"
        }","${u.status || "active"}","${ords.length}","${spend}","${loc}","${new Date(
          u.createdAt,
        ).toLocaleDateString("en-IN")}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pariwesh_crm_roster_${
      new Date().toISOString().slice(0, 10)
    }.csv`;
    link.click();
    alert("CRM client roster exported successfully");
  };

  // Filter clients by search, role, status, and lifecycle segment
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.includes(query);

      const matchRole = !roleFilter ? true : u.role === roleFilter;
      const matchStatus = !statusFilter
        ? true
        : (u.status || "active") === statusFilter;

      const userOrders = getCustomerOrders(u);
      let matchSegment = true;
      if (lifecycleSegment === "repeat") {
        matchSegment = userOrders.length >= 2;
      } else if (lifecycleSegment === "single") {
        matchSegment = userOrders.length === 1;
      } else if (lifecycleSegment === "leads") {
        matchSegment = userOrders.length === 0;
      }

      return matchSearch && matchRole && matchStatus && matchSegment;
    });
  }, [
    users,
    searchQuery,
    roleFilter,
    statusFilter,
    lifecycleSegment,
    getCustomerOrders,
  ]);

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      {/* Page Header */}
      <PageHeader
        title="Client CRM & Customer Intelligence"
        subtitle="Review authenticated buyers, lifetime order velocity, purchase valuation, and direct support linkages"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Customers CRM" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
              onClick={handleExportRoster}
              title="Download client directory as CSV"
            >
              <RiDownloadLine size={15} className="text-[#8a1c14]" />
              <span>Export Roster CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
              onClick={fetchData}
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

      {/* 4 Executive CRM Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Registered */}
        <Card
          className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer"
          onClick={() => setLifecycleSegment("all")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
              Registered Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <RiGroupLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              {isLoading ? "—" : crmMetrics.totalRegistered.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Authenticated user profiles
            </p>
          </div>
        </Card>

        {/* Card 2: Paying Customers */}
        <Card
          className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer"
          onClick={() => setLifecycleSegment("single")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
              Paying Buyers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <RiUserFollowLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-emerald-900 tracking-tight font-mono">
              {isLoading ? "—" : crmMetrics.payingBuyers}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              {crmMetrics.totalRegistered > 0
                ? `${Math.round(
                    (crmMetrics.payingBuyers / crmMetrics.totalRegistered) * 100,
                  )}% conversion rate`
                : "0%"}
            </p>
          </div>
        </Card>

        {/* Card 3: Repeat VIP Buyers */}
        <Card
          className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer"
          onClick={() => setLifecycleSegment("repeat")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-[#8a1c14]">
              VIP Repeat Buyers
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#8a1c14] flex items-center justify-center">
              <RiUserStarLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              {isLoading ? "—" : crmMetrics.repeatBuyers}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {crmMetrics.repeatRate}% repeat buyer ratio
            </p>
          </div>
        </Card>

        {/* Card 4: Total Customer LTV */}
        <Card className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
              Cumulative Client LTV
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#c5a880] flex items-center justify-center">
              <RiMoneyDollarCircleLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
              ₹{isLoading ? "—" : crmMetrics.totalLtv.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Lifetime verified purchase value
            </p>
          </div>
        </Card>
      </div>

      {/* Filters & Lifecycle Tabs */}
      <Card className="p-4 space-y-3.5 bg-white border-slate-200 shadow-2xs">
        {/* Lifecycle Segment Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Segment:
          </span>
          {LIFECYCLE_SEGMENTS.map((seg) => {
            const active = lifecycleSegment === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => setLifecycleSegment(seg.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                  active
                    ? "bg-[#8a1c14] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {seg.label}
              </button>
            );
          })}
        </div>

        {/* Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <RiSearchLine
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search clients by name, email, or 10-digit mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition cursor-pointer"
          >
            <option value="">Roles: All</option>
            <option value="customer">Customers</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition cursor-pointer"
          >
            <option value="">Account Status: All</option>
            <option value="active">Active Access</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>
      </Card>

      {/* Main Customers Table */}
      <Card className="overflow-hidden border-slate-200 shadow-2xs bg-white">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[950px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Client Profile</th>
                <th className="py-3.5 px-5">Direct Contact & Channels</th>
                <th className="py-3.5 px-5">Role & City</th>
                <th className="py-3.5 text-center px-5">Orders Placed</th>
                <th className="py-3.5 text-right px-5">Lifetime Value (LTV)</th>
                <th className="py-3.5 text-center px-5">Joined Date</th>
                <th className="py-3.5 text-center px-5">Status</th>
                <th className="py-3.5 text-center px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-32" />
                    </td>
                    <td className="py-4 px-5 space-y-1.5">
                      <SkeletonLoader className="h-3.5 w-40" />
                      <SkeletonLoader className="h-3 w-24" />
                    </td>
                    <td className="py-4 px-5 space-y-1">
                      <SkeletonLoader className="h-4 w-16" />
                      <SkeletonLoader className="h-3 w-20" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <SkeletonLoader className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-20 mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4.5 w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-7 w-24 mx-auto rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-14 text-center text-slate-400 italic text-xs"
                  >
                    No customers found matching the selected segment or search
                    query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const custOrders = getCustomerOrders(u);
                  const totalOrders = custOrders.length;
                  const totalSpending = getCustomerTotalSpend(u);
                  const location = getCustomerLocation(u);
                  const cleanPhone = u.phone
                    ? u.phone.replace(/\D/g, "").slice(-10)
                    : "";

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      {/* Name & Segment Badge */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-xs">
                            {u.name}
                          </p>
                          {totalOrders >= 2 ? (
                            <span
                              className="text-[9px] bg-rose-50 text-[#8a1c14] font-extrabold px-1.5 py-0.2 rounded border border-rose-200"
                              title="Repeat VIP Customer"
                            >
                              VIP
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {u._id.slice(-6).toUpperCase()}
                        </p>
                      </td>

                      {/* Contact Details with 1-Click WhatsApp & Email */}
                      <td className="py-3.5 px-5">
                        <p className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">
                          {u.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10.5px] text-slate-500">
                            {u.phone || "No mobile"}
                          </span>

                          {/* Quick WhatsApp Link */}
                          {cleanPhone && cleanPhone.length === 10 ? (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${u.name}, greetings from PARIWESH! We are reaching out regarding your couture account and orders.`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition shadow-2xs"
                              title="Chat on WhatsApp"
                            >
                              <RiWhatsappLine size={12} />
                            </a>
                          ) : null}

                          {/* Quick Mailto Link */}
                          {u.email ? (
                            <a
                              href={`mailto:${u.email}?subject=PARIWESH Atelier - Order Assistance`}
                              className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 hover:bg-[#8a1c14] hover:text-white flex items-center justify-center transition shadow-2xs"
                              title="Send direct email"
                            >
                              <RiMailLine size={11} />
                            </a>
                          ) : null}
                        </div>
                      </td>

                      {/* Role & Location */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9.5px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                            u.role === "admin"
                              ? "bg-amber-50 text-[#c5a880] border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {u.role || "customer"}
                        </span>
                        {location ? (
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5 truncate max-w-[140px]">
                            <RiMapPinLine size={11} className="shrink-0" />
                            <span>{location}</span>
                          </p>
                        ) : null}
                      </td>

                      {/* Lifetime Orders */}
                      <td className="py-3.5 text-center px-5">
                        <button
                          type="button"
                          onClick={() => setInspectUser(u)}
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            totalOrders > 0
                              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}
                          title="Click to inspect order history"
                        >
                          {totalOrders} {totalOrders === 1 ? "Order" : "Orders"}
                        </button>
                      </td>

                      {/* Aggregated Spend */}
                      <td className="py-3.5 text-right px-5 font-mono text-xs font-bold text-slate-900">
                        ₹{totalSpending.toLocaleString("en-IN")}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 text-center px-5 text-slate-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 text-center px-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide inline-block ${
                            u.status === "suspended"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-center px-5 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectUser(u)}
                            className="text-[10px] px-2.5 py-1 text-slate-700 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50 font-semibold cursor-pointer shadow-2xs"
                          >
                            Orders ({totalOrders})
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleToggleSuspension(u)}
                            className={`p-1.5 rounded transition cursor-pointer ${
                              u.status === "suspended"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title={
                              u.status === "suspended"
                                ? "Re-activate User Access"
                                : "Suspend User Access"
                            }
                          >
                            {u.status === "suspended" ? (
                              <RiLockUnlockLine size={16} />
                            ) : (
                              <RiLockLine size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Customer Orders Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-[#FAF9F6] border-b border-slate-200 p-5 shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#8a1c14] border border-rose-100">
                  <RiGroupLine size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-slate-900">
                      {inspectUser.name}
                    </h3>
                    <span
                      className={`text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        inspectUser.status === "suspended"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {inspectUser.status || "active"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {inspectUser.email} • Mobile: {inspectUser.phone || "—"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white">
              {/* Summary Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Total Purchases
                  </span>
                  <p className="font-serif font-extrabold text-base text-slate-900 mt-0.5">
                    ₹
                    {getCustomerTotalSpend(inspectUser).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Booked Orders
                  </span>
                  <p className="font-mono font-bold text-base text-slate-900 mt-0.5">
                    {getCustomerOrders(inspectUser).length} Orders
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Shipping City
                  </span>
                  <p className="font-medium text-xs text-slate-700 mt-0.5 truncate">
                    {getCustomerLocation(inspectUser) || "Not registered yet"}
                  </p>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  All Associated Transactions
                </h4>

                {(() => {
                  const custOrders = getCustomerOrders(inspectUser);

                  if (custOrders.length === 0) {
                    return (
                      <div className="text-xs text-slate-400 italic py-10 text-center bg-slate-50 rounded-xl border border-slate-100">
                        <RiShoppingBag3Line
                          size={28}
                          className="mx-auto mb-1 text-slate-300"
                        />
                        <p>No transactions registered for this client yet.</p>
                      </div>
                    );
                  }

                  return custOrders.map((ord) => (
                    <div
                      key={ord._id}
                      className="bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-xl flex items-center justify-between text-xs transition shadow-2xs"
                    >
                      <div className="space-y-1">
                        {/* Clickable Order Number navigating to Orders manager */}
                        <button
                          type="button"
                          onClick={() => {
                            setInspectUser(null);
                            navigate(`/admin/orders?search=${ord.orderId}`);
                          }}
                          className="font-mono font-bold text-sm text-[#8a1c14] hover:underline flex items-center gap-1 cursor-pointer"
                          title="Open order in Orders manager"
                        >
                          <span>#{ord.orderId}</span>
                          <RiExternalLinkLine size={12} />
                        </button>
                        <p className="text-[10.5px] text-slate-400">
                          Placed on:{" "}
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • Method:{" "}
                          <span className="font-bold text-slate-600">
                            {ord.paymentMethod || "ONLINE"}
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-serif font-bold text-sm text-slate-900">
                          ₹
                          {(
                            ord.pricing?.grandTotal ||
                            ord.totalPrice ||
                            0
                          ).toLocaleString("en-IN")}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 ${
                            ord.orderStatus === "Delivered"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : ord.orderStatus === "Cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ord.orderStatus || "Processing"}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF9F6] border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-400">
                Member since:{" "}
                {new Date(inspectUser.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectUser(null)}
                className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs px-4"
              >
                Close Logs
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
