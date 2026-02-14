import React, { useState } from "react";
import { X, Star } from "lucide-react";
import Button from "../UI/Button";
import Card from "../UI/Card";

export default function ReviewModal({ isOpen, onClose, job, onSubmit }) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            alert("Please select a rating");
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                jobId: job.job_id,
                rating,
                comment: comment.trim(),
            });
            
            // Reset form
            setRating(0);
            setComment("");
            onClose();
        } catch (error) {
            console.error("Failed to submit review:", error);
            alert("Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="relative w-full max-w-lg bg-white p-6 shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900">Write a Review</h2>
                    <p className="mt-1 text-sm text-neutral-600">
                        Share your experience with this service
                    </p>
                </div>

                {/* Job Info */}
                <div className="mb-6 rounded-lg bg-neutral-50 p-4">
                    <p className="font-semibold text-neutral-900">{job.title}</p>
                    {job.provider_name && (
                        <p className="text-sm text-neutral-600 mt-1">
                            Provider: {job.provider_name}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Star Rating */}
                    <div className="mb-6">
                        <label className="mb-3 block text-sm font-medium text-neutral-700">
                            Rating
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-10 w-10 ${
                                            star <= (hoveredRating || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-neutral-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="mt-2 text-sm text-neutral-600">
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
                        <label
                            htmlFor="comment"
                            className="mb-2 block text-sm font-medium text-neutral-700"
                        >
                            Comment (Optional)
                        </label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share details about your experience..."
                            rows={4}
                            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            maxLength={500}
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                            {comment.length}/500 characters
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={submitting || rating === 0}
                        >
                            {submitting ? "Submitting..." : "Submit Review"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
