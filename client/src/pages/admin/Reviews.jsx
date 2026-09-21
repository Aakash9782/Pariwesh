import React, { useState, useEffect } from "react";
import API from "../../services/api.js";
import { useAlert } from "../../contexts/AlertContext.jsx";
import PageHeader from "../../components/admin/ui/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import {
  RiStarFill,
  RiStarLine,
  RiSearchLine,
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiShieldCheckLine,
  RiChat1Line,
  RiWhatsappLine,
} from "react-icons/ri";

const AdminReviews = () => {
  const { showAlert } = useAlert();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalReviews: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = `/reviews/admin?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`;
      const res = await API.get(url);
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error("fetchReviews error:", err);
      showAlert(err.response?.data?.message || "Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      if (res.data?.success) {
        setProductsList(res.data.data || []);
      }
    } catch (err) {
      console.error("fetchProducts error:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await API.patch(`/reviews/admin/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        showAlert(`Review marked as ${newStatus}`, "success");
        fetchReviews();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Action failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      const res = await API.delete(`/reviews/admin/${id}`);
      if (res.data?.success) {
        showAlert("Review deleted successfully", "success");
        fetchReviews();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleSaveManualReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showAlert("Please select a product", "error");
      return;
    }
    if (!customerName.trim()) {
      showAlert("Please enter customer name & city", "error");
      return;
    }
    if (!reviewComment.trim()) {
      showAlert("Please enter feedback comment", "error");
      return;
    }

    try {
      setSavingManual(true);
      const res = await API.post("/reviews/admin/manual", {
        productId: selectedProduct,
        name: customerName.trim(),
        rating: ratingVal,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });

      if (res.data?.success) {
        showAlert("WhatsApp/Client review added successfully!", "success");
        setShowAddModal(false);
        setCustomerName("");
        setReviewTitle("");
        setReviewComment("");
        setRatingVal(5);
        fetchReviews();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to add review", "error");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Customer Ratings & Reviews"
        description="Monitor, approve, and manage customer reviews. Easily feature verified client feedback from WhatsApp or Instagram."
      >
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold py-2.5 px-4"
        >
          <RiWhatsappLine className="text-emerald-300 text-base" />
          <span>+ Add WhatsApp / Insta Review</span>
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Reviews
            </span>
            <RiChat1Line className="text-amber-600 text-lg" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-serif">
            {stats.totalReviews}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across full catalog</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Approved Live
            </span>
            <RiCheckLine className="text-emerald-600 text-lg" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-serif">
            {stats.approved}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Visible on store pages</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Pending Approval
            </span>
            <RiShieldCheckLine className="text-amber-600 text-lg" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2 font-serif">
            {stats.pending}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting moderation</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">
              Rejected / Hidden
            </span>
            <RiCloseLine className="text-red-500 text-lg" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2 font-serif">
            {stats.rejected}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Hidden from store</p>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: "All Reviews", val: "all" },
              { label: `Approved (${stats.approved})`, val: "approved" },
              { label: `Pending (${stats.pending})`, val: "pending" },
              { label: `Rejected (${stats.rejected})`, val: "rejected" },
            ].map((tab) => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setStatusFilter(tab.val)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.val
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-3 top-2.5 text-slate-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, keyword, or title..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </Card>

      {/* Reviews Table / List */}
      <Card className="p-0 overflow-hidden bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Loading reviews data...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-sm text-slate-700">No reviews found</p>
            <p className="text-slate-400">Try changing your search term or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Customer & City</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Review Content</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {reviews.map((r) => {
                  const productImg = r.product?.images?.[0] || "/hero.png";
                  const productName = r.product?.name || "Unassigned Product";
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5 max-w-xs">
                          <img
                            src={productImg}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate text-xs">
                              {productName}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              SKU: {r.product?.sku || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{r.name}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {r.verifiedPurchase && (
                            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              ✓ Verified
                            </span>
                          )}
                          {r.source === "admin_import" && (
                            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              WhatsApp
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <RiStarFill
                              key={s}
                              size={12}
                              className={s <= r.rating ? "text-amber-500" : "text-slate-200"}
                            />
                          ))}
                          <span className="text-slate-700 font-bold ml-1 text-xs">{r.rating}.0</span>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="py-3 px-4 max-w-md">
                        {r.title && (
                          <span className="font-bold text-slate-800 block truncate mb-0.5">
                            "{r.title}"
                          </span>
                        )}
                        <p className="text-slate-600 line-clamp-2 text-xs">{r.comment}</p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            r.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : r.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r._id, "approved")}
                              title="Approve & Show Live"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            >
                              <RiCheckLine size={15} />
                            </button>
                          )}
                          {r.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r._id, "rejected")}
                              title="Reject & Hide"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-amber-200"
                            >
                              <RiCloseLine size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(r._id)}
                            title="Delete Permanently"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-red-200"
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
          </div>
        )}
      </Card>

      {/* ADD WHATSAPP / INSTA REVIEW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-left">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <RiCloseLine size={20} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                <RiWhatsappLine size={13} />
                <span>Feature WhatsApp Feedback</span>
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 font-serif">
                Add Verified Customer Review
              </h3>
              <p className="text-xs text-slate-500">
                Paste real customer praise received on WhatsApp or Instagram directly to the product.
              </p>
            </div>

            <form onSubmit={handleSaveManualReview} className="space-y-3.5 text-xs font-sans">
              {/* Product Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Product <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-[#c5a880]"
                >
                  <option value="">-- Choose Product from Catalog --</option>
                  {productsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Star Rating (1 - 5)
                </label>
                <div className="flex items-center space-x-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-xl cursor-pointer"
                    >
                      {star <= ratingVal ? (
                        <RiStarFill className="text-amber-500" />
                      ) : (
                        <RiStarLine className="text-slate-300" />
                      )}
                    </button>
                  ))}
                  <span className="font-bold text-slate-700 ml-2">{ratingVal} Stars</span>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer Name & City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Pooja S., Jaipur"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Farshi salwar ka ghera lajawab hai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer Message / Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Paste customer WhatsApp message here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 bg-gradient-to-r from-[#d2b68e] to-[#a8865a] hover:from-[#dbbf97] hover:to-[#b39062] text-white font-bold rounded-lg uppercase tracking-wider text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingManual ? "Saving..." : "Publish Live Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
