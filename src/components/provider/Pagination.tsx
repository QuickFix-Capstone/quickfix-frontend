export default function Pagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>

      <p className="text-sm text-neutral-600">
        Page {page} of {Math.max(totalPages || 1, 1)}
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
