import { buildImageUrl } from "../../api/image";
import { formatCurrency, formatRating, safeText } from "../../utils/format";

const FALLBACK_IMAGE =
  "https://placehold.co/800x480/e5e7eb/525252?text=QuickFix+Service";

function resolveImageUrl(imageKey) {
  if (!imageKey) return FALLBACK_IMAGE;
  if (String(imageKey).startsWith("http")) return imageKey;
  return buildImageUrl(imageKey) || FALLBACK_IMAGE;
}

export default function ServiceOfferingCard({ offering }) {
  return (
    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <img
        src={resolveImageUrl(offering?.main_image_url)}
        alt={safeText(offering?.title, "Service offering")}
        loading="lazy"
        className="h-40 w-full object-cover"
      />

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-neutral-900">
            {safeText(offering?.title, "Untitled service")}
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            {safeText(offering?.category, "General")}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-900">
            {formatCurrency(offering?.price, offering?.pricing_type)}
          </p>
          {Number.isFinite(Number(offering?.average_rating)) ? (
            <p className="text-xs text-neutral-600">
              {formatRating(offering?.average_rating)}★
            </p>
          ) : null}
        </div>

        <button
          type="button"
          disabled
          title="View details coming soon"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          View details
        </button>
      </div>
    </article>
  );
}
