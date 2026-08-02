import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import Select from "../../components/admin/ui/Select.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";
import {
  RiSearchLine,
  RiRefreshLine,
  RiSaveLine,
  RiEditLine,
  RiAlertLine,
  RiCheckDoubleLine,
} from "react-icons/ri";

const InventoryPage = () => {
  const { showAlert: alert } = useAlert();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [fabricFilter, setFabricFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState(
    searchParams.get("status") || "all",
  );

  const [editingId, setEditingId] = useState(null);
  const [editStockState, setEditStockState] = useState({});

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

  const handleEditStockInit = (prod) => {
    setEditingId(prod._id);
    setEditStockState(prod.sizesStock || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
  };

  const handleStockValueChange = (size, val) => {
    const parsed = Math.max(0, Number(val));
    setEditStockState((prev) => ({
      ...prev,
      [size]: parsed,
    }));
  };

  const handleSaveStock = async (prodId) => {
    try {
      // Calculate overall total stock
      const total = Object.values(editStockState).reduce(
        (acc, curr) => acc + curr,
        0,
      );
      const res = await API.put(`/products/id/${prodId}`, {
        sizesStock: editStockState,
        stock: total, // sync back to legacy flat stock count as well
      });
      if (res.data?.success) {
        alert("Stock values adjusted successfully!");
        setEditingId(null);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
      alert("Adjust stock operation failed");
    }
  };

  const filteredProducts = products.filter((p) => {
    const query = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query);

    const matchCat = catFilter ? p.category === catFilter : true;
    const matchFabric = fabricFilter
      ? p.fabric?.toLowerCase().includes(fabricFilter.toLowerCase())
      : true;

    const totalStock = Object.values(p.sizesStock || {}).reduce(
      (acc, c) => acc + c,
      0,
    );

    let matchStatus = true;
    if (stockStatusFilter === "out") matchStatus = totalStock === 0;
    else if (stockStatusFilter === "low")
      matchStatus = totalStock <= 5 && totalStock > 0;
    else if (stockStatusFilter === "ok") matchStatus = totalStock > 5;

    return matchSearch && matchCat && matchFabric && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <PageHeader
        title="Inventory Controls"
        subtitle="Directly adjust available clothing sizes stock levels inline without leaving the catalog"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Inventory" },
        ]}
        actions={
          <Button
            variant="outline"
            className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 border-slate-200 animate-slide-in"
            onClick={fetchInventory}
          >
            <RiRefreshLine size={16} className="text-slate-500" />
            <span>Refresh Stock</span>
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
        {/* Search */}
        <div className="relative">
          <RiSearchLine
            className="absolute left-3 top-3 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search SKUs, product names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          />
        </div>

        {/* Category */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="">All Categories</option>
          <option value="suits">Suits</option>
          <option value="kurtis">Kurtis</option>
          <option value="ethnic">Ethnic Wear</option>
        </select>

        {/* Fabric */}
        <input
          type="text"
          placeholder="Filter fabric type (e.g. Cotton)..."
          value={fabricFilter}
          onChange={(e) => setFabricFilter(e.target.value)}
          className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
        />

        {/* Status flags */}
        <select
          value={stockStatusFilter}
          onChange={(e) => setStockStatusFilter(e.target.value)}
          className="bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#c5a880] transition"
        >
          <option value="all">Threshold: All</option>
          <option value="out">Out of Stock (0 units)</option>
          <option value="low">Warning Low (≤ 5 units)</option>
          <option value="ok">Healthy Levels (5+ units)</option>
        </select>
      </Card>

      {/* Inventory list table */}
      <Card className="overflow-hidden animate-fade-in">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[900px] border-collapse">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-5">Garment Preview</th>
                <th className="py-4 px-5">Product Details SKU</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 text-center px-5">
                  Sizes Inventory Stock Ledger
                </th>
                <th className="py-4 text-center px-5">Aggregated Units</th>
                <th className="py-4 text-center px-5">Status Flag</th>
                <th className="py-4 text-center px-5">Adjust Inline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="w-9 h-11 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-5 space-y-1.5">
                      <SkeletonLoader className="h-4.5 w-32 animate-pulse" />
                      <SkeletonLoader className="h-3 w-20 animate-pulse" />
                    </td>
                    <td className="py-4 px-5">
                      <SkeletonLoader className="h-4 w-16 animate-pulse" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-center space-x-2">
                        <SkeletonLoader className="h-6 w-10 rounded animate-pulse" />
                        <SkeletonLoader className="h-6 w-10 rounded animate-pulse" />
                        <SkeletonLoader className="h-6 w-10 rounded animate-pulse" />
                        <SkeletonLoader className="h-6 w-10 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4 w-12 mx-auto animate-pulse" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-4.5 w-14 mx-auto animate-pulse" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <SkeletonLoader className="h-7 w-20 mx-auto rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No matching inventory files found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const totalStock = Object.values(p.sizesStock || {}).reduce(
                    (acc, curr) => acc + curr,
                    0,
                  );
                  const isEditing = editingId === p._id;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-5">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            className="w-9 h-11 object-cover rounded border border-slate-205"
                            alt=""
                          />
                        ) : (
                          <div className="w-9 h-11 bg-slate-100 rounded border border-slate-205" />
                        )}
                      </td>
                      <td className="py-4 px-5 space-y-1">
                        <p className="font-semibold text-slate-900 text-xs animate-slide-in">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wide">
                          {p.sku}
                        </p>
                      </td>
                      <td className="py-4 px-5 text-slate-600 capitalize font-mono text-[11px]">
                        {p.category}
                      </td>

                      {/* Sizes indicators / Inputs */}
                      <td className="py-4 px-5 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center space-x-1.5 font-sans">
                            {["S", "M", "L", "XL", "XXL"].map((sz) => (
                              <div key={sz} className="text-[10px] space-y-0.5">
                                <span className="block text-slate-500 font-bold uppercase text-[9px]">
                                  {sz}
                                </span>
                                <input
                                  type="number"
                                  value={
                                    editStockState[sz] !== undefined
                                      ? editStockState[sz]
                                      : 0
                                  }
                                  onChange={(e) =>
                                    handleStockValueChange(sz, e.target.value)
                                  }
                                  className="w-9 bg-white border border-slate-200 text-slate-800 rounded p-1 text-center font-mono text-[11px] focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-3.5">
                            {["S", "M", "L", "XL", "XXL"].map((sz) => {
                              const val = p.sizesStock?.[sz] || 0;
                              return (
                                <span
                                  key={sz}
                                  className="text-slate-500 text-xs font-mono"
                                >
                                  <strong className="text-slate-400 font-sans font-bold text-[9px] uppercase mr-0.5">
                                    {sz}/
                                  </strong>
                                  <span
                                    className={
                                      val === 0
                                        ? "text-rose-605 font-bold"
                                        : "text-slate-800"
                                    }
                                  >
                                    {val}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-4 text-center px-5 font-mono text-xs tracking-tight text-slate-800 font-bold">
                        {isEditing ? (
                          <span className="text-[#c5a880]">
                            {Object.values(editStockState).reduce(
                              (acc, curr) => acc + curr,
                              0,
                            )}{" "}
                            Units
                          </span>
                        ) : (
                          <span>{totalStock} Units</span>
                        )}
                      </td>

                      <td className="py-4 text-center px-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide inline-block ${
                            totalStock === 0
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : totalStock <= 5
                                ? "bg-amber-50 text-[#c5a880] border border-[#c5a880]/15"
                                : "bg-emerald-58 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {totalStock === 0
                            ? "Out of Stock"
                            : totalStock <= 5
                              ? "Low Stock"
                              : "In Stock"}
                        </span>
                      </td>

                      <td className="py-4 text-center px-5">
                        {isEditing ? (
                          <div className="flex justify-center space-x-1.5">
                            <Button
                              onClick={() => handleSaveStock(p._id)}
                              size="sm"
                              className="text-[10px] py-1 px-3.5 h-auto bg-[#c5a880] hover:bg-[#b0936a] text-white flex items-center space-x-1"
                            >
                              <RiSaveLine size={13} />
                              <span>Save</span>
                            </Button>
                            <Button
                              onClick={() => setEditingId(null)}
                              variant="outline"
                              size="sm"
                              className="text-[10px] py-1 px-2.5 h-auto border-slate-200 text-slate-600"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleEditStockInit(p)}
                            variant="outline"
                            size="sm"
                            className="text-[10px] py-1 px-3 h-auto"
                          >
                            Adjust Stocks
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
      </Card>
    </div>
  );
};

export default InventoryPage;
