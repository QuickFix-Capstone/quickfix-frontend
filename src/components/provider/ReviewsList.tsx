import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import ReviewCard from "./ReviewCard";

export default function ReviewsList({ reviews, onPageChange }) {
  const items = reviews?.items || [];
  const page = reviews?.page || 1;
  const totalPages = reviews?.total_pages || 1;
  const hasPrev = Boolean(reviews?.has_prev);
  const hasNext = Boolean(reviews?.has_next);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-neutral-900">Reviews</h2>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((review) => (
            <ReviewCard
              key={review.review_id || `${review.created_at}-${review.rating}`}
              review={review}
            />
          ))
        ) : (
          <EmptyState
            title="No reviews yet."
            description="Once customers leave feedback, it will show up here."
          />
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => hasPrev && onPageChange(page - 1)}
        onNext={() => hasNext && onPageChange(page + 1)}
      />
    </section>
  );
}
