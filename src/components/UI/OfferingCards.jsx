// import { buildImageUrl } from "../../api/image";

// export default function OfferingCard({ offering, onEdit, onDelete }) {
//   // ✅ Use the field returned by the API
//   const imageUrl = buildImageUrl(offering.main_image_url);

//   return (
//     <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
//       {/* IMAGE */}
//       <div className="relative h-40 w-full bg-neutral-100">
//         {imageUrl ? (
//           <img
//             src={imageUrl}
//             alt={offering.title}
//             className="h-full w-full object-cover"
//             onError={(e) => {
//               // fallback to "No image" if S3 fails
//               e.currentTarget.style.display = "none";
//             }}
//           />
//         ) : (
//           <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
//             No image
//           </div>
//         )}
//       </div>

//       {/* CONTENT */}
//       <div className="space-y-2 p-4">
//         <h3 className="line-clamp-1 text-lg font-semibold text-neutral-900">
//           {offering.title}
//         </h3>

//         <p className="line-clamp-2 text-sm text-neutral-600">
//           {offering.description}
//         </p>

//         <div className="flex items-center justify-between pt-2">
//           <span className="text-sm font-semibold text-neutral-900">
//             ${offering.price}
//           </span>

//           <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
//             {offering.pricing_type}
//           </span>
//         </div>
//       </div>

//       {/* ACTIONS */}
//       {(onEdit || onDelete) && (
//         <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-white/90 px-4 py-3 opacity-0 backdrop-blur transition group-hover:opacity-100">
//           {onEdit && (
//             <button
//               onClick={() => onEdit(offering)}
//               className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
//             >
//               Edit
//             </button>
//           )}

//           {onDelete && (
//             <button
//               onClick={() => onDelete(offering)}
//               className="w-full rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
//             >
//               Delete
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

import { buildImageUrl } from "../../api/image";

export default function OfferingCard({
  offering,
  onEdit,
  onDelete,
  showActions = false,
}) {
  const imageUrl = buildImageUrl(offering.main_image_url);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      {/* IMAGE */}
      <div className="relative h-40 w-full bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={offering.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-lg font-semibold text-neutral-900">
          {offering.title}
        </h3>

        <p className="line-clamp-2 text-sm text-neutral-600">
          {offering.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-neutral-900">
            ${offering.price}
          </span>

          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
            {offering.pricing_type}
          </span>
        </div>
      </div>

      {/* ACTIONS (SERVICE PROVIDER ONLY) */}
      {showActions && (
        <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-white/90 px-4 py-3 opacity-0 backdrop-blur transition group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => onEdit(offering)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(offering)}
              className="w-full rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
