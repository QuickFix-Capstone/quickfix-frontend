import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api/config";
import AlertBanner from "../../components/UI/AlertBanner";

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

        const res = await fetch(`${API_BASE}/service-provider/pending-booking`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch bookings");
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

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute right-0 top-10 h-[26rem] w-[26rem] rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-4 h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="mt-3 h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl">
          <AlertBanner variant="error" message={error} className="text-left" />
          <button
            className="mt-3 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:brightness-110"
            onClick={silentRefresh}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute right-0 top-10 h-[26rem] w-[26rem] rounded-full bg-indigo-300/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Service Provider Bookings
              </p>
              <h1 className="mt-3 text-2xl font-bold">
                Your Bookings ({bookings.length})
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
                onClick={silentRefresh}
              >
                Refresh
              </button>
              <button
                className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
                onClick={() => navigate("/service-provider/dashboard")}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>

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
    </div>
  );
}

function BookingCard({ booking }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">
            {booking.first_name} {booking.last_name}
          </h2>
          <p className="text-sm text-slate-600">{booking.customer_email}</p>
        </div>

        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Info label="Date" value={formatDate(booking.preferred_date)} />
        <Info label="Time" value={booking.preferred_time || "-"} />
        <Info
          label="Price"
          value={booking.final_price ? `$${booking.final_price}` : "Pending"}
        />
        <Info label="Status" value={booking.status || "-"} />
      </div>

      <div className="mt-4 flex gap-3">
        <button className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:brightness-110">
          View
        </button>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Message
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: "border border-yellow-200 bg-yellow-50 text-yellow-800",
    confirmed: "border border-green-200 bg-green-50 text-green-800",
    completed: "border border-blue-200 bg-blue-50 text-blue-800",
    cancelled: "border border-red-200 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        colors[status] || "border border-slate-200 bg-white text-slate-700"
      }`}
    >
      {status?.toUpperCase()}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <h2 className="text-lg font-semibold mb-2 text-slate-900">No bookings yet</h2>
      <p className="text-slate-600">
        When customers book your services, they will show up here.
      </p>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

