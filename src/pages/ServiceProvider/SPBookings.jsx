import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api/config";
import BookingCard from "../../components/UI/BookingCard";

export default function Bookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

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
        if (!cancelled) {
          setBookings(data.bookings || []);
        }
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
  }, [navigate]);

  /* =========================
     UI STATES
  ========================= */
  if (loading) {
    return <div className="p-6">📦 Loading bookings…</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">❌ Error loading bookings: {error}</div>
    );
  }

  const filteredBookings =
    filter === "All"
      ? bookings
      : bookings.filter(
          (b) => b.status?.toLowerCase() === filter.toLowerCase(),
        );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-sm text-gray-500">
          View and manage your service bookings
        </p>

        {/* Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            "All",
            "pending",
            "pending_confirmation",
            "confirmed",
            "completed",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
                ${
                  filter === status
                    ? "bg-black text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
            >
              {status === "All"
                ? "All"
                : status.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Booking List */}
      {filteredBookings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.booking_id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   Empty State
========================= */
function EmptyState() {
  return (
    <div className="text-center border rounded-lg p-12 bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">No bookings found</h2>
      <p className="text-gray-600">New booking requests will appear here.</p>
    </div>
  );
}
