import React, { useEffect, useState } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import Button from "../../components/common/Button.jsx";

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

const Catalog = () => {
  const { showAlert } = useAlert();
  const [tab, setTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catForm, setCatForm] = useState(emptyCategory);
  const [brandForm, setBrandForm] = useState(emptyBrand);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [cRes, bRes] = await Promise.all([
        API.get("/categories"),
        API.get("/brands"),
      ]);
      if (cRes.data?.success) setCategories(cRes.data.data || []);
      if (bRes.data?.success) setBrands(bRes.data.data || []);
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to load catalog", "Error");
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

  const removeCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
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
    if (!window.confirm("Delete this brand?")) return;
    try {
      await API.delete(`/brands/${id}`);
      showAlert("Brand deleted", "Deleted");
      if (editingBrandId === id) resetBrand();
      await load();
    } catch (err) {
      showAlert(err.response?.data?.message || "Delete failed", "Error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-white tracking-wide">
          Catalog
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage categories and brands used on products and storefront filters.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {[
          { id: "categories", label: "Categories" },
          { id: "brands", label: "Brands" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs uppercase tracking-wider rounded-sm ${
              tab === t.id
                ? "bg-accent-gold text-secondary"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-10">Loading…</p>
      ) : tab === "categories" ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <form
            onSubmit={saveCategory}
            className="xl:col-span-2 space-y-3 bg-slate-950 border border-slate-800 p-5 rounded-lg"
          >
            <h2 className="text-sm text-white font-semibold">
              {editingCatId ? "Edit category" : "Add category"}
            </h2>
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              placeholder="Name *"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              required
            />
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              placeholder="Slug (optional)"
              value={catForm.slug}
              onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
            />
            <textarea
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white min-h-[70px]"
              placeholder="Description"
              value={catForm.description}
              onChange={(e) =>
                setCatForm({ ...catForm, description: e.target.value })
              }
            />
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              placeholder="Image URL"
              value={catForm.imageUrl}
              onChange={(e) =>
                setCatForm({ ...catForm, imageUrl: e.target.value })
              }
            />
            <input
              type="number"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              placeholder="Sort order"
              value={catForm.sortOrder}
              onChange={(e) =>
                setCatForm({ ...catForm, sortOrder: Number(e.target.value) })
              }
            />
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={catForm.isActive}
                onChange={(e) =>
                  setCatForm({ ...catForm, isActive: e.target.checked })
                }
              />
              Active
            </label>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="gold" size="sm" loading={saving}>
                {editingCatId ? "Update" : "Create"}
              </Button>
              {editingCatId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetCat}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="xl:col-span-3 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Sort</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id} className="border-t border-slate-800 text-slate-200">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-slate-400">{c.slug}</td>
                    <td className="p-3">{c.sortOrder}</td>
                    <td className="p-3">
                      {c.isActive ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-slate-500">Hidden</span>
                      )}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        type="button"
                        className="text-accent-gold hover:underline"
                        onClick={() => editCategory(c)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-400 hover:underline"
                        onClick={() => removeCategory(c._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <form
            onSubmit={saveBrand}
            className="xl:col-span-2 space-y-3 bg-slate-950 border border-slate-800 p-5 rounded-lg"
          >
            <h2 className="text-sm text-white font-semibold">
              {editingBrandId ? "Edit brand" : "Add brand"}
            </h2>
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              placeholder="Name *"
              value={brandForm.name}
              onChange={(e) =>
                setBrandForm({ ...brandForm, name: e.target.value })
              }
              required
            />
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              placeholder="Slug (optional)"
              value={brandForm.slug}
              onChange={(e) =>
                setBrandForm({ ...brandForm, slug: e.target.value })
              }
            />
            <textarea
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white min-h-[70px]"
              placeholder="Description"
              value={brandForm.description}
              onChange={(e) =>
                setBrandForm({ ...brandForm, description: e.target.value })
              }
            />
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              placeholder="Logo URL"
              value={brandForm.logoUrl}
              onChange={(e) =>
                setBrandForm({ ...brandForm, logoUrl: e.target.value })
              }
            />
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={brandForm.isActive}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, isActive: e.target.checked })
                }
              />
              Active
            </label>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="gold" size="sm" loading={saving}>
                {editingBrandId ? "Update" : "Create"}
              </Button>
              {editingBrandId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetBrand}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="xl:col-span-3 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b._id} className="border-t border-slate-800 text-slate-200">
                    <td className="p-3 font-medium">{b.name}</td>
                    <td className="p-3 text-slate-400">{b.slug}</td>
                    <td className="p-3">
                      {b.isActive ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-slate-500">Hidden</span>
                      )}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        type="button"
                        className="text-accent-gold hover:underline"
                        onClick={() => editBrand(b)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-400 hover:underline"
                        onClick={() => removeBrand(b._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
