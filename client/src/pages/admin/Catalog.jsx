import React, { useEffect, useState } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import SkeletonLoader from "../../components/admin/ui/SkeletonLoader.jsx";

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
};

const emptyBrand = {
  name: "",
  slug: "",
  description: "",
  logoUrl: "",
  isActive: true,
};

const emptyCollection = {
  name: "",
  slug: "",
  description: "",
  bannerUrl: "",
  sortOrder: 0,
  isActive: true,
  products: [],
};

const Catalog = () => {
  const { showAlert, showConfirm } = useAlert();
  const [tab, setTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catForm, setCatForm] = useState(emptyCategory);
  const [brandForm, setBrandForm] = useState(emptyBrand);
  const [colForm, setColForm] = useState(emptyCollection);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [cRes, bRes, colRes, pRes] = await Promise.all([
        API.get("/categories"),
        API.get("/brands"),
        API.get("/collections/manage"),
        API.get("/products"),
      ]);
      if (cRes.data?.success) setCategories(cRes.data.data || []);
      if (bRes.data?.success) setBrands(bRes.data.data || []);
      if (colRes.data?.success) setCollections(colRes.data.data || []);
      if (pRes.data?.success) setProducts(pRes.data.data || []);
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to load catalog",
        "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetCat = () => {
    setCatForm(emptyCategory);
    setEditingCatId(null);
  };

  const resetBrand = () => {
    setBrandForm(emptyBrand);
    setEditingBrandId(null);
  };

  const resetCol = () => {
    setColForm(emptyCollection);
    setEditingColId(null);
    setProductSearch("");
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showAlert("Category name is required", "Validation");
      return;
    }
    try {
      setSaving(true);
      if (editingCatId) {
        await API.put(`/categories/${editingCatId}`, catForm);
        showAlert("Category updated", "Saved");
      } else {
        await API.post("/categories", catForm);
        showAlert("Category created", "Saved");
      }
      resetCat();
      await load();
    } catch (err) {
      showAlert(err.response?.data?.message || "Save failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  const saveBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.name.trim()) {
      showAlert("Brand name is required", "Validation");
      return;
    }
    try {
      setSaving(true);
      if (editingBrandId) {
        await API.put(`/brands/${editingBrandId}`, brandForm);
        showAlert("Brand updated", "Saved");
      } else {
        await API.post("/brands", brandForm);
        showAlert("Brand created", "Saved");
      }
      resetBrand();
      await load();
    } catch (err) {
      showAlert(err.response?.data?.message || "Save failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  const saveCollection = async (e) => {
    e.preventDefault();
    if (!colForm.name.trim()) {
      showAlert("Collection name is required", "Validation");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...colForm,
        products: colForm.products || [],
      };
      if (editingColId) {
        await API.put(`/collections/id/${editingColId}`, payload);
        showAlert("Collection updated", "Saved");
      } else {
        await API.post("/collections", payload);
        showAlert("Collection created", "Saved");
      }
      resetCol();
      await load();
    } catch (err) {
      showAlert(err.response?.data?.message || "Save failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  const editCategory = (c) => {
    setEditingCatId(c._id);
    setCatForm({
      name: c.name || "",
      slug: c.slug || "",
      description: c.description || "",
      imageUrl: c.imageUrl || "",
      sortOrder: c.sortOrder || 0,
      isActive: c.isActive !== false,
    });
    setTab("categories");
  };

  const editBrand = (b) => {
    setEditingBrandId(b._id);
    setBrandForm({
      name: b.name || "",
      slug: b.slug || "",
      description: b.description || "",
      logoUrl: b.logoUrl || "",
      isActive: b.isActive !== false,
    });
    setTab("brands");
  };

  const editCollection = (c) => {
    setEditingColId(c._id);
    setColForm({
      name: c.name || "",
      slug: c.slug || "",
      description: c.description || "",
      bannerUrl: c.bannerUrl || "",
      sortOrder: c.sortOrder || 0,
      isActive: c.isActive !== false,
      products: c.productIds || (c.products || []).map((p) => String(p._id || p)),
    });
    setTab("collections");
  };

  const removeCategory = async (id) => {
    const confirmed = await showConfirm(
      "Delete this category?",
      "Delete Category",
    );
    if (!confirmed) return;
    try {
      await API.delete(`/categories/${id}`);
      showAlert("Category deleted", "Deleted");
      if (editingCatId === id) resetCat();
      await load();
    } catch (err) {
      showAlert(err.response?.data?.message || "Delete failed", "Error");
    }
  };

  const removeBrand = async (id) => {
    const confirmed = await showConfirm("Delete this brand?", "Delete Brand");
    if (!confirmed) return;
    try {
      await API.delete(`/brands/${id}`);
      showAlert("Brand deleted", "Deleted");
      if (editingBrandId === id) resetBrand();
      await load();
    } catch (err) {
      showAlert(err.response?.data?.message || "Delete failed", "Error");
    }
  };

  const removeCollection = async (id) => {
    const confirmed = await showConfirm(
      "Delete this collection?",
      "Delete Collection",
    );
    if (!confirmed) return;
    try {
      await API.delete(`/collections/id/${id}`);
      showAlert("Collection deleted", "Deleted");
      if (editingColId === id) resetCol();
      await load();
    } catch (err) {
      showAlert(err.response?.data?.message || "Delete failed", "Error");
    }
  };

  const toggleProductInCollection = (productId) => {
    const id = String(productId);
    setColForm((prev) => {
      const current = prev.products || [];
      const has = current.includes(id);
      return {
        ...prev,
        products: has
          ? current.filter((x) => x !== id)
          : [...current, id],
      };
    });
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Catalog Configuration"
        subtitle="Manage categories, brands, and storefront collections"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Catalog" },
        ]}
      />

      <div className="flex gap-1 border border-slate-200 bg-white p-1.5 rounded-xl flex-wrap shadow-xs">
        {[
          { id: "categories", label: "Categories" },
          { id: "brands", label: "Brands" },
          { id: "collections", label: "Collections" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors ${
              tab === t.id
                ? "bg-[#c5a880] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <SkeletonLoader className="h-10 w-24 rounded animate-pulse" />
        </div>
      ) : tab === "categories" ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <form
            onSubmit={saveCategory}
            className="xl:col-span-2 space-y-4 bg-[#FAF9F6] border border-slate-200 p-5 rounded-lg"
          >
            <h2 className="text-sm text-slate-800 font-bold uppercase tracking-wider">
              {editingCatId ? "Edit Category" : "Add Category"}
            </h2>
            <Input
              label="Name *"
              placeholder="Category name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              required
            />
            <Input
              label="Slug (optional)"
              placeholder="e.g. ethnic-wear"
              value={catForm.slug}
              onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
            />
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">
                Description
              </label>
              <textarea
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] min-h-[70px] transition"
                placeholder="Description of category..."
                value={catForm.description}
                onChange={(e) =>
                  setCatForm({ ...catForm, description: e.target.value })
                }
              />
            </div>
            <Input
              label="Image URL"
              placeholder="Image URL link"
              value={catForm.imageUrl}
              onChange={(e) =>
                setCatForm({ ...catForm, imageUrl: e.target.value })
              }
            />
            <Input
              type="number"
              label="Sort Order"
              placeholder="0"
              value={catForm.sortOrder}
              onChange={(e) =>
                setCatForm({ ...catForm, sortOrder: Number(e.target.value) })
              }
            />
            <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={catForm.isActive}
                onChange={(e) =>
                  setCatForm({ ...catForm, isActive: e.target.checked })
                }
                className="rounded text-[#c5a880] focus:ring-[#c5a880]"
              />
              Active catalog visibility
            </label>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={saving}
              >
                {editingCatId ? "Update" : "Create"}
              </Button>
              {editingCatId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetCat}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <Card className="xl:col-span-3 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-5">Name</th>
                    <th className="py-4 px-5">Slug</th>
                    <th className="py-4 px-5 text-center">Sort</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-50/50 transition text-slate-700"
                    >
                      <td className="py-4 px-5 font-semibold text-slate-800">
                        {c.name}
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                        {c.slug || "—"}
                      </td>
                      <td className="py-4 px-5 text-center font-mono">
                        {c.sortOrder}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide inline-block ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2.5 h-auto text-slate-700 hover:text-slate-900 border-slate-200"
                          onClick={() => editCategory(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2.5 h-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
                          onClick={() => removeCategory(c._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : tab === "brands" ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <form
            onSubmit={saveBrand}
            className="xl:col-span-2 space-y-4 bg-[#FAF9F6] border border-slate-200 p-5 rounded-lg"
          >
            <h2 className="text-sm text-slate-800 font-bold uppercase tracking-wider">
              {editingBrandId ? "Edit Brand" : "Add Brand"}
            </h2>
            <Input
              label="Name *"
              placeholder="Brand name"
              value={brandForm.name}
              onChange={(e) =>
                setBrandForm({ ...brandForm, name: e.target.value })
              }
              required
            />
            <Input
              label="Slug (optional)"
              placeholder="e.g. pariwesh-luxury"
              value={brandForm.slug}
              onChange={(e) =>
                setBrandForm({ ...brandForm, slug: e.target.value })
              }
            />
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">
                Description
              </label>
              <textarea
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] min-h-[70px] transition"
                placeholder="Description of brand..."
                value={brandForm.description}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, description: e.target.value })
                }
              />
            </div>
            <Input
              label="Logo URL"
              placeholder="URL link"
              value={brandForm.logoUrl}
              onChange={(e) =>
                setBrandForm({ ...brandForm, logoUrl: e.target.value })
              }
            />
            <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={brandForm.isActive}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, isActive: e.target.checked })
                }
                className="rounded text-[#c5a880] focus:ring-[#c5a880]"
              />
              Active brand visibility
            </label>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={saving}
              >
                {editingBrandId ? "Update" : "Create"}
              </Button>
              {editingBrandId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetBrand}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <Card className="xl:col-span-3 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-5">Name</th>
                    <th className="py-4 px-5">Slug</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brands.map((b) => (
                    <tr
                      key={b._id}
                      className="hover:bg-slate-50/50 transition text-slate-700"
                    >
                      <td className="py-4 px-5 font-semibold text-slate-805">
                        {b.name}
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                        {b.slug || "—"}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide inline-block ${
                            b.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {b.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2.5 h-auto text-slate-700 hover:text-slate-900 border-slate-200"
                          onClick={() => editBrand(b)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2.5 h-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
                          onClick={() => removeBrand(b._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <form
            onSubmit={saveCollection}
            className="xl:col-span-2 space-y-4 bg-[#FAF9F6] border border-slate-200 p-5 rounded-lg"
          >
            <h2 className="text-sm text-slate-800 font-bold uppercase tracking-wider">
              {editingColId ? "Edit Collection" : "Add Collection"}
            </h2>
            <Input
              label="Name *"
              placeholder="Collection name"
              value={colForm.name}
              onChange={(e) =>
                setColForm({ ...colForm, name: e.target.value })
              }
              required
            />
            <Input
              label="Slug (optional)"
              placeholder="e.g. best-sellers"
              value={colForm.slug}
              onChange={(e) =>
                setColForm({ ...colForm, slug: e.target.value })
              }
            />
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">
                Description
              </label>
              <textarea
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880] min-h-[70px] transition"
                placeholder="Storefront blurb..."
                value={colForm.description}
                onChange={(e) =>
                  setColForm({ ...colForm, description: e.target.value })
                }
              />
            </div>
            <Input
              label="Banner URL"
              placeholder="Banner image URL"
              value={colForm.bannerUrl}
              onChange={(e) =>
                setColForm({ ...colForm, bannerUrl: e.target.value })
              }
            />
            <Input
              type="number"
              label="Sort Order"
              placeholder="0"
              value={colForm.sortOrder}
              onChange={(e) =>
                setColForm({
                  ...colForm,
                  sortOrder: Number(e.target.value),
                })
              }
            />
            <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={colForm.isActive}
                onChange={(e) =>
                  setColForm({ ...colForm, isActive: e.target.checked })
                }
                className="rounded text-[#c5a880] focus:ring-[#c5a880]"
              />
              Active on storefront
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">
                  Products ({colForm.products?.length || 0} selected)
                </label>
              </div>
              <input
                type="text"
                placeholder="Search products by name / SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
              />
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 p-3 italic">
                    No products match
                  </p>
                ) : (
                  filteredProducts.slice(0, 80).map((p) => {
                    const checked = (colForm.products || []).includes(
                      String(p._id),
                    );
                    return (
                      <label
                        key={p._id}
                        className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProductInCollection(p._id)}
                          className="rounded text-[#c5a880] focus:ring-[#c5a880]"
                        />
                        <span className="flex-grow text-slate-700 truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {p.sku}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={saving}
              >
                {editingColId ? "Update" : "Create"}
              </Button>
              {editingColId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetCol}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <Card className="xl:col-span-3 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-5">Name</th>
                    <th className="py-4 px-5">Slug</th>
                    <th className="py-4 px-5 text-center">Products</th>
                    <th className="py-4 px-5 text-center">Sort</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collections.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400 italic"
                      >
                        No collections yet
                      </td>
                    </tr>
                  ) : (
                    collections.map((c) => (
                      <tr
                        key={c._id}
                        className="hover:bg-slate-50/50 transition text-slate-700"
                      >
                        <td className="py-4 px-5 font-semibold text-slate-800">
                          {c.name}
                        </td>
                        <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                          {c.slug || "—"}
                        </td>
                        <td className="py-4 px-5 text-center font-mono">
                          {c.productCount ?? c.products?.length ?? 0}
                        </td>
                        <td className="py-4 px-5 text-center font-mono">
                          {c.sortOrder}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide inline-block ${
                              c.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {c.isActive ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] py-1 px-2.5 h-auto text-slate-700 hover:text-slate-900 border-slate-200"
                            onClick={() => editCollection(c)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] py-1 px-2.5 h-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
                            onClick={() => removeCollection(c._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Catalog;
