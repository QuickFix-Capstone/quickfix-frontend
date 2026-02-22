import { formatRating } from "../../utils/format";

function getCounts(distribution = {}) {
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: Number(distribution?.[String(star)] || 0),
  }));
}

export default function RatingDistribution({ distribution, reviewCount, avg }) {
  const counts = getCounts(distribution);
  const derivedTotal = counts.reduce((sum, item) => sum + item.count, 0);
  const total = Number(reviewCount || 0) || derivedTotal;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-neutral-900">Rating Summary</h2>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-neutral-900">{formatRating(avg)}</p>
        <p className="text-sm text-neutral-500">{total} reviews</p>
      </div>

      <div className="mt-5 space-y-2.5">
        {counts.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.star} className="flex items-center gap-3">
              <p className="w-6 text-sm text-neutral-700">{item.star}★</p>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="w-8 text-right text-xs text-neutral-500">
                {item.count}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
