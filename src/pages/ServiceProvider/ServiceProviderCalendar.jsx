import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import { API_BASE } from "../../api/config";
import Button from "../../components/UI/Button";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SYNC_STORAGE_KEY = "sp_calendar_sync_v1";

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseStatus(status) {
  return String(status || "").toLowerCase();
}

function isBookedStatus(status) {
  const s = parseStatus(status);
  return s === "confirmed" || s === "pending_confirmation" || s === "in_progress";
}

export default function ServiceProviderCalendar() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [syncPrefs, setSyncPrefs] = useState({
    google: false,
    outlook: false,
    apple: false,
    twoWaySync: false,
  });

  useEffect(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    if (savedSync) {
      try {
        setSyncPrefs(JSON.parse(savedSync));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoadingBookings(true);
        setCalendarError("");
        const session = await fetchAuthSession();
        const token =
          session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
        if (!token) throw new Error("Missing auth token");

        const res = await fetch(`${API_BASE}/service-provider/pending-booking`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load appointments");

        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch (err) {
        setCalendarError(err?.message || "Failed to load appointments");
      } finally {
        setLoadingBookings(false);
      }
    };

    loadBookings();
  }, [refreshKey]);

  const silentRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const bookedByDay = useMemo(() => {
    const map = {};
    for (const booking of bookings) {
      if (!booking?.scheduled_date || !isBookedStatus(booking?.status)) continue;
      const key = booking.scheduled_date.slice(0, 10);
      map[key] = map[key] || [];
      map[key].push(booking);
    }
    return map;
  }, [bookings]);

  const selectedDayItems = useMemo(() => {
    return bookedByDay[dateKey(selectedDate)] || [];
  }, [bookedByDay, selectedDate]);

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayIndex; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(year, month, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthCursor]);

  const monthLabel = monthCursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const setProviderSync = (provider, connected) => {
    const next = { ...syncPrefs, [provider]: connected };
    setSyncPrefs(next);
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(next));
    if (connected) {
      alert(`${provider[0].toUpperCase() + provider.slice(1)} sync connected (local setting).`);
    }
  };

  const toggleTwoWaySync = () => {
    const next = { ...syncPrefs, twoWaySync: !syncPrefs.twoWaySync };
    setSyncPrefs(next);
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calendar & Availability</h1>
            <p className="text-sm text-slate-600">
              View booked appointments and manage your working schedule.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={silentRefresh}>
              Refresh
            </Button>
            <Button variant="outline" onClick={() => navigate("/service-provider/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-slate-700">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                <p className="font-semibold">Booked Appointments Calendar</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                  className="rounded-lg border px-2 py-1 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="min-w-36 text-center text-sm font-medium">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                  className="rounded-lg border px-2 py-1 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
              {DAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="h-20 rounded-lg bg-slate-50" />;
                const key = dateKey(cell);
                const items = bookedByDay[key] || [];
                const isSelected = key === dateKey(selectedDate);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(cell)}
                    className={`h-20 rounded-lg border p-2 text-left transition ${
                      isSelected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{cell.getDate()}</span>
                      {items.length > 0 && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white">
                          {items.length}
                        </span>
                      )}
                    </div>
                    {items.length > 0 && (
                      <p className="mt-2 truncate text-xs text-indigo-700">Booked appointments</p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {loadingBookings ? (
                <p className="mt-2 text-sm text-slate-500">Loading appointments...</p>
              ) : calendarError ? (
                <p className="mt-2 text-sm text-red-600">{calendarError}</p>
              ) : selectedDayItems.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No booked appointments.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {selectedDayItems.map((item) => (
                    <button
                      key={item.booking_id}
                      type="button"
                      onClick={() => navigate(`/service-provider/bookings/${item.booking_id}`)}
                      className="w-full rounded-lg border bg-white p-3 text-left hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {item.service_description || `Booking #${item.booking_id}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {item.scheduled_time || "Time TBD"} | {item.status}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 inline-flex items-center gap-2 text-slate-700">
                <Link2 className="h-5 w-5 text-indigo-600" />
                <p className="font-semibold">External Calendar Sync</p>
              </div>
              <p className="text-xs text-slate-500">
                Enable sync preference for your external calendars.
              </p>

              {["google", "outlook", "apple"].map((provider) => (
                <div key={provider} className="mt-3 flex items-center justify-between rounded-lg border p-2">
                  <p className="text-sm font-medium capitalize">{provider} Calendar</p>
                  {syncPrefs[provider] ? (
                    <Button
                      variant="outline"
                      className="px-3 py-1 text-xs"
                      onClick={() => setProviderSync(provider, false)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      className="px-3 py-1 text-xs"
                      onClick={() => setProviderSync(provider, true)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}

              <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={syncPrefs.twoWaySync} onChange={toggleTwoWaySync} />
                Enable two-way sync
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
