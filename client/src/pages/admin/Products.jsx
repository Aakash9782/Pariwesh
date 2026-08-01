import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { useSearchParams } from "react-router-dom";
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
} from "react-icons/ri";

const ProductsPage = () => {
  const { showAlert: alert, showConfirm } = useAlert();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal UI State
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [editProduct, setEditProduct] = useState(null);

  // Form Fields State
  const initialFormState = {
    name: "",
    sku: "",
    category: "suits",
    subCategory: "",
    brand: "Pariwesh",
    fabric: "Premium Cotton",
    washCare: "Dry Clean Only",
    color: "Ivory",
    colorHex: "#F5F5F0",
    sizes: ["S", "M", "L", "XL"],
    sizesStock: { S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
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
    tag: "Regular",
    description: "",
  };
  const [form, setForm] = useState(initialFormState);

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
      const [cRes, bRes] = await Promise.all([
        API.get("/categories?active=true"),
        API.get("/brands?active=true"),
      ]);
      if (cRes.data?.success) setCategories(cRes.data.data || []);
      if (bRes.data?.success) setBrands(bRes.data.data || []);
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

  // Base64 file selector helper
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
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

  // Base64 video selector helper
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          video: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // MRP and discount pricing synchronization
  const syncPrice = (type, val) => {
    const mrpValue = type === "mrp" ? Number(val) : Number(form.mrp);
    const discountPct =
      type === "discount" ? Number(val) : Number(form.discount);
    if (mrpValue) {
      const calculatedSelling = Math.round(
        mrpValue - mrpValue * (discountPct / 100),
      );
      setForm((prev) => ({
        ...prev,
        [type]: val,
        price: calculatedSelling,
      }));
    } else {
      setForm((prev) => ({ ...prev, [type]: val }));
    }
  };

  // Form Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.mrp || !form.price) {
      alert(
        "Mandatory basic fields (Name, SKU, MRP, Selling Price) must be compiled!",
      );
      return;
    }

    try {
      if (editProduct) {
        // Update product route in backend
        await API.put(`/products/id/${editProduct._id}`, form);
        alert("Product updated in catalog successfully");
      } else {
        // Create product route in backend
        await API.post("/products", form);
        alert("New product registered successfully!");
      }
      setShowFormModal(false);
      setForm(initialFormState);
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to commit product changes");
    }
  };

  const handleEditClick = (prod) => {
    setEditProduct(prod);
    // Fill form states from existing fields. Add default fallbacks for new enterprise variables.
    setForm({
      name: prod.name || "",
      sku: prod.sku || "",
      category: prod.category || "suits",
      subCategory: prod.subCategory || "",
      brand: prod.brand || "Pariwesh",
      fabric: prod.fabric || "Premium Cotton",
      washCare: prod.washCare || "Dry Clean Preferred",
      color: prod.color || "Ivory",
      colorHex: prod.colorHex || "#F5F5F0",
      sizes: prod.sizes || ["S", "M", "L", "XL"],
      sizesStock: prod.sizesStock || { S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
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
      video: prod.video || "",
      tag: prod.tag || "Regular",
      description: prod.description || "",
    });
    setActiveTab("basic");
    setShowFormModal(true);
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
              images: [
                "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=650",
              ],
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

  // FILTER LOGIC
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCat = catFilter ? p.category === catFilter : true;

    // Price checks
    let matchPrice = true;
    if (priceFilter === "low") matchPrice = p.price < 1500;
    else if (priceFilter === "mid")
      matchPrice = p.price >= 1500 && p.price <= 3000;
    else if (priceFilter === "high") matchPrice = p.price > 3000;

    // Stock checks
    const totalStock = Object.values(p.sizesStock || {}).reduce(
      (acc, c) => acc + c,
      0,
    );
    let matchStock = true;
    if (stockFilter === "low") matchStock = totalStock <= 5 && totalStock > 0;
    else if (stockFilter === "out") matchStock = totalStock === 0;
    else if (stockFilter === "ok") matchStock = totalStock > 5;

    // Status / tags checks
    let matchStatus = true;
    if (statusFilter === "trending")
      matchStatus = p.tag === "Trending" || p.trending;
    else if (statusFilter === "featured")
      matchStatus = p.tag === "Best Seller" || p.featured;

    return matchSearch && matchCat && matchPrice && matchStock && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-wide">
            Enterprise Catalogue
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Real-time control center for inventory models and marketing tags
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* CSV Operations */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2.5 px-4.5 rounded-lg border border-slate-800 transition w-full sm:w-auto"
          >
            <RiFileDownloadLine size={15} />
            <span>Export CSV</span>
          </button>

          <label className="flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2.5 px-4.5 rounded-lg border border-slate-800 cursor-pointer transition w-full sm:w-auto">
            <RiFileUploadLine size={15} />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSVChange}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              setEditProduct(null);
              setForm(initialFormState);
              setActiveTab("basic");
              setShowFormModal(true);
            }}
            className="flex items-center justify-center space-x-2 bg-accent-gold text-slate-950 text-xs font-bold py-2.5 px-5 rounded-lg transition hover:bg-yellow-500 shadow-md shadow-accent-gold/5 w-full sm:w-auto"
          >
            <RiAddCircleLine size={17} />
            <span>Create SKU</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <RiSearchLine
            className="absolute left-3.5 top-3 text-slate-500"
            size={17}
          />
          <input
            type="text"
            placeholder="Search by product name or stock SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-700 font-sans"
          />
        </div>

        {/* Category Filter */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none focus:border-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Price filter */}
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none focus:border-slate-700"
        >
          <option value="all">All Prices</option>
          <option value="low">Under ₹1,500</option>
          <option value="mid">₹1,500 - ₹3,000</option>
          <option value="high">Above ₹3,000</option>
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none focus:border-slate-700"
        >
          <option value="all">Stock Levels</option>
          <option value="low">Low Stock (≤ 5)</option>
          <option value="out">Out of Stock</option>
          <option value="ok">Healthy Store</option>
        </select>

        {/* Status tag filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none focus:border-slate-700"
        >
          <option value="all">All Visibility</option>
          <option value="featured">Best Seller</option>
          <option value="trending">Trending</option>
        </select>
      </div>

      {/* Bulk actions bar if selected */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-950 border border-accent-gold/25 p-4 rounded-lg flex items-center justify-between animate-fade-in">
          <span className="text-xs text-slate-400 font-semibold font-sans">
            Selected{" "}
            <strong className="text-accent-gold font-bold">
              {selectedIds.length}
            </strong>{" "}
            items in database index
          </span>
          <div className="flex space-x-3.5">
            <button
              onClick={executeBulkPublish}
              className="bg-slate-900 border border-slate-800 text-accent-gold text-[10px] font-bold tracking-wider uppercase py-1.5 px-3 rounded hover:bg-slate-800 transition"
            >
              Tag as Featured
            </button>
            <button
              onClick={executeBulkDelete}
              className="bg-rose-950/20 border border-rose-900/60 text-red-400 text-[10px] font-bold tracking-wider uppercase py-1.5 px-3 rounded hover:bg-rose-900/30 transition"
            >
              Bulk Delete
            </button>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto shadow-2xl">
        {isLoading ? (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
              <tr>
                <th className="py-4.5 px-5 text-left">
                  <Skeleton className="h-4 w-4" />
                </th>
                <th className="py-4.5 px-5">Preview</th>
                <th className="py-4.5 px-5">Product SKU Details</th>
                <th className="py-4.5 px-5">Category</th>
                <th className="py-4.5 px-5 text-right">MRP (Base)</th>
                <th className="py-4.5 px-5 text-right">Sell Price</th>
                <th className="py-4.5 px-5 text-center">Remaining Stock</th>
                <th className="py-4.5 px-5 text-center">Featured Status</th>
                <th className="py-4.5 px-5 text-center font-mono">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/40">
                  <td className="py-4.5 px-5 text-left">
                    <Skeleton className="h-4 w-4" />
                  </td>
                  <td className="py-4.5 px-5">
                    <Skeleton className="w-10 h-12 rounded" />
                  </td>
                  <td className="py-4.5 px-5 space-y-1.5">
                    <Skeleton className="h-4.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="py-4.5 px-5">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="py-4.5 px-5 text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4 w-14 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <Skeleton className="h-6.5 w-8" />
                      <Skeleton className="h-6.5 w-8" />
                      <Skeleton className="h-6.5 w-8" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-500 italic text-xs">
            No matching products found matching criteria
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
              <tr>
                <th className="py-4.5 px-5">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredProducts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="cursor-pointer"
                  />
                </th>
                <th className="py-4.5 px-5">Preview</th>
                <th className="py-4.5 px-5">Product SKU Details</th>
                <th className="py-4.5 px-5">Category</th>
                <th className="py-4.5 px-5">Fabric Info</th>
                <th className="py-4.5 text-right px-5">Pricing</th>
                <th className="py-4.5 text-center px-5">Stock Levels</th>
                <th className="py-4.5 text-center px-5 flex items-center space-x-1.5">
                  Action Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p, idx) => {
                const totalStock = Object.values(p.sizesStock || {}).reduce(
                  (acc, val) => acc + val,
                  0,
                );
                const isSelected = selectedIds.includes(p._id);
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-900/40 transition-colors ${isSelected ? "bg-slate-900/20" : ""}`}
                  >
                    <td className="py-4 px-5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          handleSelectOne(p._id, e.target.checked)
                        }
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-5">
                      {p.images && p.images[0] ? (
                        <div className="relative group cursor-zoom-in">
                          <img
                            src={p.images[0]}
                            className="w-12 h-14 object-cover rounded border border-slate-850 group-hover:scale-110 transition"
                            alt=""
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-[6px] text-center hidden group-hover:block uppercase text-accent-gold">
                            zoom
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-14 bg-slate-900 rounded border flex items-center justify-center text-slate-600">
                          <RiFolderImageLine size={16} />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5 space-y-1">
                      <p className="font-semibold text-slate-200 text-sm tracking-tight">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                        {p.sku}
                      </p>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-350 capitalize font-mono text-[11px]">
                      {p.category}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-400 text-[10px]">
                      {p.fabric || "Cotton"}
                    </td>
                    <td className="py-4 text-right px-5 font-bold space-y-0.5 font-sans">
                      <p className="text-slate-200">₹{p.price}</p>
                      <p className="text-[10px] text-slate-500 line-through">
                        ₹{p.mrp}
                      </p>
                    </td>
                    <td className="py-4 text-center px-5 font-mono">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          totalStock === 0
                            ? "bg-red-500/10 text-red-400"
                            : totalStock <= 5
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {totalStock} Units
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-1 justify-center">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-2 text-slate-400 hover:text-accent-gold transition-colors"
                        >
                          <RiEditLine size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-2 text-slate-400 hover:text-accent-gold transition-colors"
                          title="Duplicate Product"
                        >
                          <RiFileCopyLine size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Advanced Enterprise Product Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Title Banner */}
            <div className="flex justify-between items-center bg-slate-950 border-b border-slate-800 p-5 shrink-0">
              <div>
                <h3 className="font-display font-medium text-lg text-white">
                  {editProduct
                    ? `Refining SKU Details: ${editProduct.sku}`
                    : "Enterprises Catalogue Enrollment"}
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Specify detailed properties layout mapping directly into the
                  search indexes
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFormModal(false);
                  setEditProduct(null);
                  setForm(initialFormState);
                }}
                className="text-slate-400 hover:text-accent-gold p-1"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex overflow-x-auto bg-slate-950/40 border-b border-slate-850 px-4 shrink-0">
              {[
                { id: "basic", label: "Basic Info" },
                { id: "category", label: "Hierarchy & Tags" },
                { id: "pricing", label: "Pricing & Tax" },
                { id: "details", label: "Clothing Spec Sheet" },
                { id: "visibility", label: "Search tags Visibility" },
                { id: "seo", label: "Meta SEO configs" },
                { id: "media", label: "Media Assets" },
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs font-semibold py-3.5 px-4 uppercase tracking-wider relative border-b-2 whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "border-accent-gold text-accent-gold font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form Content Canvas */}
            <form
              onSubmit={handleSubmit}
              className="flex-grow overflow-y-auto p-6 space-y-6"
            >
              {/* TAB 1: BASIC INFO */}
              {activeTab === "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                  <div className="space-y-1.5Col">
                    <label className="text-slate-400 text-xs font-semibold">
                      Brand Label Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Elysian Gold Chanderi Suit"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-400 text-xs font-semibold">
                      Unique Item SKU *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PAR-CHN-001"
                      value={form.sku}
                      onChange={(e) =>
                        setForm({ ...form, sku: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700 font-mono uppercase"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Short Sub-heading Description
                    </label>
                    <input
                      type="text"
                      placeholder="Catchy sentence summing up key features..."
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Long Form Details (Fabric Details & Sizing Advice)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Long catalog text displaying fabric linings, custom work stitching details, trousers details, wedding festive instructions..."
                      value={form.fabric}
                      onChange={(e) =>
                        setForm({ ...form, fabric: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: HIERARCHY & TAGS */}
              {activeTab === "category" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold font-sans">
                      Primary Catalog Group *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-slate-750"
                    >
                      {categories.length === 0 && (
                        <option value="suits">Suits</option>
                      )}
                      {categories.map((c) => (
                        <option key={c._id} value={c.slug}>
                          {c.name}
                          {c.description ? ` — ${c.description}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Sub-Category Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Anarkali Suit Set, A-Line Kurta"
                      value={form.subCategory}
                      onChange={(e) =>
                        setForm({ ...form, subCategory: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <label className="text-slate-400 text-xs font-semibold">
                      Brand Designation
                    </label>
                    <select
                      value={form.brand}
                      onChange={(e) =>
                        setForm({ ...form, brand: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    >
                      {brands.length === 0 && (
                        <option value="Pariwesh">Pariwesh</option>
                      )}
                      {brands.map((b) => (
                        <option key={b._id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Search Keywords / Tags
                    </label>
                    <input
                      type="text"
                      placeholder="comma block e.g. handblock, indigo, wedding, rayon"
                      value={form.tag}
                      onChange={(e) =>
                        setForm({ ...form, tag: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING & TAX */}
              {activeTab === "pricing" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Maximum Retail Price (MRP) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="4999"
                      value={form.mrp}
                      onChange={(e) => syncPrice("mrp", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Discount Percent (%)
                    </label>
                    <input
                      type="number"
                      placeholder="15"
                      value={form.discount}
                      onChange={(e) => syncPrice("discount", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Calculated Selling Price (Calculated automatically)
                    </label>
                    <input
                      type="number"
                      readOnly
                      placeholder="Price in INR text"
                      value={form.price}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-accent-gold font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold font-sans">
                      GST Rate Applicable (%)
                    </label>
                    <input
                      type="number"
                      placeholder="12"
                      value={form.gst}
                      onChange={(e) =>
                        setForm({ ...form, gst: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      HSN Export Custom Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 62044220"
                      value={form.hsnCode}
                      onChange={(e) =>
                        setForm({ ...form, hsnCode: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: SPEC SHEET */}
              {activeTab === "details" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Fabric Weight
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 380 grams/sqm"
                      value={form.weight}
                      onChange={(e) =>
                        setForm({ ...form, weight: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold font-sans">
                      Wash Care instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cold dry clean preferred, low steam iron"
                      value={form.washCare}
                      onChange={(e) =>
                        setForm({ ...form, washCare: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Material composition
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 80% linen, 20% threads cotton"
                      value={form.material}
                      onChange={(e) =>
                        setForm({ ...form, material: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <label className="text-slate-400 text-xs font-semibold">
                      Shipping Weight
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 480g"
                      value={form.shippingWeight}
                      onChange={(e) =>
                        setForm({ ...form, shippingWeight: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      placeholder="India"
                      value={form.countryOfOrigin}
                      onChange={(e) =>
                        setForm({ ...form, countryOfOrigin: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Return Allowance Period (Days)
                    </label>
                    <input
                      type="number"
                      placeholder="7"
                      value={form.returnDays}
                      onChange={(e) =>
                        setForm({ ...form, returnDays: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: VISIBILITY CHECKMARKS */}
              {activeTab === "visibility" && (
                <div className="bg-slate-900/40 p-6 border border-slate-850 rounded-lg space-y-6">
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 border-b border-slate-800 pb-3">
                    Homepage section filters placement
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "featured",
                        label: "Place inside Hero Showcase (Featured)",
                        desc: "Highlight prominently inside website's primary layout slider",
                      },
                      {
                        id: "trending",
                        label: "Vibe matches Trending Styles",
                        desc: "Inject inside the curated split timers promotion screens",
                      },
                      {
                        id: "bestSeller",
                        label: "Folk choice Best Seller badge",
                        desc: "Attaches a 'Best Seller' discount tag badge over card UI preview",
                      },
                      {
                        id: "newArrival",
                        label: "Include in New Arrivals scroll",
                        desc: "Shows item above recent design logs for customer collection grid",
                      },
                      {
                        id: "recommended",
                        label: "Recommend for matches suits suggestion",
                        desc: "Show below product item detail pages suggestions drawer block",
                      },
                    ].map((badge, idx) => (
                      <label
                        key={idx}
                        className="flex items-start space-x-3.5 bg-slate-950 p-4 rounded-lg border border-slate-850 cursor-pointer hover:border-slate-700 transition"
                      >
                        <input
                          type="checkbox"
                          checked={form[badge.id]}
                          onChange={(e) =>
                            setForm({ ...form, [badge.id]: e.target.checked })
                          }
                          className="mt-1 shrink-0 rounded text-accent-gold focus:ring-accent-gold"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {badge.label}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {badge.desc}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Size Stock Management inside Visibility tab */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                      Available size stocks
                    </h4>
                    <div className="grid grid-cols-5 gap-3.5">
                      {["S", "M", "L", "XL", "XXL"].map((sz, idx) => (
                        <div key={idx} className="space-y-1.5 font-sans">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Size {sz} Items
                          </label>
                          <input
                            type="number"
                            value={form.sizesStock[sz] || 0}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                sizesStock: {
                                  ...form.sizesStock,
                                  [sz]: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-center text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: META SEO */}
              {activeTab === "seo" && (
                <div className="grid grid-cols-1 gap-5.5">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-400 text-xs font-semibold">
                      Meta SEO Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Elysian Gold Suit Set - Shop Online | Pariwesh Boutique"
                      value={form.seoTitle}
                      onChange={(e) =>
                        setForm({ ...form, seoTitle: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Meta SEO details description
                    </label>
                    <textarea
                      rows={2.5}
                      placeholder="Bespoke linen garments designed for weddings..."
                      value={form.seoDescription}
                      onChange={(e) =>
                        setForm({ ...form, seoDescription: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">
                      Meta keywords (Comma grouped)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. chanderi, suit set, luxury apparel, ethnic gown"
                      value={form.metaKeywords}
                      onChange={(e) =>
                        setForm({ ...form, metaKeywords: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold font-sans">
                      Canonical URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://pariwesh.co/product/elysian-gold-chanderi"
                      value={form.canonicalUrl}
                      onChange={(e) =>
                        setForm({ ...form, canonicalUrl: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 7: MEDIA ASSETS */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  {/* File Selector slots */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-dashed border-slate-800 p-5 rounded-lg text-center flex flex-col justify-center items-center space-y-3 bg-slate-950">
                      <RiFolderImageLine className="text-slate-500" size={32} />
                      <div>
                        <p className="text-xs font-bold text-slate-300">
                          Drag & Drop product pictures
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Accepts multiple PNG, JPG, or base64 structures
                        </p>
                      </div>
                      <label className="bg-slate-900 hover:bg-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-accent-gold py-2 px-4 rounded border border-slate-750 cursor-pointer">
                        Select files
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Media Video upload */}
                    <div className="border border-dashed border-slate-800 p-5 rounded-lg text-center flex flex-col justify-center items-center space-y-3 bg-slate-950">
                      <RiFolderImageLine className="text-slate-500" size={32} />
                      <div>
                        <p className="text-xs font-bold text-slate-300">
                          Upload Short Reel Promo Video
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Max 15 seconds short vertical video
                        </p>
                      </div>
                      <label className="bg-slate-900 hover:bg-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-accent-gold py-2 px-4 rounded border border-slate-750 cursor-pointer">
                        Upload Video
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileChange}
                          className="hidden"
                        />
                      </label>
                      {form.video && (
                        <p className="text-[9px] text-emerald-400 font-mono font-semibold">
                          Video Attached (Ready to save)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add URL field fallback */}
                  <div className="space-y-2">
                    <label className="text-slate-400 text-xs font-semibold">
                      Or add Image URL directly
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/your-image-address"
                        id="direct-image-url"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el =
                            document.getElementById("direct-image-url");
                          if (el) {
                            handleUrlImageAdd(el.value);
                            el.value = "";
                          }
                        }}
                        className="bg-accent-gold text-slate-950 text-xs font-bold px-4 rounded hover:bg-yellow-500"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Uploaded Images slots list preview */}
                  {form.images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400">
                        Enrolled pictures ({form.images.length})
                      </p>
                      <div className="grid grid-cols-5 gap-3.5">
                        {form.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900 aspect-[3/4]"
                          >
                            <img
                              src={img}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  images: prev.images.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }));
                              }}
                              className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                              <RiCloseLine size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Modal Bottom Save button Bar */}
            <div className="flex justify-between items-center bg-slate-950 border-t border-slate-800 p-5 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">
                Changes sync automatically with indexing engines
              </span>
              <div className="flex space-x-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
                    setEditProduct(null);
                    setForm(initialFormState);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-350 text-xs font-semibold py-2 px-5.5 rounded-lg border border-slate-800 transition"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-accent-gold text-slate-950 text-xs font-bold py-2.5 px-6.5 rounded-lg transition hover:bg-yellow-500 shadow-md shadow-accent-gold/5"
                >
                  Commit Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
