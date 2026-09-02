import React from "react";
import { ProductWizardContext } from "./ProductWizardContext.jsx";
import ProductLivePreview from "./ProductLivePreview.jsx";
import Button from "../ui/Button.jsx";
import {
  ProductBasicTab,
  ProductHierarchyTab,
  ProductPricingTab,
  ProductDetailsTab,
  ProductVisibilityTab,
  ProductSeoTab,
  ProductMediaTab,
} from "./ProductWizardTabs.jsx";

import {
  RiCloseLine,
  RiAlertLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiFileTextLine,
  RiMoneyDollarCircleLine,
  RiLayoutGridLine,
  RiTShirtLine,
  RiEyeLine,
  RiSearchLine,
  RiFolderImageLine,
  RiCheckboxCircleFill,
} from "react-icons/ri";

const ProductWizardModal = ({
  showFormModal,
  editProduct,
  setEditProduct,
  form,
  setForm,
  categories,
  brands,
  collections,
  validationErrors,
  activeTab,
  setActiveTab,
  previewDevice,
  setPreviewDevice,
  manualSlug,
  setManualSlug,
  generateSKU,
  syncPrice,
  attemptCloseModal,
  handleFormAction,
  handleSubmit,
  setIsDirty,
  validateImageFile,
  handleImageFileChange,
  handleVideoFileChange,
  handleUrlVideoAdd,
  handleVideoRemove,
  handleUrlImageAdd,
  dragOver,
  setDragOver,
  showValidationSummary,
  setShowValidationSummary,
  sidebarCollapsed,
  setSidebarCollapsed,
}) => {
  if (!showFormModal) return null;

  const contextValue = {
    form,
    setForm,
    categories,
    brands,
    collections,
    validationErrors,
    activeTab,
    setActiveTab,
    previewDevice,
    setPreviewDevice,
    manualSlug,
    setManualSlug,
    generateSKU,
    syncPrice,
    attemptCloseModal,
    validateImageFile,
    handleImageFileChange,
    handleVideoFileChange,
    handleUrlVideoAdd,
    handleVideoRemove,
    handleUrlImageAdd,
    dragOver,
    setDragOver,
    editProduct,
    setEditProduct,
  };

  const steps = [
    "basic",
    "pricing",
    "category",
    "details",
    "visibility",
    "seo",
    "media",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-7xl h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 animate-slide-up">
        {/* Modal Title Banner */}
        <div className="flex justify-between items-center bg-[#FAF9F6] border-b border-slate-200 p-5 shrink-0">
          <div>
            <h3 className="font-display font-medium text-base text-slate-900 tracking-wide uppercase">
              {editProduct
                ? `Refining SKU: ${form.sku}`
                : "Premium Ensembles Enrollment"}
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Specify detailed properties layout mapping directly into the
              product catalog
            </p>
          </div>
          <button
            type="button"
            onClick={attemptCloseModal}
            className="text-slate-400 hover:text-[#c5a880] p-1.5 hover:bg-slate-50 rounded-full transition border border-transparent hover:border-slate-200"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Validation Errors Header Alert bar */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 shrink-0 flex items-start space-x-3.5 animate-slide-down">
            <RiAlertLine className="text-rose-500 mt-0.5 shrink-0" size={18} />
            <div className="flex-1">
              <p className="text-xs font-bold text-rose-800">
                A few required parameters are missing before catalog
                serialization:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 mt-2">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(err.tab);
                        setTimeout(() => {
                          const el = document.getElementById(
                            `input-${err.field}`,
                          );
                          if (el) {
                            el.focus();
                            el.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }, 150);
                      }}
                      className="text-[11px] text-rose-700 hover:text-rose-900 hover:underline text-left font-semibold flex items-center space-x-1.5"
                    >
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block"></span>
                      <span>{err.message}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowValidationSummary(false)}
              className="text-rose-455 hover:text-rose-700 text-xs font-bold px-2 py-1 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Sidebar Wizard Layout */}
        <div className="flex flex-1 overflow-hidden min-h-[500px] bg-slate-50">
          <ProductWizardContext.Provider value={contextValue}>
            {/* Left Sidebar Steps Navigation (Shopify style) */}
            <div
              className={`bg-white border-r border-slate-200 flex flex-col py-4 shrink-0 transition-all duration-300 relative ${
                sidebarCollapsed ? "w-16 px-2" : "w-60 px-4"
              } overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Sections Progress
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 mx-auto xl:mx-0 transition"
                  title={
                    sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
                  }
                >
                  {sidebarCollapsed ? (
                    <RiMenuUnfoldLine size={16} />
                  ) : (
                    <RiMenuFoldLine size={16} />
                  )}
                </button>
              </div>

              <nav className="space-y-1">
                {[
                  {
                    id: "basic",
                    label: "Basic Info",
                    step: 1,
                    icon: <RiFileTextLine size={15} />,
                  },
                  {
                    id: "pricing",
                    label: "Pricing & Tax",
                    step: 2,
                    icon: <RiMoneyDollarCircleLine size={15} />,
                  },
                  {
                    id: "category",
                    label: "Hierarchy & Tags",
                    step: 3,
                    icon: <RiLayoutGridLine size={15} />,
                  },
                  {
                    id: "details",
                    label: "Clothing Spec",
                    step: 4,
                    icon: <RiTShirtLine size={15} />,
                  },
                  {
                    id: "visibility",
                    label: "Store Visibility",
                    step: 5,
                    icon: <RiEyeLine size={15} />,
                  },
                  {
                    id: "seo",
                    label: "SEO Settings",
                    step: 6,
                    icon: <RiSearchLine size={15} />,
                  },
                  {
                    id: "media",
                    label: "Media Assets",
                    step: 7,
                    icon: <RiFolderImageLine size={15} />,
                  },
                ].map((tab) => {
                  const tabErrors = validationErrors.filter(
                    (e) => e.tab === tab.id,
                  );
                  const isCompleted = tabErrors.length === 0;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-between text-left w-full px-3 py-2.5 rounded-lg text-xs transition duration-200 border ${
                        isActive
                          ? "bg-amber-50/70 border-amber-200/50 text-[#c5a880] font-semibold shadow-xxs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent"
                      }`}
                      title={tab.label}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span
                          className={`${
                            isActive ? "text-[#c5a880]" : "text-slate-400"
                          } shrink-0`}
                        >
                          {tab.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="truncate">{tab.label}</span>
                        )}
                      </div>

                      {!sidebarCollapsed && (
                        <span className="shrink-0 ml-2">
                          {isCompleted ? (
                            <RiCheckboxCircleFill
                              className="text-emerald-500"
                              size={14}
                            />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Workspace and Live Preview wrapper */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Form Content Canvas */}
              <form
                onSubmit={handleSubmit}
                className="flex-grow overflow-y-auto p-6 space-y-6"
              >
                {activeTab === "basic" && <ProductBasicTab />}
                {activeTab === "category" && <ProductHierarchyTab />}
                {activeTab === "pricing" && <ProductPricingTab />}
                {activeTab === "details" && <ProductDetailsTab />}
                {activeTab === "visibility" && <ProductVisibilityTab />}
                {activeTab === "seo" && <ProductSeoTab />}
                {activeTab === "media" && <ProductMediaTab />}
              </form>

              {/* Right Interactive Product Card Preview */}
              <ProductLivePreview />
            </div>
          </ProductWizardContext.Provider>
        </div>

        {/* Modal Bottom Save button Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-[#FAF9F6] border-t border-slate-200 p-5 shrink-0 gap-3">
          {/* Wizard Step Navigation Controls */}
          <div className="flex space-x-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              disabled={activeTab === "basic"}
              onClick={() => {
                const idx = steps.indexOf(activeTab);
                if (idx > 0) setActiveTab(steps[idx - 1]);
              }}
            >
              &larr; Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={activeTab === "media"}
              onClick={() => {
                const idx = steps.indexOf(activeTab);
                if (idx < steps.length - 1) setActiveTab(steps[idx + 1]);
              }}
              className="text-[#c5a880] border-[#c5a880]/30 hover:bg-[#c5a880]/5"
            >
              Next Step &rarr;
            </Button>
          </div>

          {/* Action Operations Footer Button Layout */}
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={attemptCloseModal}>
              Discard
            </Button>

            {editProduct && (
              <>
                {/* Duplicate action in Edit sheet */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditProduct(null);
                    setForm((prev) => ({
                      ...prev,
                      name: `${prev.name} (Copy)`,
                      sku: `${prev.sku}-COPY-${Math.floor(
                        10 + Math.random() * 90,
                      )}`,
                      status: "draft",
                    }));
                    setIsDirty(true);
                  }}
                >
                  Duplicate Product
                </Button>

                {/* Archive toggle */}
                {form.status !== "archived" && (
                  <button
                    type="button"
                    onClick={() => handleFormAction("archived")}
                    className="bg-purple-55 bg-purple-50 hover:bg-purple-100/50 text-purple-700 text-xs font-semibold py-2.5 px-4 rounded-lg border border-purple-200 transition"
                  >
                    Archive
                  </button>
                )}
              </>
            )}

            {/* Save Draft (Only click if status draft or if new) */}
            {(!editProduct || form.status === "draft") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFormAction("draft")}
              >
                Save Draft
              </Button>
            )}

            {/* Commit/Publish action button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                handleFormAction(editProduct ? form.status : "active")
              }
              className="shadow-sm shadow-[#c5a880]/10 font-bold"
            >
              {editProduct ? "Update Product" : "Publish Product"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductWizardModal;
