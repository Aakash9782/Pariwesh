import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { useSearchParams } from "react-router-dom";
import ProductTable from "../../components/admin/products/ProductTable.jsx";
import ProductWizardModal from "../../components/admin/products/ProductWizardModal.jsx";
import {
  RiAddCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileCopyLine,
  RiFileDownloadLine,
  RiFileUploadLine,
  RiSearchLine,
  RiEyeLine,
  RiFolderImageLine,
  RiArrowUpDownLine,
  RiCloseLine,
  RiShoppingBagLine,
  RiHeartLine,
  RiHeartFill,
  RiFileTextLine,
  RiMoneyDollarCircleLine,
  RiLayoutGridLine,
  RiTShirtLine,
  RiCheckboxCircleLine,
  RiCheckboxCircleFill,
  RiAlertLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiUploadLine,
  RiRefreshLine,
} from "react-icons/ri";

const ProductsPage = () => {
  const { showAlert: alert, showConfirm } = useAlert();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal UI State
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [editProduct, setEditProduct] = useState(null);

  // Refined Wizard Fields & Protections
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [isDirty, setIsDirty] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [manualSlug, setManualSlug] = useState(false);
  const formRef = React.useRef(null);

  // Enterprise additions: validation tracking + progress + layout collapse
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Form Fields State
  const initialFormState = {
    name: "",
    sku: "",
    category: "suits",
    subCategory: "",
    brand: "Pariwesh",
    fabric: "Premium Cotton",
    washCare: "Dry Clean Only",
    colorGroup: "",
    color: "Ivory",
    colorHex: "#F5F5F0",
    sizes: ["M", "L", "XL", "XXL"],
    sizesStock: { M: 10, L: 10, XL: 10, XXL: 10 },
    sizeChart: {
      type: "table",
      imageUrl: "",
      measurements: [],
    },
    mrp: "",
    price: "",
    discount: 0,
    gst: 18,
    hsnCode: "6204",
    material: "Pure Cotton",
    weight: "350g",
    countryOfOrigin: "India",
    shippingWeight: "450g",
    returnDays: 7,
    featured: false,
    trending: false,
    bestSeller: false,
    newArrival: false,
    recommended: false,
    seoTitle: "",
    seoDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    ogImage: "",
    images: [],
    video: "",
    videos: [],
    tag: "Regular",
    description: "",
    status: "active",
    slug: "",
    // New clothing specs
    fit: "",
    pattern: "",
    neckline: "",
    sleeveLength: "",
    occasion: "",
    bottomType: "",
    setContents: [],
  };
  const [form, setForm] = useState(initialFormState);

  // Validation rules engine
  const getValidationErrors = (fields) => {
    const errs = [];
    if (!fields.name || !fields.name.trim()) {
      errs.push({
        field: "name",
        message: "Brand Label Name is required",
        tab: "basic",
      });
    }
    if (!fields.sku || !fields.sku.trim()) {
      errs.push({
        field: "sku",
        message: "Unique Item SKU is required",
        tab: "basic",
      });
    }
    if (!fields.slug || !fields.slug.trim()) {
      errs.push({
        field: "slug",
        message: "SEO URL Slug is required",
        tab: "basic",
      });
    }
    if (fields.mrp === "" || fields.mrp === undefined || fields.mrp === null) {
      errs.push({
        field: "mrp",
        message: "Maximum Retail Price (MRP) is required",
        tab: "pricing",
      });
    } else if (Number(fields.mrp) <= 0) {
      errs.push({
        field: "mrp",
        message: "MRP must be a valid positive number",
        tab: "pricing",
      });
    }
    if (
      fields.price === "" ||
      fields.price === undefined ||
      fields.price === null
    ) {
      errs.push({
        field: "price",
        message: "Calculated Selling Price is required",
        tab: "pricing",
      });
    } else if (Number(fields.price) <= 0) {
      errs.push({
        field: "price",
        message: "Selling Price must be a valid positive number",
        tab: "pricing",
      });
    } else if (Number(fields.price) > Number(fields.mrp)) {
      errs.push({
        field: "price",
        message: "Selling Price cannot exceed MRP",
        tab: "pricing",
      });
    }
    if (!fields.images || fields.images.length === 0) {
      errs.push({
        field: "images",
        message: "At least one product image is required in Media Assets",
        tab: "media",
      });
    }
    if (!fields.category) {
      errs.push({
        field: "category",
        message: "Primary Catalog Group is required",
        tab: "category",
      });
    }
    return errs;
  };

  // Auto validation runner
  useEffect(() => {
    if (showFormModal) {
      setValidationErrors(getValidationErrors(form));
    } else {
      setValidationErrors([]);
      setShowValidationSummary(false);
    }
  }, [form, showFormModal]);

  // LocalStorage Auto-Save & Recovery
  const SAVE_DRAFT_KEY = "pariwesh_draft_product";

  useEffect(() => {
    if (!showFormModal || !isDirty) return;
    const saveTimeout = setTimeout(() => {
      localStorage.setItem(
        SAVE_DRAFT_KEY,
        JSON.stringify({
          editProductId: editProduct ? editProduct._id : null,
          form,
        }),
      );
    }, 2000);
    return () => clearTimeout(saveTimeout);
  }, [form, showFormModal, isDirty, editProduct]);

  useEffect(() => {
    if (showFormModal) {
      const saved = localStorage.getItem(SAVE_DRAFT_KEY);
      if (saved) {
        try {
          const { editProductId, form: savedForm } = JSON.parse(saved);
          const currentEditId = editProduct ? editProduct._id : null;
          if (editProductId === currentEditId) {
            showConfirm(
              "An unsaved local draft was detected. Restore this draft?",
              "Restore Draft",
            ).then((confirmed) => {
              if (confirmed) {
                setForm(savedForm);
                setIsDirty(true);
              } else {
                localStorage.removeItem(SAVE_DRAFT_KEY);
              }
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [showFormModal]);

  // Keyboard Shortcuts (Ctrl + S -> Save Draft, Ctrl + Shift + S -> Publish, Esc -> Confirm Close)
  useEffect(() => {
    if (!showFormModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        attemptCloseModal();
      }
      if (e.ctrlKey && !e.shiftKey && e.key?.toLowerCase() === "s") {
        e.preventDefault();
        handleFormAction("draft");
      }
      if (e.ctrlKey && e.shiftKey && e.key?.toLowerCase() === "s") {
        e.preventDefault();
        handleFormAction(editProduct ? form.status : "active");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFormModal, form, editProduct, isDirty]);

  // Auto-dirty tracking effect
  useEffect(() => {
    if (!showFormModal) {
      setIsDirty(false);
      formRef.current = null;
    } else {
      if (!formRef.current) {
        formRef.current = JSON.stringify(form);
      } else if (JSON.stringify(form) !== formRef.current) {
        setIsDirty(true);
      }
    }
  }, [form, showFormModal]);

  // Tab Exit warning hooks
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Leave this page?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Auto-slug generator hooks
  useEffect(() => {
    if (!manualSlug && !editProduct && form.name) {
      setForm((prev) => ({
        ...prev,
        slug: prev.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
      }));
    }
  }, [form.name, manualSlug, editProduct]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/products");
      if (res.data?.success) {
        setProducts(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading product catalog");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalogMeta = async () => {
    try {
      const [cRes, bRes, colRes] = await Promise.all([
        API.get("/categories?active=true"),
        API.get("/brands?active=true"),
        API.get("/collections"),
      ]);
      if (cRes.data?.success) setCategories(cRes.data.data || []);
      if (bRes.data?.success) setBrands(bRes.data.data || []);
      if (colRes.data?.success) setCollections(colRes.data.data || []);
    } catch (err) {
      console.error("Catalog meta load failed", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCatalogMeta();
  }, []);

  // Detect URL search parameter to edit specific product
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && products.length > 0) {
      const matched = products.find((p) => p._id === editId);
      if (matched) {
        handleEditClick(matched);
      }
    }
  }, [searchParams, products]);

  // Image manipulation helper
  const handleUrlImageAdd = (url) => {
    if (!url.trim()) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, url],
    }));
  };

  // Image input client validations
  const validateImageFile = (file) => {
    const allowedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowedFormats.includes(file.type)) {
      alert(
        `Invalid image format: ${file.name}. Only JPG, JPEG, PNG, WEBP are allowed.`,
      );
      return false;
    }
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB limit
    if (file.size > maxSizeBytes) {
      alert(`File ${file.name} exceeds the 2MB size limit.`);
      return false;
    }
    return true;
  };

  // Base64 file selector helper with validation filter
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(validateImageFile);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Base64 video selector helper with optional index replacement
  const handleVideoFileChange = (e, replaceIndex = -1) => {
    const file = e.target.files[0];
    if (file) {
      const maxSizeBytes = 25 * 1024 * 1024; // 25MB max
      if (file.size > maxSizeBytes) {
        alert("Video exceeds recommended 25MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => {
          let currentVideos = Array.isArray(prev.videos)
            ? [...prev.videos]
            : prev.video
            ? [prev.video]
            : [];
          if (replaceIndex >= 0 && replaceIndex < currentVideos.length) {
            currentVideos[replaceIndex] = reader.result;
          } else {
            currentVideos.push(reader.result);
          }
          return {
            ...prev,
            video: currentVideos[0] || "",
            videos: currentVideos,
          };
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  // Direct video URL add
  const handleUrlVideoAdd = (url) => {
    if (!url || !url.trim()) return;
    const trimmed = url.trim();
    setForm((prev) => {
      const currentVideos = Array.isArray(prev.videos)
        ? [...prev.videos]
        : prev.video
        ? [prev.video]
        : [];
      currentVideos.push(trimmed);
      return {
        ...prev,
        video: currentVideos[0] || "",
        videos: currentVideos,
      };
    });
  };

  // Remove video by index
  const handleVideoRemove = (index) => {
    setForm((prev) => {
      const currentVideos = Array.isArray(prev.videos)
        ? [...prev.videos]
        : prev.video
        ? [prev.video]
        : [];
      const updated = currentVideos.filter((_, i) => i !== index);
      return {
        ...prev,
        video: updated[0] || "",
        videos: updated,
      };
    });
  };

  // MRP and discount pricing synchronization (bi-directional check)
  const syncPrice = (type, val) => {
    const numericVal = Number(val) || 0;
    if (type === "mrp") {
      const discountPct = Number(form.discount) || 0;
      const calculatedSelling = Math.round(
        numericVal - (numericVal * discountPct) / 100,
      );
      setForm((prev) => ({
        ...prev,
        mrp: val,
        price: calculatedSelling,
      }));
    } else if (type === "discount") {
      const mrpValue = Number(form.mrp) || 0;
      const calculatedSelling = Math.round(
        mrpValue - (mrpValue * numericVal) / 100,
      );
      setForm((prev) => ({
        ...prev,
        discount: val,
        price: calculatedSelling,
      }));
    } else if (type === "price") {
      // recalculate discount backward
      const mrpValue = Number(form.mrp) || 0;
      if (mrpValue > 0) {
        const calculatedDiscount = Math.round(
          ((mrpValue - numericVal) / mrpValue) * 100,
        );
        setForm((prev) => ({
          ...prev,
          price: val,
          discount: Math.max(0, calculatedDiscount),
        }));
      } else {
        setForm((prev) => ({ ...prev, price: val }));
      }
    }
  };

  // SKU Automated generation
  const generateSKU = () => {
    const catPrefix = (form.category || "SUIT").substring(0, 4).toUpperCase();
    let uniqueSku = "";
    let isDuplicate = true;
    let attempts = 0;
    while (isDuplicate && attempts < 100) {
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      uniqueSku = `PAR-${catPrefix}-${rand}`;
      isDuplicate = products.some((p) => p.sku === uniqueSku);
      attempts++;
    }
    setForm((prev) => ({ ...prev, sku: uniqueSku }));
  };

  // Status Action Submissions
  const handleFormAction = async (actionType) => {
    const errors = getValidationErrors(form);

    // For draft, only name & SKU are blocking; for active/archived list, everything is blocking.
    const criticalFailed =
      actionType === "draft"
        ? errors.filter((e) => e.field === "name" || e.field === "sku")
        : errors;

    if (criticalFailed.length > 0) {
      setValidationErrors(errors);
      setShowValidationSummary(true);
      alert(`Validation failed: ${criticalFailed[0].message}`);
      setActiveTab(criticalFailed[0].tab);
      setTimeout(() => {
        document.getElementById(`input-${criticalFailed[0].field}`)?.focus();
      }, 150);
      return;
    }

    // Verify SKU duplicate validation (client-side prevention)
    const isSkuDuplicate = products.some(
      (p) => p.sku === form.sku && (!editProduct || p._id !== editProduct._id),
    );
    if (isSkuDuplicate) {
      alert(
        `Duplicate SKU Detected: The SKU '${form.sku}' already exists. Please assign a unique SKU!`,
      );
      return;
    }

    let payload = { ...form };
    if (actionType === "draft") {
      payload.status = "draft";
    } else if (actionType === "active") {
      payload.status = "active";
    } else if (actionType === "archived") {
      payload.status = "archived";
    }

    try {
      if (editProduct) {
        await API.put(`/products/id/${editProduct._id}`, payload);
        alert(
          `Product ${actionType === "archived" ? "archived" : "updated"} in catalog successfully.`,
        );
      } else {
        await API.post("/products", payload);
        alert(
          `New product registered ${actionType === "draft" ? "as Draft " : ""}successfully!`,
        );
      }
      localStorage.removeItem(SAVE_DRAFT_KEY);
      setIsDirty(false);
      setShowFormModal(false);
      setForm(initialFormState);
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to commit product changes");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFormAction(form.status || "active");
  };

  const handleEditClick = (prod) => {
    setEditProduct(prod);
    setForm({
      name: prod.name || "",
      sku: prod.sku || "",
      category: prod.category || "suits",
      subCategory: prod.subCategory || "",
      brand: prod.brand || "Pariwesh",
      fabric: prod.fabric || "Premium Cotton",
      washCare: prod.washCare || "Dry Clean Preferred",
      colorGroup: prod.colorGroup || "",
      color: prod.color || "Ivory",
      colorHex: prod.colorHex || "#F5F5F0",
      sizes: prod.sizes?.filter((s) => s !== "S") || ["M", "L", "XL", "XXL"],
      sizesStock: {
        M: prod.sizesStock?.M ?? 10,
        L: prod.sizesStock?.L ?? 10,
        XL: prod.sizesStock?.XL ?? 10,
        XXL: prod.sizesStock?.XXL ?? 10,
      },
      sizeChart: prod.sizeChart || {
        type: "table",
        imageUrl: "",
        measurements: [],
      },
      mrp: prod.mrp || "",
      price: prod.price || "",
      discount: prod.discount || 0,
      gst: prod.gst !== undefined ? prod.gst : 18,
      hsnCode: prod.hsnCode || "6204",
      material: prod.material || "",
      weight: prod.weight || "",
      countryOfOrigin: prod.countryOfOrigin || "India",
      shippingWeight: prod.shippingWeight || "",
      returnDays: prod.returnDays !== undefined ? prod.returnDays : 7,
      featured: prod.featured || false,
      trending: prod.trending || false,
      bestSeller: prod.bestSeller || false,
      newArrival: prod.newArrival || false,
      recommended: prod.recommended || false,
      seoTitle: prod.seoTitle || "",
      seoDescription: prod.seoDescription || "",
      metaKeywords: prod.metaKeywords || "",
      canonicalUrl: prod.canonicalUrl || "",
      ogImage: prod.ogImage || "",
      images: prod.images || [],
      video: prod.video || (prod.videos && prod.videos[0]) || "",
      videos:
        prod.videos && prod.videos.length > 0
          ? prod.videos
          : prod.video
          ? [prod.video]
          : [],
      tag: prod.tag || "Regular",
      description: prod.description || "",
      status: prod.status || "active",
      slug: prod.slug || "",
      // New clothing specs
      fit: prod.fit || "",
      pattern: prod.pattern || "",
      neckline: prod.neckline || "",
      sleeveLength: prod.sleeveLength || "",
      occasion: prod.occasion || "",
      bottomType: prod.bottomType || "",
      setContents: prod.setContents || [],
    });
    setActiveTab("basic");
    setShowFormModal(true);
  };

  const attemptCloseModal = () => {
    if (isDirty) {
      showConfirm(
        "You have unsaved changes. Are you sure you want to discard your updates?",
        "Discard Changes",
      ).then((confirmed) => {
        if (confirmed) {
          localStorage.removeItem(SAVE_DRAFT_KEY);
          setShowFormModal(false);
          setEditProduct(null);
          setForm(initialFormState);
          setIsDirty(false);
        }
      });
    } else {
      localStorage.removeItem(SAVE_DRAFT_KEY);
      setShowFormModal(false);
      setEditProduct(null);
      setForm(initialFormState);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm(
      `Are you sure you want to write-off ${name} from catalog?`,
      "Delete SKU",
    );
    if (!confirmed) return;
    try {
      await API.delete(`/products/id/${id}`);
      alert("Product removed from index");
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Removal script unsuccessful");
    }
  };

  // Product Duplication Logic
  const handleDuplicate = async (prod) => {
    try {
      const duplicatedData = {
        ...prod,
        name: `${prod.name} (Copy)`,
        sku: `${prod.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`,
        slug: undefined, // pre-save will auto create slug
      };
      delete duplicatedData._id;
      delete duplicatedData.createdAt;
      delete duplicatedData.updatedAt;

      await API.post("/products", duplicatedData);
      alert(`Duplicated: ${prod.name}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate catalog item");
    }
  };

  // BULK ACTIONS
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredProducts.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await showConfirm(
      `Delete ${selectedIds.length} select product(s)?`,
      "Bulk Delete",
    );
    if (!confirmed) return;
    try {
      await Promise.all(
        selectedIds.map((id) => API.delete(`/products/id/${id}`)),
      );
      alert("Bulk delete operations resolved successfully");
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Bulk delete partially failed");
    }
  };

  const executeBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    try {
      // Toggle to regular tags conceptually
      await Promise.all(
        selectedIds.map((id) =>
          API.put(`/products/id/${id}`, { tag: "Featured" }),
        ),
      );
      alert("Bulk updates to Featured status complete");
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // CSV PORTABILITY MODULES (EXPORT/IMPORT SIMULATORS)
  const handleExportCSV = () => {
    const headers = "Name,SKU,Category,MRP,Price,Fabric,WashCare,Color,Stock\n";
    const rows = products
      .map((p) => {
        const totalStock = Object.values(p.sizesStock || {}).reduce(
          (acc, curr) => acc + curr,
          0,
        );
        return `"${p.name}","${p.sku}","${p.category}",${p.mrp},${p.price},"${p.fabric}","${p.washCare}","${p.color}",${totalStock}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `pariwesh_catalog_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    a.click();
    alert("CSV list downloaded successfully");
  };

  const handleImportCSVChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const headers = lines[0].split(","); // Name, SKU, category, mrp, price

        let successCount = 0;
        // Parse CSV items (excluding header row)
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i]
            .split(",")
            .map((c) => c.replace(/"/g, "").trim());
          if (cells.length >= 5) {
            const rowProduct = {
              name: cells[0],
              sku: cells[1] || `SKU-${Date.now()}-${i}`,
              category: ["kurtis", "suits", "ethnic"].includes(
                cells[2]?.toLowerCase(),
              )
                ? cells[2].toLowerCase()
                : "suits",
              mrp: Number(cells[3]) || 1999,
              price: Number(cells[4]) || 1499,
              images: ["/hero.png"],
            };
            await API.post("/products", rowProduct);
            successCount++;
          }
        }
        alert(`Successfully imported ${successCount} clothing records!`);
        fetchProducts();
      } catch (err) {
        console.error(err);
        alert("Parser error: Please audit CSV template headers matching.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans animate-fade-in">
      <ProductTable
        products={products}
        isLoading={isLoading}
        categories={categories}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        handleExportCSV={handleExportCSV}
        handleImportCSVChange={handleImportCSVChange}
        handleEditClick={handleEditClick}
        handleDuplicate={handleDuplicate}
        handleDelete={handleDelete}
        executeBulkPublish={executeBulkPublish}
        executeBulkDelete={executeBulkDelete}
        initialFormState={initialFormState}
        setForm={setForm}
        setActiveTab={setActiveTab}
        setShowFormModal={setShowFormModal}
        setEditProduct={setEditProduct}
      />

      <ProductWizardModal
        showFormModal={showFormModal}
        editProduct={editProduct}
        setEditProduct={setEditProduct}
        form={form}
        setForm={setForm}
        categories={categories}
        brands={brands}
        collections={collections}
        validationErrors={validationErrors}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        manualSlug={manualSlug}
        setManualSlug={setManualSlug}
        generateSKU={generateSKU}
        syncPrice={syncPrice}
        attemptCloseModal={attemptCloseModal}
        handleFormAction={handleFormAction}
        handleSubmit={handleSubmit}
        setIsDirty={setIsDirty}
        validateImageFile={validateImageFile}
        handleImageFileChange={handleImageFileChange}
        handleVideoFileChange={handleVideoFileChange}
        handleUrlVideoAdd={handleUrlVideoAdd}
        handleVideoRemove={handleVideoRemove}
        handleUrlImageAdd={handleUrlImageAdd}
        dragOver={dragOver}
        setDragOver={setDragOver}
        showValidationSummary={showValidationSummary}
        setShowValidationSummary={setShowValidationSummary}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
    </div>
  );
};

export default ProductsPage;
