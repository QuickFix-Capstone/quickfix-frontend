import { useState } from "react";

/* =========================
   Status Normalizer
   pending === pending_confirmation
========================= */
function normalizeStatus(status) {
  if (status === "pending_confirmation") return "pending";
  return status;
}

export default function BookingCard({ booking }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(
    normalizeStatus(booking.status),
  );

  const handleAccept = async () => {
    try {
      setActionLoading(true);

      // 🔜 TODO: Call ACCEPT booking Lambda
      // await acceptBooking(booking.booking_id);

      setLocalStatus("confirmed");
    } catch (err) {
      console.error("Accept failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setActionLoading(true);

      // 🔜 TODO: Call DECLINE booking Lambda
      // await declineBooking(booking.booking_id);

      setLocalStatus("cancelled");
    } catch (err) {
      console.error("Decline failed:", err);
    } finally {
      setActionLoading(false);
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
        {/* ACCEPT */}
        <button
          onClick={handleAccept}
          disabled={actionLoading || normalizeStatus(localStatus) !== "pending"}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300
                     text-white px-4 py-2 rounded-md text-sm font-semibold transition"
        >
          Accept
        </button>

        {/* DECLINE */}
        <button
          onClick={handleDecline}
          disabled={actionLoading || normalizeStatus(localStatus) !== "pending"}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-300
                     text-white px-4 py-2 rounded-md text-sm font-semibold transition"
        >
          Decline
        </button>

        {/* MESSAGE */}
        <button
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
  const normalized = normalizeStatus(status);

  const map = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-200 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        map[normalized] || "bg-gray-100 text-gray-600"
      }`}
    >
      {normalized.toUpperCase()}
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
