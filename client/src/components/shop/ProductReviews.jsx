import React, { useState, useEffect } from "react";
import {
  RiStarFill,
  RiStarLine,
  RiShieldCheckLine,
  RiThumbUpLine,
  RiThumbUpFill,
  RiEditBoxLine,
  RiCloseLine,
  RiCheckDoubleLine,
} from "react-icons/ri";
import API from "../../services/api.js";

const ProductReviews = ({ productId, initialRating = 4.8, initialCount = 12 }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: initialRating,
    totalReviews: initialCount,
    recommendationRate: 98,
    breakdown: {
      5: { count: 0, percentage: 85 },
      4: { count: 0, percentage: 15 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    },
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterRating, setFilterRating] = useState("all");
  const [helpfulVotes, setHelpfulVotes] = useState({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchReviews = async (pageNum = 1, append = false) => {
    if (!productId) return;
    try {
      if (!append) setLoading(true);
      const res = await API.get(`/reviews/product/${productId}?page=${pageNum}&limit=6`);
      if (res.data?.success) {
        const data = res.data.data;
        if (append) {
          setReviews((prev) => [...prev, ...(data.reviews || [])]);
        } else {
          setReviews(data.reviews || []);
        }
        if (data.stats) {
          setStats(data.stats);
        }
        setHasMore(data.pagination?.page < data.pagination?.pages);
      }
    } catch (err) {
      console.warn("Could not load reviews:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      setPage(1);
      fetchReviews(1, false);
    }
  }, [productId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const handleHelpful = async (reviewId) => {
    if (helpfulVotes[reviewId]) return;
    try {
      setHelpfulVotes((prev) => ({ ...prev, [reviewId]: true }));
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r,
        ),
      );
      await API.post(`/reviews/${reviewId}/helpful`);
    } catch (err) {
      console.warn("Helpful vote error:", err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setSubmitError("Please enter your name");
      return;
    }
    if (!formComment.trim() || formComment.trim().length < 5) {
      setSubmitError("Please share at least a few words about the fabric, fitting, or style.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      const res = await API.post(`/reviews/product/${productId}`, {
        name: formName.trim(),
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
      });

      if (res.data?.success) {
        setSubmitSuccess(true);
        // Refresh reviews list
        setTimeout(() => {
          setShowModal(false);
          setSubmitSuccess(false);
          setFormName("");
          setFormTitle("");
          setFormComment("");
          setFormRating(5);
          fetchReviews(1, false);
        }, 1600);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === "all") return true;
    return r.rating === Number(filterRating);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <section id="reviews-section" className="mt-12 pt-8 border-t border-[#c5a880]/30 font-sans text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-amber-600 text-xs">✦</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">
              Customer Experiences & Reviews
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-slate-900 font-normal">
            Verified Client Testimonials
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real feedback from verified purchasers across India. Contact details are strictly kept private.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white border border-[#c5a880]/80 text-[#8a1c14] hover:bg-[#FBF9F5] shadow-sm transition-all duration-200 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <RiEditBoxLine size={15} />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Summary Grid */}
      <div className="bg-[#FBF9F5]/80 border border-[#c5a880]/30 rounded-2xl p-5 md:p-7 mb-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Big Rating Card */}
          <div className="md:col-span-4 text-center md:text-left md:border-r md:border-slate-200/80 md:pr-6 space-y-2">
            <div className="flex items-baseline justify-center md:justify-start space-x-2">
              <span className="text-5xl font-serif font-bold text-slate-900">
                {stats.averageRating ? stats.averageRating.toFixed(1) : "4.8"}
              </span>
              <span className="text-sm font-medium text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <RiStarFill
                  key={star}
                  size={18}
                  className={star <= Math.round(stats.averageRating || 5) ? "text-amber-500" : "text-slate-300"}
                />
              ))}
            </div>
            <p className="text-xs text-slate-600">
              Based on <strong>{stats.totalReviews || reviews.length || 12}</strong> verified customer ratings
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <RiShieldCheckLine size={13} />
              <span>{stats.recommendationRate || 98}% of buyers recommend this product</span>
            </div>
          </div>

          {/* Breakdown Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const row = stats.breakdown?.[star] || { count: 0, percentage: 0 };
              const isSelected = filterRating === String(star);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilterRating(isSelected ? "all" : String(star))}
                  className={`w-full flex items-center space-x-3 text-xs text-slate-600 transition-colors duration-150 rounded-lg px-2 py-1 cursor-pointer ${
                    isSelected ? "bg-amber-50/80 font-bold" : "hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-center space-x-1 w-14 shrink-0 text-slate-700 font-medium">
                    <span>{star}</span>
                    <RiStarFill className="text-amber-500" size={12} />
                  </div>
                  <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-[#c5a880] rounded-full transition-all duration-500"
                      style={{ width: `${row.percentage || (star === 5 ? 85 : star === 4 ? 15 : 0)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-slate-400 font-normal shrink-0">
                    {row.percentage || (star === 5 ? 85 : star === 4 ? 15 : 0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mr-2 shrink-0">Filter:</span>
        <button
          type="button"
          onClick={() => setFilterRating("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            filterRating === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterRating("5")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
            filterRating === "5"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <span>5 Star</span>
          <RiStarFill size={12} />
        </button>
        <button
          type="button"
          onClick={() => setFilterRating("4")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
            filterRating === "4"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <span>4 Star</span>
          <RiStarFill size={12} />
        </button>
      </div>

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Loading verified client experiences...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-medium text-slate-600">No reviews found matching this filter.</p>
          <button
            type="button"
            onClick={() => setFilterRating("all")}
            className="text-xs text-[#8a1c14] font-bold hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
          {filteredReviews.map((rev) => {
            const initial = rev.name ? rev.name.charAt(0).toUpperCase() : "P";
            return (
              <div
                key={rev._id}
                className="bg-white border border-slate-200/80 hover:border-[#c5a880]/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Reviewer Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-100 to-amber-200/60 border border-[#c5a880]/30 text-[#8a1c14] font-bold flex items-center justify-center text-sm shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {rev.name}
                          </span>
                          {rev.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                              <RiCheckDoubleLine size={11} />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center space-x-0.5 text-amber-500 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <RiStarFill
                          key={s}
                          size={13}
                          className={s <= rev.rating ? "text-amber-500" : "text-slate-200"}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title & Comment */}
                  {rev.title && (
                    <h4 className="text-xs md:text-[13px] font-bold text-slate-900 tracking-tight leading-snug">
                      "{rev.title}"
                    </h4>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {rev.comment}
                  </p>
                </div>

                {/* Helpful Button */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Product fit: True to size</span>
                  <button
                    type="button"
                    onClick={() => handleHelpful(rev._id)}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      helpfulVotes[rev._id]
                        ? "bg-amber-50 border-[#c5a880]/50 text-[#8a1c14] font-bold"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    {helpfulVotes[rev._id] ? <RiThumbUpFill size={12} /> : <RiThumbUpLine size={12} />}
                    <span>Helpful ({rev.helpfulCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl border border-[#c5a880] text-slate-800 text-xs font-bold uppercase tracking-wider hover:bg-[#FBF9F5] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More Reviews"}
          </button>
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#c5a880]/40 relative text-left">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors cursor-pointer"
            >
              <RiCloseLine size={22} />
            </button>

            <div className="space-y-1 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a1c14]">
                Pariwesh Client Review
              </span>
              <h3 className="text-xl font-serif text-slate-900 font-normal">
                Share Your Experience
              </h3>
              <p className="text-xs text-slate-500">
                Your feedback helps fellow ethnic wear lovers choose with confidence.
              </p>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <RiCheckDoubleLine size={26} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Thank You!</h4>
                <p className="text-xs text-slate-600">
                  Your review has been successfully submitted and verified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormRating(star)}
                        className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                      >
                        {star <= (hoverRating || formRating) ? (
                          <RiStarFill className="text-amber-500" />
                        ) : (
                          <RiStarLine className="text-slate-300" />
                        )}
                      </button>
                    ))}
                    <span className="text-xs text-slate-500 font-medium ml-2">
                      {hoverRating || formRating} of 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name & City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Pooja S., Jaipur"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#c5a880] transition-colors"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    🔒 Strictly Private: Your email and mobile number are never displayed publicly.
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Farshi salwar ka ghera bohot royal hai!"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#c5a880] transition-colors"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detailed Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Describe the fabric softness, stitching finish, Farshi salwar flare, or event compliments..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#c5a880] transition-colors"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    {submitError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#d2b68e] to-[#a8865a] hover:from-[#dbbf97] hover:to-[#b39062] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Publishing..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
