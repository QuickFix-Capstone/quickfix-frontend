export default function OfferingCard({
  offering,
  onEdit,
  onDelete,
}) {
  return (
    <div className="group relative rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image */}
      <img
        src={offering.main_image_url}
        alt={offering.title}
        className="h-40 w-full rounded-t-xl object-cover"
      />

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{offering.title}</h3>
        <p className="text-sm text-neutral-600 line-clamp-2">
          {offering.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-neutral-800">
            ${offering.price}
          </span>

          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
            {offering.pricing_type}
          </span>
        </div>
      </div>

      {/* Actions (hover) */}
      <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-white/90 px-4 py-3 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => onEdit?.(offering)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete?.(offering)}
          className="w-full rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
