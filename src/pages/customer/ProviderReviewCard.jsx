import { Star } from "lucide-react";
import Card from "../../components/UI/Card";

function StarDisplay({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-neutral-200 text-neutral-200"
                        }`}
                />
            ))}
        </div>
    );
}

export default function ProviderReviewCard({ review }) {
    const date = review.created_at
        ? new Date(review.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "";

    return (
        <Card className="border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Provider info */}
            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                    {(review.provider?.name || review.reviewer_name || "P")
                        .charAt(0)
                        .toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-neutral-900 text-sm">
                        {review.provider?.name || review.reviewer_name || "Service Provider"}
                    </p>
                    {date && (
                        <p className="text-xs text-neutral-500">{date}</p>
                    )}
                </div>
            </div>

            {/* Rating */}
            <div className="mb-3">
                <StarDisplay rating={review.rating} />
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-sm text-neutral-700 leading-relaxed">
                    &ldquo;{review.comment}&rdquo;
                </p>
            )}

            {/* Service info */}
            {(review.service_description || review.job_title) && (
                <p className="mt-3 text-xs text-neutral-500 border-t border-neutral-100 pt-2">
                    Re: {review.service_description || review.job_title}
                </p>
            )}
        </Card>
    );
}
