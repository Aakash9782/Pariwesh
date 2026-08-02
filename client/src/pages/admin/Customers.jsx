import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import Select from "../../components/admin/ui/Select.jsx";
import Badge from "../../components/admin/ui/Badge.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiSearchLine,
  RiDownloadLine,
  RiLockLine,
  RiLockUnlockLine,
  RiShoppingBagLine,
  RiCloseLine,
  RiGroupLine,
} from "react-icons/ri";

const CustomersPage = () => {
  const { showAlert: alert, showConfirm } = useAlert();
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
        (u) => u.email.toLowerCase() === searchEmail.toLowerCase(),
      );
      if (matched) {
        setInspectUser(matched);
      }
    }
  }, [searchParams, users]);

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

  // CSV down loader
  const handleExportRoster = () => {
    const headers = "Name,Email,Phone,Role,Status,RegisteredDate\n";
    const rows = users
      .map(
        (u) =>
          `"${u.name}","${u.email}","${u.phone}","${u.role}","${u.status || "active"}","${new Date(u.createdAt).toLocaleDateString()}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pariwesh_crm_roster_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    alert("CRM client roster exported");
  };

  // Filters mapping
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phone.includes(query);

    const matchRole = roleFilter ? u.role === roleFilter : true;
    const matchStatus = statusFilter
      ? (u.status || "active") === statusFilter
      : true;

    return matchSearch && matchRole && matchStatus;
  });

  const getCustomerOrders = (userId) => {
    return orders.filter(
      (o) => o.customer?.userId === userId || o.customer?.email === userId,
    );
  };

  const getCustomerTotalSpend = (userId) => {
    const custOrders = getCustomerOrders(userId);
    return custOrders.reduce(
      (total, o) => total + (o.pricing?.grandTotal || o.totalPrice || 0),
      0,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Client CRM Roster"
        subtitle="Review authenticated buyers profile directories, orders spend ledger, and suspension privileges"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Customers" },
        ]}
        actions={
          <Button
            variant="outline"
            className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 border-slate-200"
            onClick={handleExportRoster}
          >
            <RiDownloadLine size={16} />
            <span>Export Roster CSV</span>
          </Button>
        }
      />

      {/* Filters Box */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <RiSearchLine
            className="absolute left-3 top-3 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search clients by name, email, mobile phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          />
        </div>

        {/* Role */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="">Roles: All</option>
          <option value="customer">Customers</option>
          <option value="admin">Administrators</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="">Suspension: All</option>
          <option value="active">Active Accounts</option>
          <option value="suspended">Suspended Accounts</option>
        </select>
      </Card>

      {/* Table view */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[900px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-5">Client Name Details</th>
                <th className="py-4 px-5">Contact Details</th>
                <th className="py-4 px-5">Designation Role</th>
                <th className="py-4 text-center px-5">Lifetime Bookings</th>
                <th className="py-4 text-right px-5">Aggregated Value</th>
                <th className="py-4 text-center px-5">Enlisted Date</th>
                <th className="py-4 text-center px-5">Status Flag</th>
                <th className="py-4 text-center px-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4.5 w-24" />
                    </td>
                    <td className="py-4 px-5 space-y-1.5">
                      <SkeletonLoader className="h-3.5 w-32" />
                      <SkeletonLoader className="h-3 w-20" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-12" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-14 mx-auto" />
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
                      <div className="flex justify-center space-x-2">
                        <SkeletonLoader className="h-6.5 w-20 rounded" />
                        <SkeletonLoader className="h-6.5 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No customer tags found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const totalOrders =
                    getCustomerOrders(u._id).length ||
                    getCustomerOrders(u.email).length;
                  const totalSpending =
                    getCustomerTotalSpend(u._id) ||
                    getCustomerTotalSpend(u.email);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-5 font-semibold text-slate-900 text-xs">
                        {u.name}
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] text-slate-600">
                        <p className="font-sans text-slate-800">{u.email}</p>
                        <p className="mt-0.5">{u.phone}</p>
                      </td>
                      <td className="py-4 px-5 font-bold tracking-wider font-mono text-[10px] uppercase">
                        <span
                          className={`px-2 py-0.5 rounded-sm ${
                            u.role === "admin"
                              ? "bg-amber-50 text-[#c5a880] border border-[#c5a880]/15"
                              : "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-center px-5 text-slate-700 font-mono">
                        {totalOrders} Orders
                      </td>
                      <td className="py-4 text-right px-5 text-slate-900 font-mono font-bold">
                        ₹{totalSpending}
                      </td>
                      <td className="py-4 text-center px-5 text-slate-500 font-mono">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-center px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide inline-block ${
                            u.status === "suspended"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                      </td>
                      <td className="py-4 text-center px-5">
                        <div className="flex justify-center items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectUser(u)}
                            className="text-[10px] px-2 py-1 h-auto"
                          >
                            Invoice History
                          </Button>
                          <button
                            onClick={() => handleToggleSuspension(u)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition hover:bg-slate-50 rounded"
                            title={
                              u.status === "suspended"
                                ? "Activate Access"
                                : "Suspend Access"
                            }
                          >
                            {u.status === "suspended" ? (
                              <RiLockUnlockLine
                                size={16}
                                className="text-emerald-600"
                              />
                            ) : (
                              <RiLockLine size={16} className="text-rose-600" />
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

      {/* Inspect Customer order logs modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[82vh] animate-zoom-in">
            <div className="flex justify-between items-center bg-[#FAF9F6] border-b border-slate-200 p-5 shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#c5a880] border border-[#c5a880]/15">
                  <RiGroupLine size={20} />
                </div>
                <div>
                  <h3 className="font-display font-medium text-base text-slate-900 tracking-wide uppercase">
                    Order History: {inspectUser.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {inspectUser.email} | Mobile: {inspectUser.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-450 hover:text-[#c5a880] p-1.5 hover:bg-slate-50 rounded-full transition"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Total Purchase Value:{" "}
                <span className="text-[#c5a880] font-mono text-sm ml-1 font-bold">
                  ₹
                  {getCustomerTotalSpend(inspectUser._id) ||
                    getCustomerTotalSpend(inspectUser.email)}
                </span>
              </h4>
              <div className="space-y-3">
                {(() => {
                  const items = getCustomerOrders(inspectUser._id).concat(
                    getCustomerOrders(inspectUser.email),
                  );
                  const uniqueOrders = items.filter(
                    (v, i, a) => a.findIndex((t) => t._id === v._id) === i,
                  );

                  if (uniqueOrders.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 rounded border border-slate-100">
                        No order history logged for this customer.
                      </p>
                    );
                  }

                  return uniqueOrders.map((ord, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FAF9F6]/40 border border-slate-200 p-4 rounded-lg flex items-center justify-between text-xs transition hover:border-[#c5a880]/30"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold font-mono uppercase tracking-wider text-[#c5a880]">
                          #{ord.orderId}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Placed on:{" "}
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-bold text-slate-800 font-mono">
                            ₹{ord.pricing?.grandTotal || ord.totalPrice}
                          </p>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-bold mt-1 ${
                              ord.orderStatus === "Delivered"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="bg-[#FAF9F6] border-t border-slate-200 p-4 flex justify-end shrink-0">
              <Button
                variant="outline"
                onClick={() => setInspectUser(null)}
                className="border-slate-250 text-slate-700"
              >
                Close History Logs
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
