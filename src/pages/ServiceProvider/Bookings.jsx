import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api/config";

export default function Bookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadBookings = async () => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        if (!idToken) {
          navigate("/login", { replace: true });
          return;
        }

        const res = await fetch(
          `${API_BASE}/service-provider/pending-booking`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const data = await res.json();
        if (!cancelled) setBookings(data.bookings || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshKey]);

  const silentRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return <div className="p-6">📦 Loading bookings…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button className="mt-3 btn-primary" onClick={silentRefresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">
        Your Bookings ({bookings.length})
      </h1>
      <button className="btn-secondary mb-4" onClick={silentRefresh}>
        Refresh
      </button>

      {bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.booking_id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   Booking Card
========================= */
function BookingCard({ booking }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-lg">
            {booking.first_name} {booking.last_name}
          </h2>
          <p className="text-sm text-gray-600">{booking.customer_email}</p>
        </div>

        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Info label="Date" value={formatDate(booking.preferred_date)} />
        <Info label="Time" value={booking.preferred_time || "—"} />
        <Info
          label="Price"
          value={booking.final_price ? `$${booking.final_price}` : "Pending"}
        />
        <Info label="Status" value={booking.status} />
      </div>

      <div className="mt-4 flex gap-3">
        <button className="btn-primary">View</button>
        <button className="btn-secondary">Message</button>
      </div>
    </div>
  );
}

/* =========================
   Reusable UI bits
========================= */
function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status?.toUpperCase()}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="text-center border rounded-lg p-12 bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">No bookings yet</h2>
      <p className="text-gray-600">
        When customers book your services, they’ll show up here.
      </p>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}
