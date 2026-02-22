import { CalendarDays, MapPin, Star } from "lucide-react";
import { formatDate, formatRating, safeText } from "../../utils/format";

function hasVerifiedBadge(badges = []) {
  return badges.some((badge) => {
    if (typeof badge === "string") return badge.toLowerCase() === "verified";
    const badgeValue = badge?.key || badge?.code || badge?.type || badge?.name;
    return String(badgeValue || "").toLowerCase() === "verified";
  });
}

export default function ProviderHeader({
  provider,
  stats,
  badges,
  onViewServices,
}) {
  const displayName = safeText(
    provider?.display_name || provider?.name || provider?.business_name,
    "Service Provider"
  );
  const location = [safeText(provider?.city), safeText(provider?.province)]
    .filter(Boolean)
    .join(", ");
  const memberSince = formatDate(provider?.created_at || provider?.member_since);
  const avgRating = formatRating(stats?.average_rating ?? stats?.avg_rating ?? 0);
  const reviewCount = Number(stats?.review_count || 0);
  const verified = hasVerifiedBadge(badges);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">{displayName}</h1>
            {verified ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Verified
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
            <p className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {location || "Location not listed"}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Member since {memberSince}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
              {avgRating} ({reviewCount})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onViewServices}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            View Services
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-600 disabled:cursor-not-allowed"
          >
            Contact
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-600 disabled:cursor-not-allowed"
          >
            Request Quote
          </button>
        </div>
      </div>
    </section>
  );
}
