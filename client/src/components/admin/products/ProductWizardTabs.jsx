import React from "react";
import { useProductWizard } from "./ProductWizardContext.jsx";
import {
  RiFolderImageLine,
  RiCloseLine,
  RiAddLine,
  RiVideoLine,
  RiDeleteBinLine,
  RiFilmLine,
} from "react-icons/ri";
import API from "../../../services/api.js";

// TAB 1: BASIC INFO
export const ProductBasicTab = () => {
  const { form, setForm, generateSKU, manualSlug, setManualSlug, collections } =
    useProductWizard();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Basic Information
        </h4>
        <p className="text-slate-500 text-xs mt-0.5">
          Define core identifiers for this product listing.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Product Brand Label Name *
          </label>
          <input
            id="input-name"
            type="text"
            placeholder="e.g. Elysian Gold Chanderi Suit"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Unique Item SKU *
            </label>
            <button
              type="button"
              onClick={generateSKU}
              className="text-[10px] font-extrabold uppercase tracking-wide text-[#c5a880] hover:text-yellow-600 transition"
            >
              Auto-Generate
            </button>
          </div>
          <input
            id="input-sku"
            type="text"
            placeholder="e.g. PAR-SUITS-XXXXX"
            value={form.sku}
            onChange={(e) =>
              setForm({
                ...form,
                sku: e.target.value.toUpperCase(),
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition font-mono uppercase"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              SEO URL Slug *
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={manualSlug}
                onChange={(e) => setManualSlug(e.target.checked)}
                className="rounded text-accent-gold focus:ring-accent-gold/30 h-3 w-3"
              />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Edit Override
              </span>
            </label>
          </div>
          <input
            id="input-slug"
            type="text"
            disabled={!manualSlug}
            value={form.slug || ""}
            placeholder="auto-generated-from-name"
            onChange={(e) =>
              setForm({
                ...form,
                slug: e.target.value
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-"),
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 disabled:opacity-50 disabled:bg-slate-100 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Short Sub-heading Description
          </label>
          <input
            type="text"
            placeholder="Catchy sentence summing up key features..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Long Form Details (Fabric Details & Sizing Advice)
          </label>
          <textarea
            rows={3}
            placeholder="Long catalog text displaying fabric linings, custom work stitching details, trousers details, wedding festive instructions..."
            value={form.fabric}
            onChange={(e) => setForm({ ...form, fabric: e.target.value })}
            className="w-full bg-slate-55 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          />
        </div>

        {/* Collections Status Map Display */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Mapped Dynamic Collections
          </label>
          <div className="flex flex-wrap gap-2">
            {collections
              .filter(
                (col) =>
                  col.categoryRules &&
                  col.categoryRules.includes(form.category),
              )
              .map((col) => (
                <span
                  key={col._id}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider"
                >
                  {col.name} ({col.slug})
                </span>
              ))}
            {collections.filter(
              (col) =>
                col.categoryRules && col.categoryRules.includes(form.category),
            ).length === 0 && (
              <span className="text-[10px] text-slate-550 italic">
                This category does not currently match any smart collections.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// TAB 2: HIERARCHY & TAGS
export const ProductHierarchyTab = () => {
  const { form, setForm, categories, brands } = useProductWizard();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Hierarchy & Tags
        </h4>
        <p className="text-slate-500 text-xs mt-0.5">
          Map this product into primary layout categories and brand labels.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
            Primary Catalog Group *
          </label>
          <select
            id="input-category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] transition"
          >
            {categories.length === 0 && <option value="suits">Suits</option>}
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Sub-Category Tag
          </label>
          <input
            type="text"
            placeholder="e.g. Anarkali Suit Set, A-Line Kurta"
            value={form.subCategory}
            onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Brand Designation
          </label>
          <select
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 border-slate-200 text-xs rounded-lg px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          >
            {brands.length === 0 && <option value="Pariwesh">Pariwesh</option>}
            {brands.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Search Keywords / Tags
          </label>
          <input
            type="text"
            placeholder="comma block e.g. handblock, indigo, wedding, rayon"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
      </div>
    </div>
  );
};

// TAB 3: PRICING & TAX
export const ProductPricingTab = () => {
  const { form, setForm, syncPrice } = useProductWizard();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Pricing & Taxes
        </h4>
        <p className="text-slate-500 text-xs mt-0.5">
          Specify retail pricing levels, discount ratios, and tax brackets.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Maximum Retail Price (MRP) *
          </label>
          <input
            id="input-mrp"
            type="number"
            placeholder="e.g. 4999"
            value={form.mrp}
            onChange={(e) => syncPrice("mrp", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Discount Percent (%)
          </label>
          <input
            type="number"
            placeholder="15"
            value={form.discount}
            onChange={(e) => syncPrice("discount", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Calculated Selling Price (Calculated automatically)
          </label>
          <input
            id="input-price"
            type="number"
            readOnly
            placeholder="Price in INR text"
            value={form.price}
            className="w-full bg-amber-50/30 border border-amber-200/50 rounded-lg px-3.5 py-2.5 text-xs text-[#c5a880] font-bold focus:outline-none cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            GST Rate Applicable (%)
          </label>
          <input
            id="input-gst"
            type="number"
            placeholder="18"
            value={form.gst}
            onChange={(e) => setForm({ ...form, gst: e.target.value })}
            className="w-full bg-slate-555 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col md:col-span-2">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            HSN Export Custom Code
          </label>
          <input
            type="text"
            placeholder="e.g. 62044220"
            value={form.hsnCode}
            onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition font-mono"
          />
        </div>
      </div>
    </div>
  );
};

// TAB 4: SPEC SHEET
export const ProductDetailsTab = () => {
  const { form, setForm, editProduct, setEditProduct, setActiveTab } =
    useProductWizard();
  const [variants, setVariants] = React.useState([]);
  const [loadingVariants, setLoadingVariants] = React.useState(false);
  const [newTagInput, setNewTagInput] = React.useState("");

  // Sibling variants loader
  React.useEffect(() => {
    if (form.colorGroup) {
      setLoadingVariants(true);
      API.get(`/products/color-group/${form.colorGroup}`)
        .then((res) => {
          if (res.data && res.data.success) {
            setVariants(res.data.data || []);
          }
        })
        .catch((err) => console.error("Error loading sibling variants:", err))
        .finally(() => setLoadingVariants(false));
    } else {
      setVariants([]);
    }
  }, [form.colorGroup, form._id]);

  // Tag helper functions
  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^,+|,+$/g, "");
      if (val && !(form.setContents || []).includes(val)) {
        setForm({
          ...form,
          setContents: [...(form.setContents || []), val],
        });
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm({
      ...form,
      setContents: (form.setContents || []).filter(
        (tag) => tag !== tagToRemove,
      ),
    });
  };

  // Sibling switcher
  const handleSwitchSibling = (sibling) => {
    // Prevent switching if there are unsaved changes on current form?
    // We can directly load the sibling to save friction.
    setEditProduct(sibling);
    setForm({
      name: sibling.name || "",
      sku: sibling.sku || "",
      category: sibling.category || "suits",
      subCategory: sibling.subCategory || "",
      brand: sibling.brand || "Pariwesh",
      fabric: sibling.fabric || "Premium Cotton",
      washCare: sibling.washCare || "Dry Clean Preferred",
      colorGroup: sibling.colorGroup || "",
      color: sibling.color || "Ivory",
      colorHex: sibling.colorHex || "#F5F5F0",
      sizes: sibling.sizes?.filter((s) => s !== "S") || [
        "M",
        "L",
        "XL",
        "XXL",
      ],
      sizesStock: {
        M: sibling.sizesStock?.M ?? 10,
        L: sibling.sizesStock?.L ?? 10,
        XL: sibling.sizesStock?.XL ?? 10,
        XXL: sibling.sizesStock?.XXL ?? 10,
      },
      mrp: sibling.mrp || "",
      price: sibling.price || "",
      discount: sibling.discount || 0,
      gst: sibling.gst !== undefined ? sibling.gst : 18,
      hsnCode: sibling.hsnCode || "6204",
      material: sibling.material || "",
      weight: sibling.weight || "",
      countryOfOrigin: sibling.countryOfOrigin || "India",
      shippingWeight: sibling.shippingWeight || "",
      returnDays: sibling.returnDays !== undefined ? sibling.returnDays : 7,
      featured: sibling.featured || false,
      trending: sibling.trending || false,
      bestSeller: sibling.bestSeller || false,
      newArrival: sibling.newArrival || false,
      recommended: sibling.recommended || false,
      seoTitle: sibling.seoTitle || "",
      seoDescription: sibling.seoDescription || "",
      metaKeywords: sibling.metaKeywords || "",
      canonicalUrl: sibling.canonicalUrl || "",
      ogImage: sibling.ogImage || "",
      images: sibling.images || [],
      video: sibling.video || "",
      tag: sibling.tag || "Regular",
      description: sibling.description || "",
      status: sibling.status || "active",
      slug: sibling.slug || "",
      fit: sibling.fit || "",
      pattern: sibling.pattern || "",
      neckline: sibling.neckline || "",
      sleeveLength: sibling.sleeveLength || "",
      occasion: sibling.occasion || "",
      bottomType: sibling.bottomType || "",
      setContents: sibling.setContents || [],
    });
    setActiveTab("basic");
  };

  // Add Color Variant trigger
  const handleAddNewColorVariant = () => {
    const clonedParent = { ...form };
    setEditProduct(null); // Launch CREATE mode helper
    setForm({
      ...clonedParent,
      _id: undefined,
      name: `${clonedParent.name.split(" - ")[0]} - [Color]`, // Suffix name format suggestion
      sku: `${clonedParent.sku.split("-V")[0]}-V${Math.floor(10 + Math.random() * 90)}`,
      slug: "",
      color: "",
      colorHex: "#FFFFFF",
      images: [],
      video: "",
      sizesStock: { M: 0, L: 0, XL: 0, XXL: 0 },
      status: "draft",
    });
    setActiveTab("basic");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Spec Sheet Form card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Clothing Specifications
          </h4>
          <p className="text-slate-500 text-xs mt-0.5">
            Specify customized material weaves, tailoring cuts, and detailed
            structural profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Fit Cut */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Silhouette / Fit Cut
            </label>
            <input
              type="text"
              placeholder="e.g. Regular Fit, A-Line Flared, Straight Cut"
              value={form.fit || ""}
              onChange={(e) => setForm({ ...form, fit: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Pattern Style */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Pattern / Print Style
            </label>
            <input
              type="text"
              placeholder="e.g. Floral Chintz Handblock, Zari Border Embroidery"
              value={form.pattern || ""}
              onChange={(e) => setForm({ ...form, pattern: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Neckline profile */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Neckline Collar
            </label>
            <input
              type="text"
              placeholder="e.g. Mandarin Neck, V-Neckline, Round Neck"
              value={form.neckline || ""}
              onChange={(e) => setForm({ ...form, neckline: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Sleeve Length */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Sleeve Structure
            </label>
            <input
              type="text"
              placeholder="e.g. Three-Quarter Sleeves, Sleeveless, Full Sleeve"
              value={form.sleeveLength || ""}
              onChange={(e) =>
                setForm({ ...form, sleeveLength: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Occasion profiling */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Occasion Theme
            </label>
            <input
              type="text"
              placeholder="e.g. Festive Weddings, Casual Apparel, Workwear"
              value={form.occasion || ""}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Bottom Type */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Bottom Piece Type
            </label>
            <input
              type="text"
              placeholder="e.g. Straight Trousers, Palazzo Flares, Churidar"
              value={form.bottomType || ""}
              onChange={(e) => setForm({ ...form, bottomType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Set Contents Array Tag editor */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Set Contents Included Apparel (Press Enter or comma to save tag)
            </label>
            <div className="flex flex-col space-y-2 border border-slate-200 rounded-lg bg-slate-50 p-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c5a880]/20 focus-within:border-[#c5a880] transition">
              <div className="flex flex-wrap gap-1.5">
                {(form.setContents || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold font-sans"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-amber-600 hover:text-amber-900 rounded-full focus:outline-none"
                    >
                      <RiCloseLine size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder={
                  (form.setContents || []).length === 0
                    ? "Add item, e.g. Kurti (press Enter)..."
                    : "Add another garment..."
                }
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-transparent border-none outline-none text-xs text-slate-800 p-0.5"
              />
            </div>
          </div>

          {/* Standard dimensions */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Fabric Weight
            </label>
            <input
              type="text"
              placeholder="e.g. 380 grams/sqm"
              value={form.weight || ""}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Wash Care Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Cold dry clean preferred, low steam iron"
              value={form.washCare || ""}
              onChange={(e) => setForm({ ...form, washCare: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Material Composition
            </label>
            <input
              type="text"
              placeholder="e.g. 80% Cotton, 20% Silk weaves"
              value={form.material || ""}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Shipping Weight
            </label>
            <input
              type="text"
              placeholder="e.g. 480g"
              value={form.shippingWeight || ""}
              onChange={(e) =>
                setForm({ ...form, shippingWeight: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Country of Origin
            </label>
            <input
              type="text"
              placeholder="India"
              value={form.countryOfOrigin || ""}
              onChange={(e) =>
                setForm({ ...form, countryOfOrigin: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Return Allowance Period (Days)
            </label>
            <input
              type="number"
              value={form.returnDays}
              onChange={(e) => setForm({ ...form, returnDays: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Product Color Name */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Product Color Name
            </label>
            <input
              type="text"
              placeholder="e.g. Bright Violet, Crimson Red"
              value={form.color || ""}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition"
            />
          </div>

          {/* Color HEX Code */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
              Color HEX Code / Selector
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={form.colorHex || "#FFFFFE"}
                onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                className="w-10 h-10 border border-slate-200 rounded cursor-pointer p-0.5"
              />
              <input
                type="text"
                placeholder="#FAFAFA"
                value={form.colorHex || ""}
                onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition font-mono"
              />
            </div>
          </div>

          {/* Color Group ID - HIDE editing to make it strictly automatically managed */}
          <div className="flex flex-col md:col-span-2 bg-[#FAF9F6] border border-dashed border-slate-200 rounded-xl p-4 font-sans">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">
                  Color Group Reference ID
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {form.colorGroup || "To be generated automatically"}
                </span>
              </div>
              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-600 font-bold uppercase shrink-0">
                Managed Automatically
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Variant Workspace card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Color Variant Settings Workspace
            </h4>
            <p className="text-slate-500 text-xs mt-0.5 font-sans">
              Manage parent/sibling catalog entries connected to this group
              index.
            </p>
          </div>
          {form.colorGroup && (
            <button
              type="button"
              onClick={handleAddNewColorVariant}
              className="flex items-center space-x-1.5 self-start bg-amber-50 hover:bg-amber-100 text-[#c5a880] border border-amber-200/50 hover:border-amber-300 font-semibold text-xs px-3.5 py-2.5 rounded-lg transition font-sans"
            >
              <RiAddLine size={14} />
              <span>Add Color Variant</span>
            </button>
          )}
        </div>

        {/* loading and list panel */}
        {loadingVariants ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse font-semibold">
            Retrieving variant cluster...
          </div>
        ) : variants.length <= 1 ? (
          <div className="bg-slate-50 border rounded-lg p-5 text-center text-xs text-slate-400 font-sans">
            {form.colorGroup
              ? "No sibling variants registered for this product yet. Click 'Add Color Variant' to start."
              : "Save this base product details first to start registering color variants."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants.map((sibling) => {
              const isCurrent = sibling._id === form._id;
              const totalStock = Object.values(sibling.sizesStock || {}).reduce(
                (a, b) => Number(a) + Number(b),
                0,
              );
              return (
                <div
                  key={sibling._id}
                  className={`bg-slate-50 border rounded-lg p-3.5 transition flex flex-col justify-between ${
                    isCurrent
                      ? "ring-2 ring-[#c5a880]/40 border-[#c5a880]"
                      : "hover:border-slate-300"
                  }`}
                >
                  <div className="flex space-x-3 items-center">
                    <img
                      src={sibling.images[0] || "/hero.png"}
                      alt={sibling.name}
                      onError={(e) => {
                        e.target.src = "/hero.png";
                      }}
                      className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0 bg-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-350 inline-block shrink-0 shadow-xxs"
                          style={{
                            backgroundColor: sibling.colorHex || "#FFFFFF",
                          }}
                          title={sibling.color}
                        />
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {sibling.color || "Ivory"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate uppercase">
                        SKU: {sibling.sku}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 font-sans">
                        Price: ₹{sibling.price} | Stock: {totalStock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center pt-2.5 border-t border-slate-100 font-sans">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded ${
                        sibling.status === "active"
                          ? "bg-emerald-58 bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : sibling.status === "draft"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-purple-58 bg-purple-50 text-purple-700 border border-purple-100"
                      }`}
                    >
                      {sibling.status}
                    </span>

                    {isCurrent ? (
                      <span className="text-[10px] text-slate-400 italic font-semibold">
                        Editing Current
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchSibling(sibling)}
                        className="text-[10px] text-[#c5a880] hover:text-[#b0936b] font-bold hover:underline"
                      >
                        Switch &amp; Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// TAB 5: VISIBILITY CHECKMARKS
export const ProductVisibilityTab = () => {
  const { form, setForm } = useProductWizard();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Visibility & Inventory
        </h4>
        <p className="text-slate-500 text-xs mt-0.5">
          Toggle homepage badges, listing tags, and specify available stock
          levels.
        </p>
      </div>
      <div className="space-y-4">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
          Homepage Section Badges Placement
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: "featured",
              label: "Place in Hero Showcase (Featured)",
              desc: "Highlight prominently inside website's primary layout slider",
            },
            {
              id: "trending",
              label: "Vibe matches Trending Styles",
              desc: "Inject inside the curated trending classics vertical grid",
            },
            {
              id: "bestSeller",
              label: "Tag as Best Seller badge",
              desc: "Displays a 'Best Seller' catalog badge over card page details",
            },
            {
              id: "newArrival",
              label: "Include in New Arrivals grid",
              desc: "Renders item above recent design logs for customer collection grid",
            },
            {
              id: "recommended",
              label: "Recommend in suggested ensembles suggestions",
              desc: "Show below product item detail pages suggestion blocks",
            },
          ].map((badge, idx) => (
            <label
              key={idx}
              className="flex items-start space-x-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/50 transition duration-200"
            >
              <input
                type="checkbox"
                checked={form[badge.id] || false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [badge.id]: e.target.checked,
                  })
                }
                className="mt-1 shrink-0 rounded text-accent-gold focus:ring-accent-gold/30 accent-accent-gold"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {badge.label}
                </p>
                <p className="text-[10px] text-slate-550 mt-1">{badge.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Size Stock Management inside Visibility tab */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h5 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          Available size stocks
        </h5>
        <div className="grid grid-cols-4 gap-3.5">
          {["M", "L", "XL", "XXL"].map((sz, idx) => (
            <div key={idx} className="flex flex-col text-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Size {sz}
              </label>
              <input
                type="number"
                value={form.sizesStock?.[sz] || 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sizesStock: {
                      ...form.sizesStock,
                      [sz]: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-center text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Size Chart & Fit Guide Configuration */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Size Chart & Fit Guide Configuration
          </h5>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Choose how customers view the size guide for this product.
          </p>
        </div>

        {/* Mode options */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-medium">
          {[
            {
              id: "table",
              label: "Standard Brand Table",
              desc: "Default M-XXL measurements with In/Cm switcher",
            },
            {
              id: "custom_table",
              label: "Custom Measurements",
              desc: "Manually override bust, waist, length per size",
            },
            {
              id: "image",
              label: "Size Chart Image",
              desc: "Upload or link a custom size chart image",
            },
            {
              id: "none",
              label: "No Size Chart",
              desc: "Hide size chart button for this product",
            },
          ].map((opt) => {
            const currentType =
              form.sizeChart?.type === "table" &&
              form.sizeChart?.measurements?.length > 0
                ? "custom_table"
                : form.sizeChart?.type || "table";
            const isChecked = currentType === opt.id;
            return (
              <label
                key={opt.id}
                className={`border p-3 rounded-lg cursor-pointer transition flex flex-col justify-between ${
                  isChecked
                    ? "border-accent-gold bg-amber-50/40 text-slate-900"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600"
                }`}
              >
                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    name="sizeChartType"
                    checked={isChecked}
                    onChange={() => {
                      if (opt.id === "image") {
                        setForm({
                          ...form,
                          sizeChart: {
                            ...(form.sizeChart || {}),
                            type: "image",
                          },
                        });
                      } else if (opt.id === "none") {
                        setForm({
                          ...form,
                          sizeChart: {
                            ...(form.sizeChart || {}),
                            type: "none",
                          },
                        });
                      } else if (opt.id === "custom_table") {
                        const existingMeas = form.sizeChart?.measurements
                          ?.length
                          ? form.sizeChart.measurements
                          : [
                              {
                                size: "M",
                                bust: "38",
                                waist: "34",
                                hip: "42",
                                shoulder: "14.5",
                                length: "45",
                                bottomWaist: "28-32",
                                bottomLength: "37",
                              },
                              {
                                size: "L",
                                bust: "40",
                                waist: "36",
                                hip: "44",
                                shoulder: "15",
                                length: "45",
                                bottomWaist: "32-36",
                                bottomLength: "37.5",
                              },
                              {
                                size: "XL",
                                bust: "42",
                                waist: "38",
                                hip: "46",
                                shoulder: "15.5",
                                length: "46",
                                bottomWaist: "36-40",
                                bottomLength: "38",
                              },
                              {
                                size: "XXL",
                                bust: "44",
                                waist: "40",
                                hip: "48",
                                shoulder: "16",
                                length: "46",
                                bottomWaist: "40-44",
                                bottomLength: "38.5",
                              },
                            ];
                        setForm({
                          ...form,
                          sizeChart: {
                            ...(form.sizeChart || {}),
                            type: "table",
                            measurements: existingMeas,
                          },
                        });
                      } else {
                        // Standard table (clears custom overrides)
                        setForm({
                          ...form,
                          sizeChart: {
                            ...(form.sizeChart || {}),
                            type: "table",
                            measurements: [],
                          },
                        });
                      }
                    }}
                    className="mt-0.5 text-accent-gold focus:ring-accent-gold"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-800">
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* IMAGE UPLOAD / URL INPUT */}
        {form.sizeChart?.type === "image" && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
            <label className="text-xs font-semibold text-slate-700 block">
              Size Chart Image URL or File
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Paste size chart image URL (e.g. https://... or /images/...)"
                value={form.sizeChart?.imageUrl || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sizeChart: {
                      ...(form.sizeChart || {}),
                      type: "image",
                      imageUrl: e.target.value,
                    },
                  })
                }
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent-gold font-mono"
              />
              <label className="bg-accent-gold hover:bg-yellow-600 text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition flex items-center justify-center shrink-0 shadow-sm">
                Upload File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setForm({
                          ...form,
                          sizeChart: {
                            ...(form.sizeChart || {}),
                            type: "image",
                            imageUrl: reader.result,
                          },
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            {form.sizeChart?.imageUrl && (
              <div className="mt-2 text-center p-2 border border-slate-200 rounded-lg bg-white max-w-xs">
                <img
                  src={form.sizeChart.imageUrl}
                  alt="Size Chart Preview"
                  className="max-h-40 mx-auto rounded object-contain"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  Image Preview
                </p>
              </div>
            )}
          </div>
        )}

        {/* CUSTOM MEASUREMENTS TABLE INPUT */}
        {form.sizeChart?.type === "table" &&
          form.sizeChart?.measurements?.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in overflow-x-auto">
              <label className="text-xs font-semibold text-slate-700 block">
                Custom Garment Measurements (Inches)
              </label>
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-white text-slate-600 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                    <th className="py-2 px-2 text-left">Size</th>
                    <th className="py-2 px-2">Bust</th>
                    <th className="py-2 px-2">Waist</th>
                    <th className="py-2 px-2">Hip</th>
                    <th className="py-2 px-2">Shoulder</th>
                    <th className="py-2 px-2">Kurta Length</th>
                    <th className="py-2 px-2">Pant Waist</th>
                    <th className="py-2 px-2">Pant Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {form.sizeChart.measurements.map((m, idx) => (
                    <tr key={m.size} className="bg-white">
                      <td className="py-2 px-2 text-left font-bold text-slate-800">
                        {m.size}
                      </td>
                      {[
                        "bust",
                        "waist",
                        "hip",
                        "shoulder",
                        "length",
                        "bottomWaist",
                        "bottomLength",
                      ].map((field) => (
                        <td key={field} className="py-1 px-1">
                          <input
                            type="text"
                            value={m[field] || ""}
                            onChange={(e) => {
                              const newMeas = [
                                ...form.sizeChart.measurements,
                              ];
                              newMeas[idx] = {
                                ...newMeas[idx],
                                [field]: e.target.value,
                              };
                              setForm({
                                ...form,
                                sizeChart: {
                                  ...(form.sizeChart || {}),
                                  measurements: newMeas,
                                },
                              });
                            }}
                            className="w-14 bg-slate-50 border border-slate-200 rounded p-1 text-center font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-accent-gold"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};

// TAB 6: META SEO
export const ProductSeoTab = () => {
  const { form, setForm } = useProductWizard();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-slate-950">
          SEO Metadata Settings
        </h4>
        <p className="text-slate-500 text-xs mt-0.5">
          Optimize search rankings and URLs for direct product listings.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Meta SEO Title Tag
          </label>
          <input
            type="text"
            placeholder="e.g. Elysian Gold Suit Set - Shop Online | Pariwesh Boutique"
            value={form.seoTitle || ""}
            onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Meta SEO Description
          </label>
          <textarea
            rows={2.5}
            placeholder="Bespoke linen garments designed for weddings..."
            value={form.seoDescription || ""}
            onChange={(e) =>
              setForm({
                ...form,
                seoDescription: e.target.value,
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Meta Keywords (Comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g. chanderi, suit set, luxury apparel, ethnic gown"
            value={form.metaKeywords || ""}
            onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
            Canonical URL Link
          </label>
          <input
            type="text"
            placeholder="https://pariwesh.co/product/elysian-gold-chanderi"
            value={form.canonicalUrl || ""}
            onChange={(e) =>
              setForm({
                ...form,
                canonicalUrl: e.target.value,
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition font-mono"
          />
        </div>
      </div>
    </div>
  );
};

// TAB 7: MEDIA ASSETS
export const ProductMediaTab = () => {
  const {
    form,
    setForm,
    dragOver,
    setDragOver,
    validateImageFile,
    handleImageFileChange,
    handleVideoFileChange,
    handleUrlImageAdd,
  } = useProductWizard();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-slate-950">Media Assets</h4>
        <p className="text-slate-500 text-xs mt-0.5">
          Upload high fidelity imagery views and promotional feature loops.
        </p>
      </div>

      {/* File Selector slots drops wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const files = Array.from(e.dataTransfer.files);
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
          }}
          className={`border border-dashed p-6.5 rounded-xl text-center flex flex-col justify-center items-center space-y-3.5 transition-all ${
            dragOver
              ? "border-[#c5a880] bg-amber-50/20"
              : "border-slate-300 relative bg-slate-50 hover:bg-slate-100/50"
          }`}
        >
          <RiFolderImageLine
            className={dragOver ? "text-[#c5a880]" : "text-slate-400"}
            size={36}
          />
          <div>
            <p className="text-xs font-semibold text-slate-800">
              Drag & Drop product pictures here
            </p>
            <p className="text-[10px] text-slate-550 mt-1 font-semibold">
              Supports JPG, PNG, WEBP files &lt; 2MB
            </p>
          </div>
          <label className="bg-white hover:bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-accent-gold py-2.5 px-4.5 rounded-lg border border-slate-200 cursor-pointer shadow-sm transition">
            Select Files
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Media Video upload dropzone */}
        <div className="border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 p-6.5 rounded-xl text-center flex flex-col justify-center items-center space-y-3.5 transition">
          <RiVideoLine className="text-slate-400" size={36} />
          <div>
            <p className="text-xs font-semibold text-slate-800">
              Upload Promo Reel Video
            </p>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">
              Supports vertical reels (MP4, WebM &lt; 25MB)
            </p>
          </div>
          <label className="bg-white hover:bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-accent-gold py-2.5 px-4.5 rounded-lg border border-slate-200 cursor-pointer shadow-sm transition">
            Select Video File
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleVideoFileChange(e)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Add Direct URL Fields (Images & Videos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Direct Image URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Add Image URL directly
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              id="direct-image-url"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-accent-gold/50"
            />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("direct-image-url");
                if (el && el.value.trim()) {
                  handleUrlImageAdd(el.value.trim());
                  el.value = "";
                }
              }}
              className="bg-accent-gold text-slate-950 text-xs font-bold px-4 rounded-lg hover:bg-yellow-500 transition shadow-sm shrink-0 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Direct Video URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Add Video URL directly (MP4/CDN link)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="https://res.cloudinary.com/.../video.mp4"
              id="direct-video-url"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-accent-gold/50"
            />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("direct-video-url");
                if (el && el.value.trim()) {
                  const url = el.value.trim();
                  setForm((prev) => {
                    const cur = Array.isArray(prev.videos)
                      ? [...prev.videos]
                      : prev.video
                      ? [prev.video]
                      : [];
                    cur.push(url);
                    return { ...prev, video: cur[0] || "", videos: cur };
                  });
                  el.value = "";
                }
              }}
              className="bg-slate-800 text-white text-xs font-bold px-4 rounded-lg hover:bg-slate-900 transition shadow-sm shrink-0 cursor-pointer"
            >
              Add Video
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded Videos list preview & management */}
      {(() => {
        const videoList =
          Array.isArray(form.videos) && form.videos.length > 0
            ? form.videos
            : form.video
            ? [form.video]
            : [];
        if (videoList.length === 0) return null;

        return (
          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[10px] flex items-center space-x-2">
                <RiFilmLine className="text-[#c5a880]" size={14} />
                <span>Enrolled Product Videos ({videoList.length})</span>
              </p>
              <label className="text-[10px] font-bold text-[#8a1c14] bg-amber-50 hover:bg-amber-100 border border-[#c5a880]/40 px-3 py-1 rounded-full cursor-pointer transition shadow-2xs">
                + Add Another Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoFileChange(e)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {videoList.map((vidUrl, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm flex flex-col group"
                >
                  {/* Embedded Video Player */}
                  <div className="relative aspect-[9/16] max-h-56 w-full bg-black flex items-center justify-center overflow-hidden">
                    <video
                      src={vidUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute top-2 left-2 bg-black/75 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">
                      {idx === 0 ? "★ Primary Reel" : `Video #${idx + 1}`}
                    </span>
                  </div>

                  {/* Action bar below video */}
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Replace / Change Video button */}
                    <label className="flex-1 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10.5px] font-bold py-1.5 px-2 rounded-lg border border-slate-200 cursor-pointer transition">
                      Replace Video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoFileChange(e, idx)}
                        className="hidden"
                      />
                    </label>

                    {/* Delete / Remove Video button */}
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          const cur = Array.isArray(prev.videos)
                            ? [...prev.videos]
                            : prev.video
                            ? [prev.video]
                            : [];
                          const updated = cur.filter((_, i) => i !== idx);
                          return {
                            ...prev,
                            video: updated[0] || "",
                            videos: updated,
                          };
                        });
                      }}
                      className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 transition cursor-pointer"
                      title="Delete / Remove Video"
                    >
                      <RiDeleteBinLine size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Uploaded Images slots list preview */}
      {form.images.length > 0 && (
        <div className="space-y-3.5 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[10px]">
            Enrolled pictures ({form.images.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {form.images.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] shadow-sm animate-fade-in"
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== idx),
                    }));
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition duration-200 z-10"
                >
                  <RiCloseLine size={12} />
                </button>

                {/* Image Sorting arrows overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition duration-200 bg-white/90 backdrop-blur-md border border-slate-100 rounded-lg px-2 py-1 shadow-md z-10">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      setForm((prev) => {
                        const nextImg = [...prev.images];
                        const tmp = nextImg[idx];
                        nextImg[idx] = nextImg[idx - 1];
                        nextImg[idx - 1] = tmp;
                        return { ...prev, images: nextImg };
                      });
                    }}
                    className="text-xs text-slate-500 hover:text-accent-gold disabled:opacity-30 disabled:pointer-events-none p-0.5"
                    title="Move Left"
                  >
                    &larr;
                  </button>
                  <span className="text-[8px] font-extrabold text-slate-700 uppercase tracking-widest text-center">
                    {idx === 0 ? "Cover" : `#${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    disabled={idx === form.images.length - 1}
                    onClick={() => {
                      setForm((prev) => {
                        const nextImg = [...prev.images];
                        const tmp = nextImg[idx];
                        nextImg[idx] = nextImg[idx + 1];
                        nextImg[idx + 1] = tmp;
                        return { ...prev, images: nextImg };
                      });
                    }}
                    className="text-xs text-slate-500 hover:text-accent-gold disabled:opacity-30 disabled:pointer-events-none p-0.5"
                    title="Move Right"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
