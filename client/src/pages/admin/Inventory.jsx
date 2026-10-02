import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary.js";
import {
  RiSearchLine,
  RiRefreshLine,
  RiSaveLine,
  RiCloseLine,
  RiAlertLine,
  RiCheckDoubleLine,
  RiArchiveLine,
  RiMoneyDollarCircleLine,
  RiErrorWarningLine,
  RiDownload2Line,
  RiExternalLinkLine,
  RiAddLine,
  RiSubtractLine,
} from "react-icons/ri";

const InventoryPage = () => {
  const navigate = useNavigate();
  const { showAlert: alert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [fabricFilter, setFabricFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState(
    searchParams.get("status") || "all",
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editStockState, setEditStockState] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status !== null) {
      setStockStatusFilter(status);
    }
  }, [searchParams]);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/products");
      if (res.data?.success) {
        setProducts(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync inventory ledger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Compute live warehouse KPI summary metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalValuation = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let healthyCount = 0;

    products.forEach((p) => {
      const units = Object.values(p.sizesStock || {}).reduce(
        (acc, curr) => acc + (Number(curr) || 0),
        0,
      );
      const price = Number(p.price) || 0;
      totalUnits += units;
      totalValuation += units * price;

      const sizes =
        p.sizes && p.sizes.length > 0 ? p.sizes : ["M", "L", "XL", "XXL"];
      const hasDeficitSize = sizes.some(
        (sz) => (Number(p.sizesStock?.[sz]) || 0) <= 2,
      );

      if (units === 0) {
        outOfStockCount++;
      } else if (units <= 5 || hasDeficitSize) {
        lowStockCount++;
      } else {
        healthyCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalUnits,
      totalValuation,
      outOfStockCount,
      lowStockCount,
      healthyCount,
    };
  }, [products]);

  // Extract dynamic categories from products list
  const dynamicCategories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && typeof p.category === "string") {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Handle inline stock edit trigger
  const handleEditStockInit = (prod) => {
    setEditingId(prod._id);
    const initial = {};
    const sizes =
      prod.sizes && prod.sizes.length > 0
        ? prod.sizes
        : ["M", "L", "XL", "XXL"];
    sizes.forEach((sz) => {
      initial[sz] = Number(prod.sizesStock?.[sz]) || 0;
    });
    setEditStockState(initial);
  };

  const handleStockValueChange = (size, val) => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setEditStockState((prev) => ({
      ...prev,
      [size]: parsed,
    }));
  };

  const handleQuickIncrement = (size, delta) => {
    setEditStockState((prev) => ({
      ...prev,
      [size]: Math.max(0, (Number(prev[size]) || 0) + delta),
    }));
  };

  const handleSaveStock = async (prodId) => {
    try {
      setIsSaving(true);
      const total = Object.values(editStockState).reduce(
        (acc, curr) => acc + (Number(curr) || 0),
        0,
      );
      const res = await API.put(`/products/id/${prodId}`, {
        sizesStock: editStockState,
        stock: total,
      });
      if (res.data?.success) {
        alert("Stock levels updated successfully!");
        setEditingId(null);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to adjust stock levels");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to detect size shortages
  const getSizeShortages = (prod) => {
    const sizes =
      prod.sizes && prod.sizes.length > 0
        ? prod.sizes
        : ["M", "L", "XL", "XXL"];
    const outSizes = [];
    const lowSizes = [];

    sizes.forEach((sz) => {
      const q = Number(prod.sizesStock?.[sz]) || 0;
      if (q === 0) outSizes.push(sz);
      else if (q <= 2) lowSizes.push(sz);
    });

    return { outSizes, lowSizes };
  };

  // Filter products cleanly
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query);

      const matchCat = !catFilter
        ? true
        : p.category?.toLowerCase() === catFilter.toLowerCase();

      const matchFabric = !fabricFilter
        ? true
        : p.fabric?.toLowerCase().includes(fabricFilter.toLowerCase().trim());

      const totalStock = Object.values(p.sizesStock || {}).reduce(
        (acc, c) => acc + (Number(c) || 0),
        0,
      );

      const sizes =
        p.sizes && p.sizes.length > 0 ? p.sizes : ["M", "L", "XL", "XXL"];
      const hasDeficitSize = sizes.some(
        (sz) => (Number(p.sizesStock?.[sz]) || 0) <= 2,
      );

      let matchStatus = true;
      if (stockStatusFilter === "out") {
        matchStatus = totalStock === 0;
      } else if (stockStatusFilter === "low") {
        matchStatus = (totalStock <= 5 && totalStock > 0) || (totalStock > 0 && hasDeficitSize);
      } else if (stockStatusFilter === "ok") {
        matchStatus = totalStock > 5 && !hasDeficitSize;
      }

      return matchSearch && matchCat && matchFabric && matchStatus;
    });
  }, [products, searchTerm, catFilter, fabricFilter, stockStatusFilter]);

  // Export Inventory CSV
  const handleExportCSV = () => {
    if (products.length === 0) {
      alert("No inventory records to export");
      return;
    }

    const headers = [
      "SKU",
      "Product Name",
      "Category",
      "Fabric",
      "Unit Price (INR)",
      "Sizes Stock Breakdown",
      "Total Units",
      "Inventory Value (INR)",
      "Stock Status",
    ];

    const rows = filteredProducts.map((p) => {
      const totalStock = Object.values(p.sizesStock || {}).reduce(
        (acc, c) => acc + (Number(c) || 0),
        0,
      );
      const stockBreakdown = Object.entries(p.sizesStock || {})
        .map(([sz, q]) => `${sz}:${q}`)
        .join(" | ");

      const status =
        totalStock === 0
          ? "OUT_OF_STOCK"
          : totalStock <= 5
          ? "LOW_STOCK"
          : "IN_STOCK";

      return [
        `"${p.sku || ""}"`,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${p.category || ""}"`,
        `"${p.fabric || ""}"`,
        p.price || 0,
        `"${stockBreakdown}"`,
        totalStock,
        (totalStock * (Number(p.price) || 0)).toFixed(2),
        status,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `pariwesh-inventory-ledger-${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination slices
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleStatusFilterClick = (statusKey) => {
    setStockStatusFilter(statusKey);
    setSearchParams({ status: statusKey });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Controls"
        subtitle="Manage live garment size stock levels, monitor warehouse asset valuation, and track size shortages"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Inventory" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
              onClick={handleExportCSV}
              title="Download filtered inventory sheet"
            >
              <RiDownload2Line size={15} className="text-[#8a1c14]" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
              onClick={fetchInventory}
            >
              <RiRefreshLine
                size={15}
                className={isLoading ? "animate-spin text-[#c5a880]" : ""}
              />
              <span>Refresh Stock</span>
            </Button>
          </div>
        }
      />

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Units */}
        <Card
          className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer"
          onClick={() => handleStatusFilterClick("all")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
              Total Stocked Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <RiArchiveLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight font-mono">
              {isLoading ? "—" : metrics.totalUnits.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Across {metrics.totalProducts} design catalog styles
            </p>
          </div>
        </Card>

        {/* Card 2: Inventory Valuation */}
        <Card className="p-4 flex flex-col justify-between space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
              Stock Valuation
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <RiMoneyDollarCircleLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
              ₹{isLoading ? "—" : metrics.totalValuation.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              Live retail asset evaluation
            </p>
          </div>
        </Card>

        {/* Card 3: Low Stock Alerts */}
        <Card
          className={`p-4 flex flex-col justify-between space-y-2 border shadow-2xs hover:shadow-xs transition cursor-pointer ${
            stockStatusFilter === "low"
              ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200"
          }`}
          onClick={() => handleStatusFilterClick("low")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-amber-700">
              Low Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <RiAlertLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-amber-900 tracking-tight font-mono">
              {isLoading ? "—" : metrics.lowStockCount}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              ≤ 5 pcs or specific sizes running out
            </p>
          </div>
        </Card>

        {/* Card 4: Out of Stock */}
        <Card
          className={`p-4 flex flex-col justify-between space-y-2 border shadow-2xs hover:shadow-xs transition cursor-pointer ${
            stockStatusFilter === "out"
              ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white border-slate-200"
          }`}
          onClick={() => handleStatusFilterClick("out")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-rose-700">
              Out of Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <RiErrorWarningLine size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-extrabold text-rose-900 tracking-tight font-mono">
              {isLoading ? "—" : metrics.outOfStockCount}
            </p>
            <p className="text-[10px] text-rose-600 font-medium mt-0.5">
              {metrics.outOfStockCount === 0
                ? "Zero stockouts (All active)"
                : "Requires immediate re-order"}
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 space-y-3 bg-white border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <RiSearchLine
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search SKUs, product names..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
            />
          </div>

          {/* Dynamic Category Selector */}
          <select
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition cursor-pointer"
          >
            <option value="">All Categories ({dynamicCategories.length})</option>
            {dynamicCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Fabric Type Search */}
          <input
            type="text"
            placeholder="Filter fabric (e.g. Cotton, Silk)..."
            value={fabricFilter}
            onChange={(e) => {
              setFabricFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          />

          {/* Threshold Level Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => handleStatusFilterClick(e.target.value)}
            className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition cursor-pointer font-medium"
          >
            <option value="all">All Inventory Levels</option>
            <option value="low">Low Stock / Shortages</option>
            <option value="out">Out of Stock (0 units)</option>
            <option value="ok">Healthy Levels (5+ units)</option>
          </select>
        </div>
      </Card>

      {/* Main Inventory Ledger Table */}
      <Card className="overflow-hidden border-slate-200 shadow-2xs bg-white">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[950px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Garment Preview</th>
                <th className="py-3.5 px-5">Product Details & SKU</th>
                <th className="py-3.5 px-5">Category & Price</th>
                <th className="py-3.5 text-center px-5">
                  Sizes Stock Ledger Breakdown
                </th>
                <th className="py-3.5 text-center px-5">Total Units</th>
                <th className="py-3.5 text-center px-5">Status & Shortages</th>
                <th className="py-3.5 text-center px-5">Adjust Inline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="w-10 h-12 rounded" />
                    </td>
                    <td className="py-4 px-5 space-y-1.5">
                      <SkeletonLoader className="h-4 w-40" />
                      <SkeletonLoader className="h-3 w-24" />
                    </td>
                    <td className="py-4 px-5 space-y-1">
                      <SkeletonLoader className="h-3.5 w-16" />
                      <SkeletonLoader className="h-3 w-12" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-center space-x-2">
                        <SkeletonLoader className="h-6 w-10 rounded" />
                        <SkeletonLoader className="h-6 w-10 rounded" />
                        <SkeletonLoader className="h-6 w-10 rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-12 mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-5 w-16 mx-auto rounded" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-7 w-20 mx-auto rounded" />
                    </td>
                  </tr>
                ))
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-slate-400 italic"
                  >
                    No matching inventory garments found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const totalStock = Object.values(p.sizesStock || {}).reduce(
                    (acc, curr) => acc + (Number(curr) || 0),
                    0,
                  );
                  const isEditing = editingId === p._id;
                  const sizes =
                    p.sizes && p.sizes.length > 0
                      ? p.sizes
                      : ["M", "L", "XL", "XXL"];
                  const { outSizes, lowSizes } = getSizeShortages(p);

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3 px-5">
                        <div
                          onClick={() =>
                            navigate(
                              `/admin/products?search=${encodeURIComponent(
                                p.sku || p.name,
                              )}`,
                            )
                          }
                          className="w-10 h-13 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:opacity-90 transition shrink-0"
                          title="Click to view in Products catalog"
                        >
                          {p.images && p.images[0] ? (
                            <img
                              src={optimizeCloudinaryUrl(p.images[0], 100)}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-mono">
                              Attire
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-3 px-5 max-w-[280px]">
                        <p
                          onClick={() =>
                            navigate(
                              `/admin/products?search=${encodeURIComponent(
                                p.sku || p.name,
                              )}`,
                            )
                          }
                          className="font-bold text-slate-900 text-xs truncate hover:text-[#8a1c14] cursor-pointer transition flex items-center gap-1"
                        >
                          <span>{p.name}</span>
                          <RiExternalLinkLine
                            size={11}
                            className="opacity-0 group-hover:opacity-100 transition shrink-0 text-slate-400"
                          />
                        </p>
                        <p className="text-[10.5px] text-slate-400 font-mono tracking-wide mt-0.5 truncate">
                          SKU: {p.sku || "PRW-ATELIER"}
                        </p>
                      </td>

                      {/* Category & Price */}
                      <td className="py-3 px-5">
                        <span className="font-semibold text-slate-700 capitalize text-xs block">
                          {p.category || "Unassigned"}
                        </span>
                        <span className="text-[11px] font-serif font-bold text-[#8a1c14]">
                          ₹{(Number(p.price) || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Sizes Stock Breakdown */}
                      <td className="py-3 px-5 text-center">
                        {isEditing ? (
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {sizes.map((sz) => {
                              const currentVal =
                                editStockState[sz] !== undefined
                                  ? editStockState[sz]
                                  : 0;
                              return (
                                <div
                                  key={sz}
                                  className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg flex flex-col items-center shadow-2xs"
                                >
                                  <span className="text-[9.5px] font-extrabold uppercase text-slate-500 font-mono">
                                    {sz}
                                  </span>
                                  <div className="flex items-center gap-0.5 mt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickIncrement(sz, -1)
                                      }
                                      className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                      <RiSubtractLine size={10} />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={currentVal}
                                      onChange={(e) =>
                                        handleStockValueChange(
                                          sz,
                                          e.target.value,
                                        )
                                      }
                                      className="w-10 bg-white border border-slate-200 text-slate-900 rounded py-0.5 text-center font-mono text-xs font-bold focus:outline-[#8a1c14]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickIncrement(sz, 1)
                                      }
                                      className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                      <RiAddLine size={10} />
                                    </button>
                                  </div>

                                  {/* Quick batch buttons */}
                                  <div className="flex gap-1 mt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickIncrement(sz, 5)
                                      }
                                      className="text-[9px] px-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                      +5
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickIncrement(sz, 10)
                                      }
                                      className="text-[9px] px-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                      +10
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {sizes.map((sz) => {
                              const qty = Number(p.sizesStock?.[sz]) || 0;
                              return (
                                <span
                                  key={sz}
                                  className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono border ${
                                    qty === 0
                                      ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                                      : qty <= 2
                                      ? "bg-amber-50 border-amber-200 text-amber-800 font-semibold"
                                      : "bg-slate-50 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <strong className="text-slate-400 font-sans text-[9px] uppercase">
                                    {sz}:
                                  </strong>
                                  <span>{qty}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Total Units */}
                      <td className="py-3 text-center px-5 font-mono text-xs text-slate-900 font-bold">
                        {isEditing ? (
                          <span className="text-[#8a1c14] font-extrabold">
                            {Object.values(editStockState).reduce(
                              (acc, curr) => acc + (Number(curr) || 0),
                              0,
                            )}{" "}
                            Units
                          </span>
                        ) : (
                          <span>{totalStock} Units</span>
                        )}
                      </td>

                      {/* Status Flag & Shortages */}
                      <td className="py-3 text-center px-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide inline-block ${
                            totalStock === 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : totalStock <= 5
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : outSizes.length > 0
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {totalStock === 0
                            ? "Out of Stock"
                            : totalStock <= 5
                            ? "Low Stock"
                            : outSizes.length > 0
                            ? "Size Deficit"
                            : "Healthy Stock"}
                        </span>

                        {/* Size shortages detail pills */}
                        {outSizes.length > 0 && totalStock > 0 ? (
                          <p className="text-[9.5px] text-rose-600 font-bold mt-1 font-mono">
                            Out: {outSizes.join(", ")}
                          </p>
                        ) : lowSizes.length > 0 && totalStock > 0 ? (
                          <p className="text-[9.5px] text-amber-700 font-medium mt-1 font-mono">
                            Low on: {lowSizes.join(", ")}
                          </p>
                        ) : null}
                      </td>

                      {/* Adjust Actions */}
                      <td className="py-3 text-center px-5 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <Button
                              onClick={() => handleSaveStock(p._id)}
                              disabled={isSaving}
                              size="sm"
                              className="text-[10px] py-1 px-3 bg-[#8a1c14] hover:bg-[#701610] text-white flex items-center space-x-1 font-bold shadow-2xs cursor-pointer"
                            >
                              <RiSaveLine size={13} />
                              <span>{isSaving ? "Saving..." : "Save"}</span>
                            </Button>
                            <Button
                              onClick={() => setEditingId(null)}
                              disabled={isSaving}
                              variant="outline"
                              size="sm"
                              className="text-[10px] py-1 px-2 border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleEditStockInit(p)}
                            variant="outline"
                            size="sm"
                            className="text-[10.5px] py-1 px-3 border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 font-semibold cursor-pointer shadow-2xs"
                          >
                            Adjust Stock
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
              {filteredProducts.length} items
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="text-xs py-1.5 px-3"
              >
                Prev
              </Button>
              <span className="flex items-center px-2 text-xs font-mono font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="text-xs py-1.5 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InventoryPage;
