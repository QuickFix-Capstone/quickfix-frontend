import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { API_BASE } from "../../api/config";

export default function ProviderReviews({ providerId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReviews = async ({ sort = "newest", limit = 10, offset = 0 } = {}) => {
    try {
      setLoading(true);
      setError("");

      const url =
        `${API_BASE}/service_provider/reviews/${providerId}` +
        `?sort=${encodeURIComponent(sort)}` +
        `&limit=${encodeURIComponent(limit)}` +
        `&offset=${encodeURIComponent(offset)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch reviews");

      if (offset === 0) {
        setReviews(data.reviews || []);
      } else {
        setReviews((prev) => [...prev, ...(data.reviews || [])]);
      }
      setSummary(data.summary || null);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId) fetchReviews();
  }, [providerId]);

  return (
    <div className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Reviews</h2>
          <p className="mt-1 text-sm text-slate-600">
            Feedback from customers who booked your services.
          </p>
        </div>
        {summary && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`h-4 w-4 ${idx < Math.round(summary.average_rating) ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {summary.average_rating.toFixed(1)}
            </span>
            <span className="text-sm text-slate-400">
              ({summary.total_reviews} review{summary.total_reviews !== 1 ? "s" : ""})
            </span>
          </div>
        )}
      </div>

      {loading && reviews.length === 0 && (
        <p className="text-sm text-slate-400">Loading reviews…</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          No reviews yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <div
              key={review.review_id || i}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-4 w-4 ${idx < review.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium text-slate-700">
                  {review.rating}/5
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600 line-clamp-4">{review.comment}</p>
              )}
              <div className="flex items-center gap-2 mt-auto">
                {review.avatar_url ? (
                  <img
                    src={review.avatar_url}
                    alt={review.customer_name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                    {review.customer_name?.[0] || "?"}
                  </div>
                )}
                <span className="text-xs text-slate-400">{review.customer_name}</span>
                {review.created_at && (
                  <span className="ml-auto text-xs text-slate-300">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination?.has_more && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchReviews({ offset: pagination.next_offset })}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
