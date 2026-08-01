import React from "react";
import { RiAddCircleLine, RiDeleteBinLine } from "react-icons/ri";
import Skeleton from "../../../components/common/Skeleton.jsx";

const AdminManagementTab = ({
  adminsLoading,
  adminsList,
  showAddAdmin,
  setShowAddAdmin,
  newAdminName,
  setNewAdminName,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPhone,
  setNewAdminPhone,
  handleRevokeAdmin,
  handleAddAdminSubmit,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
        <h3 className="text-xs uppercase font-extrabold text-slate-400">
          Delegate admin dashboard keys
        </h3>
        <button
          onClick={() => setShowAddAdmin(true)}
          className="flex items-center space-x-1 text-xs font-bold text-accent-gold hover:underline"
        >
          <RiAddCircleLine size={16} />
          <span>Authorize Admin Phone</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-850 p-4.5 rounded-lg flex items-center justify-between"
              >
                <div className="space-y-2 w-2/3">
                  <Skeleton className="h-4.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))
          : adminsList.map((admin, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-850 p-4.5 rounded-lg flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200 text-sm tracking-tight">
                    {admin.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono pr-2">
                    {admin.email}
                  </p>
                  <p className="text-[9px] text-accent-gold font-mono tracking-widest font-bold uppercase">
                    Phone: {admin.phone}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeAdmin(admin._id, admin.name)}
                  className="text-slate-500 hover:text-red-400 p-2.5 transition"
                  title="Revoke Admin Access"
                >
                  <RiDeleteBinLine size={16} />
                </button>
              </div>
            ))}
      </div>

      {/* Add admin phone modal inline page */}
      {showAddAdmin && (
        <form
          onSubmit={handleAddAdminSubmit}
          className="bg-slate-900 border border-slate-850 p-5 rounded-lg max-w-md space-y-4 animate-slide-in-top"
        >
          <div>
            <h4 className="text-xs font-bold text-slate-200 font-sans uppercase">
              Promote buyer number to Administrative
            </h4>
            <p className="text-[9px] text-slate-500 mt-1">
              If the number doesn't exist, we will automatically set credentials
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5 flex flex-col font-sans">
              <label className="text-[10px] text-slate-450 font-bold uppercase">
                Admin Name
              </label>
              <input
                type="text"
                required
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Super Admin Name"
                className="bg-slate-950 border border-slate-800 text-xs p-2 rounded text-white"
              />
            </div>
            <div className="space-y-1.5 flex flex-col font-sans">
              <label className="text-[10px] text-slate-450 font-bold uppercase">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="e.g. support@pariwesh.com"
                className="bg-slate-950 border border-slate-800 text-xs p-2 rounded text-white"
              />
            </div>
            <div className="space-y-1.5 flex flex-col font-sans">
              <label className="text-[10px] text-slate-450 font-bold uppercase font-mono">
                10-Digit Mobile phone number
              </label>
              <input
                type="number"
                required
                value={newAdminPhone}
                onChange={(e) => setNewAdminPhone(e.target.value)}
                placeholder="e.g. 9782681155"
                className="bg-slate-950 border border-slate-800 text-xs p-2 rounded text-white"
              />
            </div>
          </div>

          <div className="flex space-x-3.5">
            <button
              type="submit"
              className="bg-accent-gold text-slate-950 text-[10px] font-bold py-1.5 px-4 rounded"
            >
              Enroll Admin Number
            </button>
            <button
              type="button"
              onClick={() => setShowAddAdmin(false)}
              className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] py-1.5 px-3 rounded"
            >
              Discard
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminManagementTab;
