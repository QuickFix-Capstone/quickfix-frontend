import { User } from "lucide-react";
import Card from "../../components/UI/Card";
import StarRating from "../../components/UI/StarRating";

export default function ReviewCard({ review }) {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>

          {/* Customer Info */}
          <div>
            <p className="font-semibold text-neutral-900">
              {review.customer_name || "You"}
            </p>
            <p className="text-xs text-neutral-500">
              {review.created_at ? formatDate(review.created_at) : "Recently"}
            </p>
          </div>
        </div>

        {/* Star Rating */}
        <StarRating value={review.rating} readOnly size="sm" />
      </div>

      {/* Service Info */}
      {review.service_description && (
        <div className="mb-2">
          <p className="text-xs font-medium text-neutral-600">
            Service: {review.service_description}
          </p>
        </div>
      )}

      {/* Provider Info */}
      {review.provider_name && (
        <div className="mb-2">
          <p className="text-xs text-neutral-500">
            Provider: {review.provider_name}
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
          No written review provided
        </p>
      )}
    </Card>
  );
}
