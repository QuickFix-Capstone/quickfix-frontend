// import { useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { useNavigate } from "react-router-dom";
// import { API_BASE } from "../../api/config";
// import { createConversation } from "../../api/messagingProvider";

// /* =========================
//    Status Normalizer
// ========================= */
// function normalizeStatus(status) {
//   if (status === "pending_confirmation") return "pending";
//   return status;
// }

// export default function BookingCard({ booking }) {
//   const navigate = useNavigate();

//   const [actionLoading, setActionLoading] = useState(false);
//   const [localStatus, setLocalStatus] = useState(
//     normalizeStatus(booking.status),
//   );
//   const [error, setError] = useState(null);

//   /* =========================
//      ACCEPT BOOKING
//   ========================= */
//   const handleAccept = async () => {
//     try {
//       setActionLoading(true);
//       setError(null);

//       const session = await fetchAuthSession();
//       const token = session.tokens?.idToken?.toString();
//       if (!token) throw new Error("Not authenticated");

//       const res = await fetch(
//         `${API_BASE}/bookings/${booking.booking_id}/accept`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       if (!res.ok) {
//         const err = await res.json();
//         throw new Error(err.message || "Failed to accept booking");
//       }

//       // ✅ Optimistic UI update
//       setLocalStatus("confirmed");
//     } catch (err) {
//       console.error("Accept failed:", err);
//       setError(err.message);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   /* =========================
//      DECLINE BOOKING
//   ========================= */
//   const handleDecline = async () => {
//     try {
//       setActionLoading(true);
//       setError(null);

//       const session = await fetchAuthSession();
//       const token = session.tokens?.idToken?.toString();
//       if (!token) throw new Error("Not authenticated");

//       const res = await fetch(
//         `${API_BASE}/bookings/${booking.booking_id}/decline`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             reason: "Declined by service provider",
//           }),
//         },
//       );

//       if (!res.ok) {
//         const err = await res.json();
//         throw new Error(err.message || "Failed to decline booking");
//       }

//       setLocalStatus("cancelled");
//     } catch (err) {
//       console.error("Decline failed:", err);
//       setError(err.message);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   /* =========================
//      Messaging
//   ========================= */
//   const handleMessage = async () => {
//     try {
//       const result = await createConversation(
//         booking.customer_id,
//         booking.job_id || booking.booking_id,
//       );

//       navigate(`/service-provider/messages/${result.conversationId}`);
//     } catch (err) {
//       if (err.status === 409 && err.conversationId) {
//         navigate(`/service-provider/messages/${err.conversationId}`);
//         return;
//       }

//       console.error("Message failed:", err);
//       alert("Failed to open chat.");
//     }
//   };

//   return (
//     <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
//       {/* Header */}
//       <div className="flex justify-between items-start">
//         <div>
//           <h2 className="font-semibold text-lg">
//             {booking.service_description || "Service Request"}
//           </h2>

//           <div className="flex gap-2 mt-1 flex-wrap">
//             <CategoryBadge category={booking.service_category} />
//             <StatusBadge status={localStatus} />
//           </div>
//         </div>

//         <div className="text-lg font-semibold text-gray-700">
//           {booking.final_price
//             ? `$${booking.final_price}`
//             : booking.estimated_price
//               ? `$${booking.estimated_price}`
//               : "$"}
//         </div>
//       </div>

//       {/* Details */}
//       <div className="mt-3 space-y-1 text-sm text-gray-600">
//         <p>
//           📅 {formatDate(booking.scheduled_date)} •{" "}
//           {formatTime(booking.scheduled_time)}
//         </p>
//         <p>
//           📍 {booking.service_address}, {booking.service_city},{" "}
//           {booking.service_state} {booking.service_postal_code}
//         </p>
//         <p className="text-gray-500">
//           Customer:{" "}
//           <span className="font-medium">
//             {booking.first_name} {booking.last_name}
//           </span>
//         </p>
//       </div>

//       {/* Notes */}
//       {booking.notes && (
//         <div className="mt-3 bg-gray-50 rounded-md p-3 text-sm">
//           <span className="font-medium">Notes:</span> {booking.notes}
//         </div>
//       )}

//       {/* Error */}
//       {error && <div className="mt-3 text-sm text-red-600">❌ {error}</div>}

//       {/* Actions */}
//       <div className="mt-5 flex gap-3">
//         <button
//           onClick={handleAccept}
//           disabled={actionLoading || localStatus !== "pending"}
//           className="bg-green-600 hover:bg-green-700 disabled:bg-green-300
//                      text-white px-4 py-2 rounded-md text-sm font-semibold transition"
//         >
//           {actionLoading ? "Processing…" : "Accept"}
//         </button>

//         <button
//           onClick={handleDecline}
//           disabled={actionLoading || localStatus !== "pending"}
//           className="bg-red-600 hover:bg-red-700 disabled:bg-red-300
//                      text-white px-4 py-2 rounded-md text-sm font-semibold transition"
//         >
//           Decline
//         </button>

