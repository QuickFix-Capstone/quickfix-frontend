import { Star } from "lucide-react";
import { formatDate } from "../../utils/format";

export default function ReviewCard({ review }) {
  const rating = Number(review?.rating || 0);

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-4 w-4 ${
                value <= rating
                  ? "fill-yellow-400 stroke-yellow-400"
                  : "fill-neutral-200 stroke-neutral-300"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          {formatDate(review?.created_at)}
        </p>
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-700">
        {review?.comment?.trim() || "No comment provided."}
      </p>
    </article>
  );
}
