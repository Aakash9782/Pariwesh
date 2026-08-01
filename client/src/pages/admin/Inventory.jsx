import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold tracking-wide text-white">
            Inventory Controls
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Directly adjust available clothing sizes stock levels inline without
            leaving the catalog
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 text-accent-gold text-xs font-bold py-2.5 px-4.5 rounded-lg border border-slate-805 transition"
        >
          <RiRefreshLine size={16} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <RiSearchLine
            className="absolute left-3.5 top-3 text-slate-500"
            size={17}
          />
          <input
            type="text"
            placeholder="Search SKUs, product names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Category */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="suits">Suits</option>
          <option value="kurtis">Kurtis</option>
          <option value="ethnic">Ethnic Wear</option>
        </select>

        {/* Fabric */}
        <input
          type="text"
          placeholder="Filter fabric type (e.g. Cotton, Linen)..."
          value={fabricFilter}
          onChange={(e) => setFabricFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
        />

        {/* Status flags */}
        <select
          value={stockStatusFilter}
          onChange={(e) => setStockStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg p-2.5 focus:outline-none"
        >
          <option value="all">Threshold: All</option>
          <option value="out">Out of Stock (0 units)</option>
          <option value="low">Warning Low (≤ 5 units)</option>
          <option value="ok">Healthy Levels (5+ units)</option>
        </select>
      </div>

      {/* Inventory list table */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-sans min-w-[900px]">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
            <tr>
              <th className="py-4.5 px-5">Garment Preview</th>
              <th className="py-4.5 px-5">Products Details SKU</th>
              <th className="py-4.5 px-5">Category</th>
              <th className="py-4.5 text-center px-5">
                Sizes Inventory Stock Ledger
              </th>
              <th className="py-4.5 text-center px-5 font-mono">
                Aggregated Units
              </th>
              <th className="py-4.5 text-center px-5">Status flag</th>
              <th className="py-4.5 text-center px-5">Adjust inline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/40">
                  <td className="py-4.5 px-5">
                    <Skeleton className="w-10 h-12 rounded" />
                  </td>
                  <td className="py-4.5 px-5 space-y-1.5">
                    <Skeleton className="h-4.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="py-4.5 px-5">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="py-4.5 px-5">
                    <div className="flex justify-center space-x-2">
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="h-6 w-10" />
                    </div>
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-4 w-14 mx-auto" />
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <Skeleton className="h-7 w-20 mx-auto" />
                  </td>
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-slate-500 italic"
                >
                  No matching inventory files found
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
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-5">
                      {p.images && p.images[0] ? (
                        <img
                          src={p.images[0]}
                          className="w-9 h-11 object-cover rounded border border-slate-800"
                          alt=""
                        />
                      ) : (
                        <div className="w-9 h-11 bg-slate-900 rounded border border-slate-800" />
                      )}
                    </td>
                    <td className="py-4 px-5 space-y-1">
                      <p className="font-semibold text-slate-200 text-sm tracking-tight">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono tracking-wide">
                        {p.sku}
                      </p>
                    </td>
                    <td className="py-4 px-5 text-slate-400 capitalize font-mono">
                      {p.category}
                    </td>

                    {/* Sizes indicators / Inputs */}
                    <td className="py-4 px-5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center space-x-1.5 font-sans">
                          {["S", "M", "L", "XL", "XXL"].map((sz) => (
                            <div key={sz} className="text-[10px] space-y-0.5">
                              <span className="block text-slate-550 lowercase tracking-wider font-bold">
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
                                className="w-9 bg-slate-900 border border-slate-800 text-white rounded p-1 text-center font-mono text-[11px]"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-4">
                          {["S", "M", "L", "XL", "XXL"].map((sz) => {
                            const val = p.sizesStock?.[sz] || 0;
                            return (
                              <span
                                key={sz}
                                className="text-slate-400 text-xs font-mono"
                              >
                                <strong className="text-slate-550 font-sans font-bold text-[9px] uppercase mr-0.5">
                                  {sz}/
                                </strong>
                                <span
                                  className={
                                    val === 0
                                      ? "text-red-500 font-bold"
                                      : "text-slate-200"
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

                    <td className="py-4 text-center px-5 font-mono text-sm tracking-tight text-white font-bold">
                      {isEditing ? (
                        <span className="text-accent-gold">
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
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                          totalStock === 0
                            ? "bg-red-500/10 text-red-400"
                            : totalStock <= 5
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {totalStock === 0
                          ? "Out of Stock"
                          : totalStock <= 5
                            ? "Low stock"
                            : "In Stock"}
                      </span>
                    </td>

                    <td className="py-4 text-center px-5">
                      {isEditing ? (
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleSaveStock(p._id)}
                            className="bg-accent-gold text-slate-950 text-[10px] font-extrabold uppercase py-1 px-3.5 rounded flex items-center space-x-1"
                          >
                            <RiSaveLine size={13} />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] py-1 px-2.5 rounded font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditStockInit(p)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-1.5 px-3 rounded-lg text-slate-400 hover:text-accent-gold transition font-semibold"
                        >
                          Adjust Stocks
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
