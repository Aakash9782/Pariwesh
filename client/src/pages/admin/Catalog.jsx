import React, { useEffect, useState } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Input from "../../components/admin/ui/Input.jsx";
import Select from "../../components/admin/ui/Select.jsx";
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

const Catalog = () => {
  const { showAlert, showConfirm } = useAlert();
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <PageHeader
        title="Catalog Configuration"
        subtitle="Manage product categories and brands used for shop filters and classification taggings"
        breadcrumbs={[
          { label: "Dashboard", link: "/admin" },
          { label: "Catalog" },
        ]}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "categories", label: "Categories" },
          { id: "brands", label: "Brands" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-bold rounded transition-colors ${
              tab === t.id
                ? "bg-[#c5a880] text-white"
                : "text-slate-500 hover:text-slate-800"
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
                          className="text-[10px] py-1 px-2.5 h-auto text-slate-700 hover:text-slate-900 border-slate-203"
                          onClick={() => editCategory(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2.5 h-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-203"
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
      ) : (
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
                          className="text-[10px] py-1 px-2.5 h-auto text-slate-700 hover:text-slate-900 border-slate-203"
                          onClick={() => editBrand(b)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2.5 h-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-203"
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
      )}
    </div>
  );
};

export default Catalog;
