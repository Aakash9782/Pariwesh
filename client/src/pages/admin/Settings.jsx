import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiSettings4Line,
  RiShieldUserLine,
  RiShipLine,
  RiHistoryLine,
  RiFolderImageLine,
} from "react-icons/ri";
import GeneralTab from "./settings/GeneralTab.jsx";
import ShippingTab from "./settings/ShippingTab.jsx";
import SlideshowTab from "./settings/SlideshowTab.jsx";
import AdminManagementTab from "./settings/AdminManagementTab.jsx";
import HomepageTab from "./settings/HomepageTab.jsx";

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
    announcementText:
      "✨ USE CODE PARIWESHGOLD TO GET 15% OFF + FREE SHIPPING ON APPAREL ABOVE ₹1500 ✨",
    announcementActive: "true",
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

  // Custom Dynamic homepage states
  const [storyImage, setStoryImage] = useState("");
  const [categories, setCategories] = useState([
    { title: "Designer Suits", path: "/shop?category=ethnic", image: "" },
    { title: "Premium Kurtis", path: "/shop?category=kurtis", image: "" },
    { title: "Co-Ord Sets", path: "/shop?category=suits", image: "" },
    { title: "Best Sellers", path: "/shop?tag=Best Seller", image: "" },
    { title: "New Arrivals", path: "/shop?tag=New Arrival", image: "" },
  ]);
  const [vibeMoods, setVibeMoods] = useState([
    {
      title: "Day To Dusk",
      path: "/shop?tag=Best Seller",
      bgImg: "",
      insetImg: "",
    },
    {
      title: "The Linen Edit",
      path: "/shop?category=kurtis",
      bgImg: "",
      insetImg: "",
    },
    {
      title: "Not So Boring",
      path: "/shop?category=suits",
      bgImg: "",
      insetImg: "",
    },
    {
      title: "Festive Essentials",
      path: "/shop?category=ethnic",
      bgImg: "",
      insetImg: "",
    },
  ]);

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
          announcementText:
            data.announcementText ||
            "✨ USE CODE PARIWESHGOLD TO GET 15% OFF + FREE SHIPPING ON APPAREL ABOVE ₹1500 ✨",
          announcementActive:
            data.announcementActive === undefined
              ? "true"
              : String(data.announcementActive),
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

        // Load dynamic homepage curations settings
        setStoryImage(data.homeStoryImage || "");
        if (data.homeCategories) {
          try {
            const parsed = JSON.parse(data.homeCategories);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCategories(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (data.homeVibeMoods) {
          try {
            const parsed = JSON.parse(data.homeVibeMoods);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setVibeMoods(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }
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
      localStorage.setItem("brandLogoUrl", generalForm.brandLogoUrl || "");
      localStorage.setItem(
        "announcementText",
        generalForm.announcementText || "",
      );
      localStorage.setItem(
        "announcementActive",
        generalForm.announcementActive || "true",
      );
      window.dispatchEvent(new Event("settings-updated"));
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

  const handleSaveHomepage = async (e) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      await saveSettingKey("homeStoryImage", storyImage);
      await saveSettingKey("homeCategories", JSON.stringify(categories));
      await saveSettingKey("homeVibeMoods", JSON.stringify(vibeMoods));
      alert("Homepage Curations saved successfully!");
      fetchSettings();
    } catch (err) {
      alert("Failed to commit homepage settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    if (!newAdminPhone || !newAdminName || !newAdminEmail) {
      alert("Required name, email and phone to bind Admin privileges");
      return;
    }
    try {
      const cleanPhone = newAdminPhone.replace(/\D/g, "");
      const res = await API.post("/users/login", {
        phone: cleanPhone,
        name: newAdminName,
        email: newAdminEmail,
      });

      if (res.data?.success) {
        const registered = res.data.data.user;
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
    <div className="space-y-6 text-slate-700 animate-fade-in font-sans">
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Settings" },
        ]}
        subtitle="Brand, shipping, slideshow, admin access, and activity logs"
      />

      {/* Tabs */}
      <div className="flex border border-slate-200 bg-white p-1.5 rounded-xl shrink-0 overflow-x-auto gap-1 shadow-xs admin-scrollbar">
        {[
          {
            id: "general",
            label: "General",
            icon: <RiSettings4Line size={15} />,
          },
          {
            id: "homepage",
            label: "Homepage",
            icon: <RiFolderImageLine size={15} />,
          },
          {
            id: "slides",
            label: "Slideshow",
            icon: <RiFolderImageLine size={15} />,
          },
          {
            id: "shipping",
            label: "Shipping",
            icon: <RiShipLine size={15} />,
          },
          {
            id: "admins",
            label: "Admins",
            icon: <RiShieldUserLine size={15} />,
          },
          {
            id: "logs",
            label: "Logs",
            icon: <RiHistoryLine size={15} />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 text-[11px] font-semibold py-2.5 px-4 rounded-lg transition duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#c5a880] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TABS CANVAS */}
      <Card className="p-5 sm:p-6 min-h-[400px]" hover={false}>
        {settingsLoading && activeTab !== "admins" && activeTab !== "logs" ? (
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <SkeletonLoader className="h-3 w-32 rounded animate-pulse" />
                  <SkeletonLoader className="h-10 w-full rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <SkeletonLoader className="h-3 w-40 rounded animate-pulse" />
              <SkeletonLoader className="h-12 w-full rounded animate-pulse" />
            </div>
            <SkeletonLoader className="h-10 w-32 rounded animate-pulse" />
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

            {/* HOMEPAGE CURATIONS SETTINGS */}
            {activeTab === "homepage" && (
              <HomepageTab
                storyImage={storyImage}
                setStoryImage={setStoryImage}
                categories={categories}
                setCategories={setCategories}
                vibeMoods={vibeMoods}
                setVibeMoods={setVibeMoods}
                handleSaveHomepage={handleSaveHomepage}
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
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider">
                    Security Activity Audit Trail
                  </h3>
                  <Button
                    onClick={fetchActivityLogs}
                    variant="outline"
                    size="sm"
                    className="text-xs text-[#c5a880] border-slate-200"
                  >
                    Sync Audit Logs
                  </Button>
                </div>

                <div className="overflow-x-auto w-full">
                  {logsLoading ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF9F6] text-slate-500 font-bold uppercase tracking-widest text-[9px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Admin Clerk</th>
                          <th className="p-3">Action Description</th>
                          <th className="p-3 font-mono">Clerk IP Address</th>
                          <th className="p-3">Device Agent</th>
                          <th className="p-3">Logged Date Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 border border-slate-200 text-slate-700">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="border-b border-slate-200/40">
                            <td className="p-3">
                              <SkeletonLoader className="h-4 w-24 rounded animate-pulse" />
                            </td>
                            <td className="p-3">
                              <SkeletonLoader className="h-4 w-48 rounded animate-pulse" />
                            </td>
                            <td className="p-3">
                              <SkeletonLoader className="h-3.5 w-20 rounded animate-pulse" />
                            </td>
                            <td className="p-3">
                              <SkeletonLoader className="h-3 w-16 rounded animate-pulse" />
                            </td>
                            <td className="p-3">
                              <SkeletonLoader className="h-3.5 w-28 rounded animate-pulse" />
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
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF9F6] text-slate-500 font-bold uppercase tracking-widest text-[9px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Admin Clerk</th>
                          <th className="p-3">Action Description</th>
                          <th className="p-3 font-mono">Clerk IP Address</th>
                          <th className="p-3">Device Agent</th>
                          <th className="p-3">Logged Date Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 border border-slate-200">
                        {logs.slice(0, 50).map((log, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition duration-150 text-slate-700"
                          >
                            <td className="p-3 font-semibold text-slate-800">
                              {log.adminName}
                            </td>
                            <td className="p-3 text-slate-600">{log.action}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-500">
                              {log.ipAddress}
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[9px] uppercase">
                              {log.device}
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[10px]">
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
      </Card>
    </div>
  );
};

export default SettingsPage;