//         <button
//           onClick={handleMessage}
//           className="border border-gray-300 hover:bg-gray-100
//                      px-4 py-2 rounded-md text-sm font-medium transition"
//         >
//           Message
//         </button>
//       </div>
//     </div>
//   );
// }

// /* =========================
//    UI Helpers
// ========================= */
// function CategoryBadge({ category }) {
//   const map = {
//     PLUMBING: "bg-blue-100 text-blue-700",
//     "PEST CONTROL": "bg-red-100 text-red-700",
//     ELECTRICAL: "bg-yellow-100 text-yellow-800",
//     CLEANING: "bg-green-100 text-green-700",
//   };

//   return (
//     <span
//       className={`px-2 py-1 rounded-full text-xs font-semibold ${
//         map[category] || "bg-gray-100 text-gray-700"
//       }`}
//     >
//       {category}
//     </span>
//   );
// }

// function StatusBadge({ status }) {
//   const map = {
//     pending: "bg-yellow-100 text-yellow-700",
//     confirmed: "bg-green-100 text-green-700",
//     completed: "bg-gray-200 text-gray-700",
//     cancelled: "bg-red-100 text-red-700",
//   };

//   return (
//     <span
//       className={`px-2 py-1 rounded-full text-xs font-semibold ${
//         map[status] || "bg-gray-100 text-gray-600"
//       }`}
//     >
//       {status.toUpperCase()}
//     </span>
//   );
// }

// /* =========================
//    Format Helpers
// ========================= */
// function formatDate(date) {
//   if (!date) return "—";
//   return new Date(date).toLocaleDateString(undefined, {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
// }

// function formatTime(time) {
//   if (!time) return "—";
//   return time.slice(0, 5);
// }
import { useNavigate } from "react-router-dom";
import { createConversation } from "../../api/messagingProvider";

/* =========================
   Status Normalizer
========================= */
function normalizeStatus(status) {
  if (status === "pending_confirmation") return "pending";
  return status;
}

export default function BookingCard({
  booking,
  onAccept,
  onCancel,
  accepting,
}) {
  const navigate = useNavigate();
  const localStatus = normalizeStatus(booking.status);

  /* =========================
     Messaging
  ========================= */
  const handleMessage = async () => {
    try {
      const result = await createConversation(
        booking.customer_id,
        booking.job_id || booking.booking_id,
      );

      navigate(`/service-provider/messages/${result.conversationId}`);
    } catch (err) {
      if (err.status === 409 && err.conversationId) {
        navigate(`/service-provider/messages/${err.conversationId}`);
        return;
      }

      console.error("Message failed:", err);
      alert("Failed to open chat.");
    }
  };

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-lg">
            {booking.service_description || "Service Request"}
          </h2>

          <div className="flex gap-2 mt-1 flex-wrap">
            <CategoryBadge category={booking.service_category} />
            <StatusBadge status={localStatus} />
          </div>
        </div>

        <div className="text-lg font-semibold text-gray-700">
          {booking.final_price
            ? `$${booking.final_price}`
            : booking.estimated_price
              ? `$${booking.estimated_price}`
              : "$"}
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>
          📅 {formatDate(booking.scheduled_date)} •{" "}
          {formatTime(booking.scheduled_time)}
        </p>
        <p>
          📍 {booking.service_address}, {booking.service_city},{" "}
          {booking.service_state} {booking.service_postal_code}
        </p>
        <p className="text-gray-500">
          Customer:{" "}
          <span className="font-medium">
            {booking.first_name} {booking.last_name}
          </span>
        </p>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="mt-3 bg-gray-50 rounded-md p-3 text-sm">
          <span className="font-medium">Notes:</span> {booking.notes}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <button
          onClick={onAccept}
          disabled={accepting || localStatus !== "pending"}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300
                     text-white px-4 py-2 rounded-md text-sm font-semibold transition"
        >
          {accepting ? "Processing…" : "Accept"}
        </button>

        <button
          onClick={onCancel}
          disabled={accepting || localStatus !== "pending"}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-300
                     text-white px-4 py-2 rounded-md text-sm font-semibold transition"
        >
          Cancel
        </button>

        <button
          onClick={handleMessage}
          className="border border-gray-300 hover:bg-gray-100
                     px-4 py-2 rounded-md text-sm font-medium transition"
        >
          Message
        </button>
      </div>
    </div>
  );
}

/* =========================
   UI Helpers
========================= */
function CategoryBadge({ category }) {
  const map = {
    PLUMBING: "bg-blue-100 text-blue-700",
    "PEST CONTROL": "bg-red-100 text-red-700",
    ELECTRICAL: "bg-yellow-100 text-yellow-800",
    CLEANING: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        map[category] || "bg-gray-100 text-gray-700"
      }`}
    >
      {category}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-200 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}

/* =========================
   Format Helpers
========================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "—";
  return time.slice(0, 5);
}
