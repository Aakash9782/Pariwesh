import React from "react";
import { useProductWizard } from "./ProductWizardContext.jsx";
import { RiFolderImageLine, RiCloseLine } from "react-icons/ri";

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
  const { form, setForm } = useProductWizard();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Clothing Specifications
        </h4>
        <p className="text-slate-500 text-xs mt-0.5">
          Specify material textures, weights, and laundering instructions.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Fabric Weight
          </label>
          <input
            type="text"
            placeholder="e.g. 380 grams/sqm"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Wash Care instructions
          </label>
          <input
            type="text"
            placeholder="e.g. Cold dry clean preferred, low steam iron"
            value={form.washCare}
            onChange={(e) => setForm({ ...form, washCare: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Material composition
          </label>
          <input
            type="text"
            placeholder="e.g. 80% linen, 20% cotton"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
            Shipping Weight
          </label>
          <input
            type="text"
            placeholder="e.g. 480g"
            value={form.shippingWeight}
            onChange={(e) =>
              setForm({
                ...form,
                shippingWeight: e.target.value,
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Country of Origin
          </label>
          <input
            type="text"
            placeholder="India"
            value={form.countryOfOrigin}
            onChange={(e) =>
              setForm({
                ...form,
                countryOfOrigin: e.target.value,
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
            Return Allowance Period (Days)
          </label>
          <input
            type="number"
            placeholder="7"
            value={form.returnDays}
            onChange={(e) => setForm({ ...form, returnDays: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>

        {/* Product Color Name */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Product Color Name
          </label>
          <input
            type="text"
            placeholder="e.g. Bright Violet, Crimson Red"
            value={form.color || ""}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
          />
        </div>

        {/* Color HEX Code */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Color HEX Code
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={form.colorHex || "#FAFAFA"}
              onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
              className="w-10 h-10 border border-slate-200 rounded cursor-pointer p-0.5"
            />
            <input
              type="text"
              placeholder="#FAFAFA"
              value={form.colorHex || ""}
              onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition font-mono"
            />
          </div>
        </div>

        {/* Color Group ID */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-sans">
            Color Group ID (to link variants together)
          </label>
          <input
            type="text"
            placeholder="e.g. chanderi-silk-suit-set"
            value={form.colorGroup || ""}
            onChange={(e) => setForm({ ...form, colorGroup: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition font-mono"
          />
        </div>
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
        <div className="grid grid-cols-5 gap-3.5">
          {["S", "M", "L", "XL", "XXL"].map((sz, idx) => (
            <div key={idx} className="flex flex-col text-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Size {sz}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-center text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition"
              />
            </div>
          ))}
        </div>
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

        {/* Media Video upload */}
        <div className="border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 p-6.5 rounded-xl text-center flex flex-col justify-center items-center space-y-3.5 transition">
          <RiFolderImageLine className="text-slate-400" size={36} />
          <div>
            <p className="text-xs font-semibold text-slate-805 text-slate-800">
              Upload Promo Reel Video
            </p>
            <p className="text-[10px] text-slate-550 mt-1 font-semibold">
              Max 15 seconds short vertical video (&lt; 10MB)
            </p>
          </div>
          <label className="bg-white hover:bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-accent-gold py-2.5 px-4.5 rounded-lg border border-slate-200 cursor-pointer shadow-sm">
            Upload Video
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="hidden"
            />
          </label>
          {form.video && (
            <p className="text-[9px] text-emerald-600 font-mono font-bold">
              Video Attached (Ready to save)
            </p>
          )}
        </div>
      </div>

      {/* Add URL field fallback */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-slate-700 text-slate-700 block">
          Or add Image URL directly
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="https://images.unsplash.com/your-image-address"
            id="direct-image-url"
            className="w-full bg-slate-50 border border-slate-202 border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-accent-gold/50"
          />
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("direct-image-url");
              if (el) {
                handleUrlImageAdd(el.value);
                el.value = "";
              }
            }}
            className="bg-accent-gold text-slate-950 text-xs font-bold px-5 rounded-lg hover:bg-yellow-500 transition shadow-sm font-sans"
          >
            Add
          </button>
        </div>
      </div>

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
