import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";
import Button from "../../components/UI/Button";
import Card from "../../components/UI/Card";
import { getMyReviews, deleteReview } from "../../api/reviews";
import ReviewCard from "./ReviewCard";

export default function MyReviews() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/customer/login");
      return;
    }

    const fetchReviews = async () => {
      try {
        const data = await getMyReviews(50);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [auth.isAuthenticated, navigate]);

  const handleDelete = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.review_id !== reviewId));
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-neutral-500">Loading your reviews...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/customer/dashboard")}
            variant="ghost"
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">My Reviews</h1>
              <p className="text-neutral-600">
                Manage all your reviews for service providers
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <Star className="h-10 w-10 text-neutral-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-neutral-900">
              No Reviews Yet
            </h2>
            <p className="mb-6 text-neutral-600">
              You haven't left any reviews for service providers yet.
            </p>
            <Button onClick={() => navigate("/customer/bookings")}>
              View Bookings
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Card className="border-0 bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {reviews.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-0 bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Star className="h-6 w-6 text-green-600 fill-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Average Rating</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {(
                        reviews.reduce((sum, r) => sum + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-0 bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">5-Star Reviews</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {reviews.filter((r) => r.rating === 5).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Reviews Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <div key={review.review_id} className="relative">
                  <ReviewCard review={review} />
                  <div className="mt-2 flex gap-2">
                    <Button
                      onClick={() =>
                        navigate(`/customer/reviews/${review.review_id}/edit`)
                      }
                      variant="outline"
                      className="flex-1 text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(review.review_id)}
                      variant="outline"
                      className="flex-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
