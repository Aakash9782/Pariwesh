import React from "react";
import { RiAddCircleLine, RiDeleteBinLine } from "react-icons/ri";
import SkeletonLoader from "../../../components/admin/ui/SkeletonLoader.jsx";
import Button from "../../../components/admin/ui/Button.jsx";
import Input from "../../../components/admin/ui/Input.jsx";

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
    <div className="space-y-6 text-slate-700 font-sans">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider">
          Delegate Admin Dashboard Keys
        </h3>
        <Button
          onClick={() => setShowAddAdmin(true)}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1 text-xs text-[#c5a880] border-slate-205"
        >
          <RiAddCircleLine size={16} />
          <span>Authorize Admin Phone</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 p-4.5 rounded-xl flex items-center justify-between shadow-sm"
              >
                <div className="space-y-2 w-2/3">
                  <SkeletonLoader className="h-4.5 w-24 rounded animate-pulse" />
                  <SkeletonLoader className="h-3 w-32 rounded animate-pulse" />
                  <SkeletonLoader className="h-3 w-20 rounded animate-pulse" />
                </div>
                <SkeletonLoader className="h-8 w-8 rounded-full animate-pulse" />
              </div>
            ))
          : adminsList.map((admin, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 p-4.5 rounded-xl flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 text-sm tracking-tight">
                    {admin.name}
                  </p>
                  <p className="text-[10px] text-slate-450 font-mono pr-2">
                    {admin.email}
                  </p>
                  <p className="text-[9px] text-[#c5a880] font-mono tracking-widest font-bold uppercase">
                    Phone: {admin.phone}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeAdmin(admin._id, admin.name)}
                  className="text-slate-400 hover:text-rose-500 p-2.5 transition"
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
          className="bg-white border border-slate-200 p-5 rounded-xl max-w-md space-y-4 shadow-md animate-fade-in"
        >
          <div>
            <h4 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">
              Promote Buyer Number to Administrative
            </h4>
            <p className="text-[9px] text-slate-500 mt-1">
              If the number doesn't exist, we will automatically set
              credentials.
            </p>
          </div>
          <div className="space-y-3">
            <Input
              type="text"
              required
              label="Admin Name"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="Super Admin Name"
            />
            <Input
              type="email"
              required
              label="Admin Email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="e.g. support@pariwesh.com"
            />
            <Input
              type="number"
              required
              label="10-Digit Mobile Phone Number"
              value={newAdminPhone}
              onChange={(e) => setNewAdminPhone(e.target.value)}
              placeholder="e.g. 9782681155"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-[10px] font-bold py-1.5 px-4"
            >
              Enroll Admin Number
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddAdmin(false)}
              className="text-[10px] py-1.5 px-3"
            >
              Discard
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminManagementTab;
