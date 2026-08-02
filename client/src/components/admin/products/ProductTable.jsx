import React, { useState, useEffect } from "react";
import SkeletonLoader from "../ui/SkeletonLoader.jsx";
import PageHeader from "../ui/PageHeader.jsx";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import StatusPill from "../ui/StatusPill.jsx";
import Pagination from "../ui/Pagination.jsx";
import {
  RiFileDownloadLine,
  RiFileUploadLine,
  RiAddCircleLine,
  RiFolderImageLine,
  RiEditLine,
  RiFileCopyLine,
  RiDeleteBinLine,
} from "react-icons/ri";

const ProductTable = ({
  products,
  isLoading,
  categories,
  selectedIds,
  setSelectedIds,
  handleExportCSV,
  handleImportCSVChange,
  handleEditClick,
  handleDuplicate,
  handleDelete,
  executeBulkPublish,
  executeBulkDelete,
  initialFormState,
  setForm,
  setActiveTab,
  setShowFormModal,
  setEditProduct,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // default to 10

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, catFilter, priceFilter, stockFilter, statusFilter]);

  // Filter Logic
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

  // Calculate Pagination values
  const totalItems = filteredProducts.length;
  const pageSize =
    itemsPerPage === "all" ? totalItems || 1 : Number(itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedProducts = filteredProducts.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

  // Table selections (Page-wise selection)
  const handleSelectAll = (checked) => {
    if (checked) {
      const pageIds = paginatedProducts.map((p) => p._id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedProducts.map((p) => p._id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <PageHeader
        title="Premium Catalogue"
        subtitle="Real-time management center for inventory models and marketing status"
        actions={
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* CSV Operations */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <RiFileDownloadLine size={15} />
              <span>Export CSV</span>
            </Button>

            <label className="flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-4.5 rounded-lg border border-slate-205 cursor-pointer transition shadow-xxs hover:shadow-xs w-full sm:w-auto">
              <RiFileUploadLine size={15} />
              <span>Import CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSVChange}
                className="hidden"
              />
            </label>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditProduct(null);
                setForm(initialFormState);
                setActiveTab("basic");
                setShowFormModal(true);
              }}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto shadow-sm shadow-[#c5a880]/15"
            >
              <RiAddCircleLine size={16} />
              <span>Create SKU</span>
            </Button>
          </div>
        }
      />

      {/* Advanced Filter Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <Input
            type="text"
            placeholder="Search by name or sku..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <Select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name.substring(0, 1).toUpperCase() + c.name.substring(1)}
            </option>
          ))}
        </Select>

        {/* Price filter */}
        <Select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
        >
          <option value="all">All Prices</option>
          <option value="low">Under ₹1,500</option>
          <option value="mid">₹1,500 - ₹3,000</option>
          <option value="high">Above ₹3,000</option>
        </Select>

        {/* Stock Filter */}
        <Select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">Stock Levels</option>
          <option value="low">Low Stock (≤ 5)</option>
          <option value="out">Out of Stock</option>
          <option value="ok">Healthy Store</option>
        </Select>

        {/* Status tag filter */}
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Visibility</option>
          <option value="featured">Best Seller</option>
          <option value="trending">Trending</option>
        </Select>
      </div>

      {/* Bulk actions bar if selected */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-50/70 border border-[#c5a880]/20 p-4 rounded-lg flex items-center justify-between animate-fade-in shadow-xxs">
          <span className="text-xs text-slate-600 font-semibold font-sans">
            Selected{" "}
            <strong className="text-[#c5a880] font-bold">
              {selectedIds.length}
            </strong>{" "}
            items in database index
          </span>
          <div className="flex space-x-3">
            <Button variant="outline" size="xs" onClick={executeBulkPublish}>
              Tag as Featured
            </Button>
            <button
              onClick={executeBulkDelete}
              className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold tracking-wider uppercase py-1.5 px-3.5 rounded hover:bg-rose-100/50 transition shadow-xxs"
            >
              Bulk Delete
            </button>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
              <tr>
                <th className="py-4.5 px-5 text-left font-sans">#</th>
                <th className="py-4.5 px-5">Preview</th>
                <th className="py-4.5 px-5">Product SKU Details</th>
                <th className="py-4.5 px-5">Category</th>
                <th className="py-4.5 px-5 text-right">MRP (Base)</th>
                <th className="py-4.5 px-5 text-right">Sell Price</th>
                <th className="py-4.5 px-5 text-center">Remaining Stock</th>
                <th className="py-4.5 px-5 text-center">Status</th>
                <th className="py-4.5 px-5 text-center font-mono">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-4.5 px-5 text-left">
                    <SkeletonLoader className="h-4 w-4 rounded" />
                  </td>
                  <td className="py-4.5 px-5">
                    <SkeletonLoader className="w-10 h-12 rounded" />
                  </td>
                  <td className="py-4.5 px-5 space-y-1.55">
                    <SkeletonLoader className="h-4 w-32 rounded" />
                    <SkeletonLoader className="h-3 w-20 rounded" />
                  </td>
                  <td className="py-4.5 px-5">
                    <SkeletonLoader className="h-4 w-12 rounded" />
                  </td>
                  <td className="py-4.5 px-5 text-right">
                    <SkeletonLoader className="h-4 w-12 ml-auto rounded" />
                  </td>
                  <td className="py-4.5 px-5 text-right">
                    <SkeletonLoader className="h-4 w-12 ml-auto rounded" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <SkeletonLoader className="h-4 w-14 mx-auto rounded" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <SkeletonLoader className="h-4 w-16 mx-auto rounded" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <SkeletonLoader className="h-6 w-8 rounded" />
                      <SkeletonLoader className="h-6 w-8 rounded" />
                      <SkeletonLoader className="h-6 w-8 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : paginatedProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic text-xs">
            No matching products found matching criteria
          </div>
        ) : (
          <table className="w-full text-left text-xs bg-white">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
              <tr>
                <th className="py-4.5 px-5">
                  <input
                    type="checkbox"
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every((p) =>
                        selectedIds.includes(p._id),
                      )
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="cursor-pointer rounded text-accent-gold focus:ring-accent-gold/30 border-slate-350"
                  />
                </th>
                <th className="py-4.5 px-5">Preview</th>
                <th className="py-4.5 px-5">Product SKU Details</th>
                <th className="py-4.5 px-5">Category</th>
                <th className="py-4.5 px-5">Fabric Info</th>
                <th className="py-4.5 text-right px-5">Pricing</th>
                <th className="py-4.5 text-center px-5">Stock Levels</th>
                <th className="py-4.5 text-center px-5 font-mono">Status</th>
                <th className="py-4.5 text-center px-5 font-mono">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((p, idx) => {
                const totalStock = Object.values(p.sizesStock || {}).reduce(
                  (acc, val) => acc + val,
                  0,
                );
                const isSelected = selectedIds.includes(p._id);
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-amber-50/15" : ""}`}
                  >
                    <td className="py-4 px-5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          handleSelectOne(p._id, e.target.checked)
                        }
                        className="cursor-pointer rounded text-[#c5a880] focus:ring-[#c5a880]/30 border-slate-300"
                      />
                    </td>
                    <td className="py-4 px-5">
                      {p.images && p.images[0] ? (
                        <div className="relative group cursor-zoom-in">
                          <img
                            src={p.images[0]}
                            className="w-12 h-14 object-cover rounded border border-slate-200 group-hover:scale-105 transition"
                            alt=""
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-14 bg-slate-50 rounded border border-slate-200 flex items-center justify-center text-slate-400">
                          <RiFolderImageLine size={16} />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5 space-y-1">
                      <p className="font-semibold text-slate-800 text-sm tracking-tight">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-450 font-mono tracking-wider">
                        {p.sku}
                      </p>
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-500 capitalize font-mono text-[10px]">
                      {p.category}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-400 text-[10px]">
                      {p.fabric || "Cotton"}
                    </td>
                    <td className="py-4 text-right px-5 font-bold space-y-0.5 font-sans">
                      <p className="text-slate-800">₹{p.price}</p>
                      <p className="text-[10px] text-slate-400 line-through">
                        ₹{p.mrp}
                      </p>
                    </td>
                    <td className="py-4 text-center px-5 font-mono">
                      <StatusPill
                        status={
                          totalStock === 0
                            ? "cancelled"
                            : totalStock <= 5
                              ? "pending"
                              : "delivered"
                        }
                        label={`${totalStock} Units`}
                      />
                    </td>
                    <td className="py-4 text-center px-5">
                      <span
                        className={`px-2.5 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "draft"
                            ? "bg-slate-50 text-slate-500 border-slate-200"
                            : p.status === "archived"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-250 border-emerald-200"
                        }`}
                      >
                        {p.status || "active"}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-1.5 justify-center">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 hover:text-[#c5a880] transition border border-slate-200"
                          title="Edit SKU"
                        >
                          <RiEditLine size={15} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 hover:text-[#c5a880] transition border border-slate-200"
                          title="Duplicate SKU"
                        >
                          <RiFileCopyLine size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 transition border border-slate-200"
                          title="Delete SKU"
                        >
                          <RiDeleteBinLine size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Controls and Page Size Dropdown */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-slate-100 bg-[#FAF9F6]/50">
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-sans">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setItemsPerPage(val === "all" ? "all" : Number(val));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-[#c5a880] text-xs font-semibold cursor-pointer shadow-xxs"
              >
                <option value={10}>10 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value="all">Show All</option>
              </select>
              <span>
                of <strong className="text-slate-700">{totalItems}</strong>{" "}
                entries
              </span>
            </div>

            <Pagination
              currentPage={activePage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductTable;
