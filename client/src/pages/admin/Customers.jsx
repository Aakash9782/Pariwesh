import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { useSearchParams } from "react-router-dom";
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold tracking-wide text-white">
            Client CRM Roster
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Review authenticated buyers profile directories, orders spend
            ledger, and suspension privileges
          </p>
        </div>
        <button
          onClick={handleExportRoster}
          className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 text-accent-gold text-xs font-bold py-2.5 px-4.5 border border-slate-800 rounded-lg transition"
        >
          <RiDownloadLine size={16} />
          <span>Export Roster CSV</span>
        </button>
      </div>

      {/* Filters Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <RiSearchLine
            className="absolute left-3.5 top-3.5 text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search clients by name, email, mobile phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* Role */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="">Roles: All</option>
          <option value="customer">Customers</option>
          <option value="admin">Administrators</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="">Suspension: All</option>
          <option value="active">Active Accounts</option>
          <option value="suspended">Suspended Accounts</option>
        </select>
      </div>

      {/* Table view */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-sans min-w-[900px]">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
            <tr>
              <th className="py-4.5 px-5">Client Name Details</th>
              <th className="py-4.5 px-5">Contact details</th>
              <th className="py-4.5 px-5">Designation role</th>
              <th className="py-4.5 text-center px-5">Lifetime Bookings</th>
              <th className="py-4.5 text-right px-5">Aggregated Value</th>
              <th className="py-4.5 text-center px-5">Enlisted date</th>
              <th className="py-4.5 text-center px-5">Status flag</th>
              <th className="py-4.5 text-center px-5 font-mono">Action</th>
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
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="py-4.5 px-5">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4 w-14 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4.5 w-16 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <Skeleton className="h-6.5 w-20" />
                      <Skeleton className="h-6.5 w-8" />
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-500 italic"
                >
                  No customer tags found matching criteria
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
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-4.5 px-5 font-semibold text-slate-200 text-sm tracking-tight">
                      {u.name}
                    </td>
                    <td className="py-4.5 px-5 space-y-0.5 font-mono text-[11px]">
                      <p className="text-slate-300 font-sans">{u.email}</p>
                      <p className="text-slate-500">{u.phone}</p>
                    </td>
                    <td className="py-4.5 px-5 font-bold tracking-wider font-mono text-[9px] uppercase">
                      <span
                        className={`px-2.5 py-0.5 rounded ${
                          u.role === "admin"
                            ? "bg-accent-gold/10 text-accent-gold"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4.5 text-center px-5 text-slate-350 font-mono font-semibold">
                      {totalOrders} Orders
                    </td>
                    <td className="py-4.5 text-right px-5 text-slate-200 font-mono font-bold">
                      ₹{totalSpending}
                    </td>
                    <td className="py-4.5 text-center px-5 text-slate-500 font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4.5 text-center px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                          u.status === "suspended"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {u.status || "active"}
                      </span>
                    </td>
                    <td className="py-4.5 text-center px-5">
                      <div className="flex justify-center items-center space-x-1">
                        <button
                          onClick={() => setInspectUser(u)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-1 px-2 rounded-lg text-slate-400 hover:text-accent-gold font-sans font-bold transition text-[10px]"
                        >
                          Invoice History
                        </button>
                        <button
                          onClick={() => handleToggleSuspension(u)}
                          className="p-2 text-slate-400 hover:underline transition"
                          title={
                            u.status === "suspended"
                              ? "Active user"
                              : "Suspend user"
                          }
                        >
                          {u.status === "suspended" ? (
                            <RiLockUnlockLine
                              size={16}
                              className="text-green-400"
                            />
                          ) : (
                            <RiLockLine size={16} className="text-red-400" />
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

      {/* Inspect Customer order logs modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center bg-slate-950 border-b border-slate-850 p-5 shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/20">
                  <RiGroupLine size={20} />
                </div>
                <div>
                  <h3 className="font-display font-medium text-lg text-white">
                    Order History: {inspectUser.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {inspectUser.email} | Mobile: {inspectUser.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-accent-gold p-1"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                Total Purchase Value:{" "}
                <strong className="text-accent-gold">
                  ₹
                  {getCustomerTotalSpend(inspectUser._id) ||
                    getCustomerTotalSpend(inspectUser.email)}
                </strong>
              </h4>
              <div className="space-y-3">
                {(() => {
                  const items = getCustomerOrders(inspectUser._id).concat(
                    getCustomerOrders(inspectUser.email),
                  );
                  // remove duplicates if user has same _id and email references
                  const uniqueOrders = items.filter(
                    (v, i, a) => a.findIndex((t) => t._id === v._id) === i,
                  );

                  if (uniqueOrders.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 italic py-6 text-center">
                        No orders history present in the database
                      </p>
                    );
                  }

                  return uniqueOrders.map((ord, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-850 p-4 rounded-lg flex items-center justify-between text-xs font-sans"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-200 font-mono uppercase tracking-wider text-accent-gold">
                          {ord.orderId}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center">
                          Placed on:{" "}
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-bold text-slate-200 font-mono">
                            ₹{ord.pricing?.grandTotal || ord.totalPrice}
                          </p>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase mt-1 ${
                              ord.orderStatus === "Delivered"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-yellow-500/10 text-yellow-400"
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

            <div className="bg-slate-950 border-t border-slate-850 p-5 flex justify-end shrink-0">
              <button
                onClick={() => setInspectUser(null)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-350 text-xs font-semibold py-2 px-5.5 rounded-lg border border-slate-800 transition"
              >
                Close Logs Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
