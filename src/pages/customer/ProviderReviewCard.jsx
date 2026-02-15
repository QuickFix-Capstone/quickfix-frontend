import { Briefcase } from "lucide-react";
import Card from "../../components/UI/Card";
import StarRating from "../../components/UI/StarRating";

export default function ProviderReviewCard({ review }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Briefcase className="h-5 w-5 text-purple-600" />
          </div>

          {/* Provider Info */}
          <div>
            <p className="font-semibold text-neutral-900">
              {review.provider_name || "Service Provider"}
            </p>
            {review.provider_rating && (
              <p className="text-xs text-neutral-500">
                Provider Rating: {review.provider_rating.toFixed(1)} ⭐
              </p>
            )}
            <p className="text-xs text-neutral-500">
              {review.created_at ? formatDate(review.created_at) : "Recently"}
            </p>
          </div>
        </div>

        {/* Star Rating */}
        <StarRating value={review.rating} readOnly size="sm" />
      </div>

      {/* Service Info */}
      {review.service_title && (
        <div className="mb-2">
          <p className="text-xs font-medium text-neutral-600">
            Service: {review.service_title}
          </p>
        </div>
      )}

      {/* Review Comment */}
      {review.comment && (
        <p className="text-sm text-neutral-700 leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Empty state if no comment */}
      {!review.comment && (
        <p className="text-sm italic text-neutral-400">
          No written feedback provided
        </p>
      )}
    </Card>
  );
}
