import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import {
  RiSettings4Line,
  RiShieldUserLine,
  RiShipLine,
  RiHistoryLine,
  RiSaveLine,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiFolderImageLine,
  RiFileTextLine,
} from "react-icons/ri";
import GeneralTab from "./settings/GeneralTab.jsx";
import ShippingTab from "./settings/ShippingTab.jsx";
import SlideshowTab from "./settings/SlideshowTab.jsx";
import AdminManagementTab from "./settings/AdminManagementTab.jsx";

const SettingsPage = () => {
  const { showAlert: alert, showConfirm } = useAlert();

  const [activeTab, setActiveTab] = useState("general");
  const [dbSettings, setDbSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Admin list
  const [adminsList, setAdminsList] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  // Activity logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Core General Form
  const [generalForm, setGeneralForm] = useState({
    brandName: "Pariwesh",
    brandLogoUrl: "",
    supportPhone: "+91 97826 81155",
    supportEmail: "contact@pariwesh.co",
    gstinNumber: "08AAPPP1234A1Z9",
    maintenanceMode: "false",
    countdownActive: "true",
    countdownTitle: "Limited Collection Closes In:",
    countdownEndDate: "",
  });

  // Shipping & Payment configs
  const [shippingForm, setShippingForm] = useState({
    codEnabled: "true",
    deliveryCharge: "70",
    freeThreshold: "2499",
  });

  // Hero slideshow config states
  const [slideBarActive, setSlideBarActive] = useState(true);
  const [slideImg1, setSlideImg1] = useState("");
  const [slideImg2, setSlideImg2] = useState("");
  const [slideImg3, setSlideImg3] = useState("");
  const [slideImg4, setSlideImg4] = useState("");
  const [slideImg5, setSlideImg5] = useState("");

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await API.get("/settings");
      if (res.data?.success) {
        const data = res.data.data || {};
        setDbSettings(data);
        setGeneralForm({
          brandName: data.brandName || "Pariwesh",
          brandLogoUrl: data.brandLogoUrl || "",
          supportPhone: data.supportPhone || "+91 97826 81155",
          supportEmail: data.supportEmail || "contact@pariwesh.co",
          gstinNumber: data.gstinNumber || "08AAPPP1234A1Z9",
          maintenanceMode: data.maintenanceMode || "false",
          countdownActive:
            data.countdownActive === undefined
              ? "true"
              : String(data.countdownActive),
          countdownTitle:
            data.countdownTitle || "Limited Collection Closes In:",
          countdownEndDate: data.countdownEndDate || "",
        });
        setShippingForm({
          codEnabled: data.codEnabled || "true",
          deliveryCharge: data.deliveryCharge || "70",
          freeThreshold: data.freeThreshold || "2499",
        });
        setSlideBarActive(
          data.slideBarActive === undefined
            ? true
            : data.slideBarActive === "true" || data.slideBarActive === true,
        );
        setSlideImg1(data.slideImg1 || "");
        setSlideImg2(data.slideImg2 || "");
        setSlideImg3(data.slideImg3 || "");
        setSlideImg4(data.slideImg4 || "");
        setSlideImg5(data.slideImg5 || "");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync system parameters");
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setAdminsLoading(true);
      const res = await API.get("/users");
      if (res.data?.success) {
        // filter roles admin
        const filtered = (res.data.data || []).filter(
          (u) => u.role === "admin",
        );
        setAdminsList(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await API.get("/logs");
      if (res.data?.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
    fetchActivityLogs();
  }, []);

  const saveSettingKey = async (key, val) => {
    try {
      await API.post("/settings", { key, value: String(val) });
    } catch (err) {
      console.error(`Failed updating setting parameter ${key}:`, err);
      throw err;
    }
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      await Promise.all(
        Object.entries(generalForm).map(([key, val]) =>
          saveSettingKey(key, val),
        ),
      );
      alert("General system parameters saved successfully!");
      fetchSettings();
    } catch (err) {
      alert("Failed to commit settings key/value updates");
    }
  };

  const handleSaveShipping = async (e) => {
    e.preventDefault();
    try {
      await Promise.all(
        Object.entries(shippingForm).map(([key, val]) =>
          saveSettingKey(key, val),
        ),
      );
      alert("Logistics shipment metrics deployed successfully!");
      fetchSettings();
    } catch (err) {
      alert("Failed to commit shipping parameters");
    }
  };

  const handleSaveSlideshow = async (e) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      await saveSettingKey("slideBarActive", String(slideBarActive));
      await saveSettingKey("slideImg1", slideImg1);
      await saveSettingKey("slideImg2", slideImg2);
      await saveSettingKey("slideImg3", slideImg3);
      await saveSettingKey("slideImg4", slideImg4);
      await saveSettingKey("slideImg5", slideImg5);
      alert("Homepage Hero Slideshow settings updated successfully!");
      fetchSettings();
    } catch (err) {
      alert("Failed to commit slideshow updates");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Add / promote Admin profile
  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    if (!newAdminPhone || !newAdminName || !newAdminEmail) {
      alert("Required name, email and phone to bind Admin privileges");
      return;
    }
    try {
      // Create user with admin privilege using regular user create method mapped
      // Or conceptually, let's promote if the account exists, or create new one:
      // Let's call a post request which will simulate backend account creation. User details endpoint:
      // Let's create an admin account by calling user profile updates or registering
      const cleanPhone = newAdminPhone.replace(/\D/g, "");
      const res = await API.post("/users/login", {
        phone: cleanPhone,
        name: newAdminName,
        email: newAdminEmail,
      });

      if (res.data?.success) {
        const registered = res.data.data.user;
        // Promote role to admin via PUT API `/users/:id`
        await API.put(`/users/${registered._id}`, { role: "admin" });
        alert(`Admin privileges delegated to ${newAdminName}!`);
        setShowAddAdmin(false);
        setNewAdminPhone("");
        setNewAdminName("");
        setNewAdminEmail("");
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to authorize/deploy new admin user credentials");
    }
  };

  const handleRevokeAdmin = async (adminId, name) => {
    if (adminsList.length <= 1) {
      alert(
        "Forbidden: System must compile with at least one super admin registry.",
      );
      return;
    }
    const confirmed = await showConfirm(
      `Revoke admin role and suspend access for: ${name}?`,
      "Revoke Admin",
    );
    if (!confirmed) return;
    try {
      // Modify role to customer
      await API.put(`/users/${adminId}`, { role: "customer" });
      alert("Admin privileges revoked successfully");
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to suspend privileges");
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneralForm((prev) => ({
          ...prev,
          brandLogoUrl: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlideFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updaters = [
          setSlideImg1,
          setSlideImg2,
          setSlideImg3,
          setSlideImg4,
          setSlideImg5,
        ];
        if (updaters[index]) {
          updaters[index](reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-wide text-white">
          System Configuration
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-sans">
          Configure platform parameters, delegate administrative rights, and
          inspect logs ledger
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950 p-2 rounded-t-lg shrink-0 overflow-x-auto space-x-2">
        {[
          {
            id: "general",
            label: "General Settings",
            icon: <RiSettings4Line size={16} />,
          },
          {
            id: "slides",
            label: "Homepage Slideshow",
            icon: <RiFolderImageLine size={16} />,
          },
          {
            id: "shipping",
            label: "Shipping & Taxes",
            icon: <RiShipLine size={16} />,
          },
          {
            id: "admins",
            label: "Admin Access",
            icon: <RiShieldUserLine size={16} />,
          },
          {
            id: "logs",
            label: "Security Logs",
            icon: <RiHistoryLine size={16} />,
          },
        ].map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 text-xs font-semibold py-2.5 px-4.5 rounded transition ${
              activeTab === tab.id
                ? "bg-accent-gold text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TABS CANVAS */}
      <div className="bg-slate-950 border border-slate-800 rounded-b-lg p-6 min-h-[400px]">
        {settingsLoading && activeTab !== "admins" && activeTab !== "logs" ? (
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <>
            {/* GENERAL SETTINGS */}
            {activeTab === "general" && (
              <GeneralTab
                generalForm={generalForm}
                setGeneralForm={setGeneralForm}
                handleSaveGeneral={handleSaveGeneral}
                handleLogoFileChange={handleLogoFileChange}
              />
            )}

            {/* SHIPPING & SHIPS CHARGE */}
            {activeTab === "shipping" && (
              <ShippingTab
                shippingForm={shippingForm}
                setShippingForm={setShippingForm}
                handleSaveShipping={handleSaveShipping}
              />
            )}

            {/* HOMEPAGE SLIDESHOW SETTINGS */}
            {activeTab === "slides" && (
              <SlideshowTab
                slideBarActive={slideBarActive}
                setSlideBarActive={setSlideBarActive}
                slideImg1={slideImg1}
                setSlideImg1={setSlideImg1}
                slideImg2={slideImg2}
                setSlideImg2={setSlideImg2}
                slideImg3={slideImg3}
                setSlideImg3={setSlideImg3}
                slideImg4={slideImg4}
                setSlideImg4={setSlideImg4}
                slideImg5={slideImg5}
                setSlideImg5={setSlideImg5}
                handleSaveSlideshow={handleSaveSlideshow}
                handleSlideFileChange={handleSlideFileChange}
              />
            )}

            {/* ADMIN ACCESS MANAGEMENT */}
            {activeTab === "admins" && (
              <AdminManagementTab
                adminsLoading={adminsLoading}
                adminsList={adminsList}
                showAddAdmin={showAddAdmin}
                setShowAddAdmin={setShowAddAdmin}
                newAdminName={newAdminName}
                setNewAdminName={setNewAdminName}
                newAdminEmail={newAdminEmail}
                setNewAdminEmail={setNewAdminEmail}
                newAdminPhone={newAdminPhone}
                setNewAdminPhone={setNewAdminPhone}
                handleRevokeAdmin={handleRevokeAdmin}
                handleAddAdminSubmit={handleAddAdminSubmit}
              />
            )}

            {/* SECURITY LOGS AUDIT */}
            {activeTab === "logs" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <h3 className="text-xs uppercase font-extrabold text-slate-200">
                    Security Activity Audit Trail
                  </h3>
                  <button
                    onClick={fetchActivityLogs}
                    className="text-xs text-accent-gold font-bold hover:underline"
                  >
                    Sync Audit Logs
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {logsLoading ? (
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-slate-900 text-slate-405 font-bold uppercase tracking-widest text-[9px] border border-slate-850">
                        <tr>
                          <th className="p-3">Admin Clerk</th>
                          <th className="p-3">Action Description</th>
                          <th className="p-3 font-mono">Clerk IP Address</th>
                          <th className="p-3">Device Agent</th>
                          <th className="p-3">Logged Date Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 border border-slate-850">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="border-b border-slate-850/40">
                            <td className="p-3">
                              <Skeleton className="h-4 w-24" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="h-4 w-48" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="h-3.5 w-20" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="h-3 w-16" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="h-3.5 w-28" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : logs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-6 text-center">
                      No logs generated yet
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-slate-900 text-slate-405 font-bold uppercase tracking-widest text-[9px] border border-slate-850">
                        <tr>
                          <th className="p-3">Admin Clerk</th>
                          <th className="p-3">Action Description</th>
                          <th className="p-3 font-mono">Clerk IP Address</th>
                          <th className="p-3">Device Agent</th>
                          <th className="p-3">Logged Date Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 border border-slate-850">
                        {logs.slice(0, 50).map((log, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-900/50 transition"
                          >
                            <td className="p-3 font-semibold text-slate-200">
                              {log.adminName}
                            </td>
                            <td className="p-3 text-slate-350">{log.action}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-450">
                              {log.ipAddress}
                            </td>
                            <td className="p-3 text-slate-550 font-mono text-[9px] uppercase">
                              {log.device}
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
