import { useState } from "react";
import { X } from "lucide-react";
import Button from "../../components/UI/Button";
import StarRating from "../../components/UI/StarRating";
import Card from "../../components/UI/Card";

export default function ReviewForm({ booking, onSubmit, onCancel, isSubmitting = false }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }

    setError("");
    await onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg bg-white p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Leave a Review</h2>
            <p className="mt-1 text-sm text-neutral-600">
              How was your experience with {booking?.provider?.name || "this service provider"}?
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Service Details */}
        <div className="mb-6 rounded-lg bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-700">
            {booking?.service_description || "Service"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {booking?.scheduled_date && new Date(booking.scheduled_date).toLocaleDateString()}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-neutral-700">
              Your Rating *
            </label>
            <div className="flex justify-center">
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            {rating > 0 && (
              <p className="mt-2 text-center text-sm text-neutral-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with others..."
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
