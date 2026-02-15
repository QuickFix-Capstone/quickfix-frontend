import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ThumbsUp, Filter } from "lucide-react";
import Button from "../../components/UI/Button";
import Card from "../../components/UI/Card";
import { getReviewsAboutMe } from "../../api/customerReviews";
import ProviderReviewCard from "./ProviderReviewCard";

export default function ReviewsAboutMe() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/customer/login");
      return;
    }

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getReviewsAboutMe({ 
        sort: sortBy, 
        limit: 100, 
        offset: 0 
      });
      setReviews(data.reviews || []);
      setCustomerInfo(data.customer || null);
    } catch (error) {
      console.error("Failed to fetch reviews about me:", error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="text-neutral-500">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/customer/dashboard")}
            variant="outline"
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Reviews About Me
              </h1>
              <p className="mt-1 text-neutral-600">
                Feedback from service providers
              </p>
            </div>
          </div>

          {/* Stats */}
          {customerInfo && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card className="border-0 bg-white p-4 shadow-lg">
                <p className="text-sm text-neutral-600">Total Reviews</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {customerInfo.total_reviews_received || 0}
                </p>
              </Card>
              <Card className="border-0 bg-white p-4 shadow-lg">
                <p className="text-sm text-neutral-600">Average Rating</p>
                <p className="text-2xl font-bold text-purple-600">
                  {averageRating} ⭐
                </p>
              </Card>
              <Card className="border-0 bg-white p-4 shadow-lg">
                <p className="text-sm text-neutral-600">Customer Name</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {customerInfo.name || "N/A"}
                </p>
              </Card>
            </div>
          )}

          {/* Sort Filter */}
          <div className="mt-6 flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Sort by:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
                { value: "highest_rating", label: "Highest Rating" },
                { value: "lowest_rating", label: "Lowest Rating" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? "bg-purple-600 text-white"
                      : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="border border-neutral-200 bg-white p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <ThumbsUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              No Provider Reviews Yet
            </h3>
            <p className="mb-6 text-sm text-neutral-600">
              Service providers haven't left feedback about you yet. Complete more jobs to receive reviews!
            </p>
            <Button
              onClick={() => navigate("/customer/jobs")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              View My Jobs
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ProviderReviewCard key={review.review_id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
