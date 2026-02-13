// src/pages/ServiceProvider/ProviderJobs.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import { API_BASE } from "../../api/config";

const statusStyles = {
  open: "border-blue-200 bg-blue-50 text-blue-700",
  assigned: "border-amber-200 bg-amber-50 text-amber-700",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  budget_change_pending: "border-orange-200 bg-orange-50 text-orange-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-700",
};

function fmtMoney(v) {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `$${n.toFixed(2)}`;
}

function safeText(v) {
  return v ?? "-";
}

export default function ProviderJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [providerId, setProviderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = useMemo(() => {
    const counts = {
      all: jobs.length,
      open: 0,
      assigned: 0,
      in_progress: 0,
      budget_change_pending: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const j of jobs) {
      if (counts[j.status] !== undefined) counts[j.status] += 1;
    }
    return counts;
  }, [jobs]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return jobs
      .filter((j) => (status === "all" ? true : j.status === status))
      .filter((j) => {
        if (!query) return true;
        const hay = [
          j.title,
          j.description,
          j.category,
          j.location?.city,
          j.location?.address,
          j.status,
          String(j.job_id),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [jobs, status, q]);

  async function loadJobs({ isRefresh = false } = {}) {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const session = await fetchAuthSession();
      const idToken = session?.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Missing auth token. Please sign in again.");

      const res = await fetch(`${API_BASE}/service-provider/jobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      setProviderId(data.provider_id || null);
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (e) {
      setError(e?.message || "Failed to load jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function silentRefresh() {
    setRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  }

  useEffect(() => {
    loadJobs({ isRefresh: refreshKey > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-indigo-600">
                <Briefcase className="h-5 w-5" />
                <h1 className="text-xl font-semibold text-slate-900">My Jobs</h1>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Provider: <span className="font-mono text-slate-700">{providerId || "-"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={silentRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                disabled={refreshing}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={() => navigate("/service-provider/dashboard")}
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-2 text-sm font-medium text-white shadow transition hover:from-indigo-600 hover:to-blue-600"
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by title, category, city, job id..."
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All ({stats.all})</option>
                <option value="assigned">Assigned ({stats.assigned})</option>
                <option value="in_progress">In progress ({stats.in_progress})</option>
                <option value="budget_change_pending">
                  Budget pending ({stats.budget_change_pending})
                </option>
                <option value="completed">Completed ({stats.completed})</option>
                <option value="cancelled">Cancelled ({stats.cancelled})</option>
                <option value="open">Open ({stats.open})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-slate-900">Could not load jobs</p>
                <p className="mt-1 text-sm text-slate-600">{error}</p>
                <button
                  onClick={silentRefresh}
                  className="mt-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-2 text-sm font-medium text-white shadow transition hover:from-indigo-600 hover:to-blue-600"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-slate-900">No jobs found</p>
            <p className="mt-1 text-sm text-slate-600">Try changing the filter or search.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((job) => {
              const badge =
                statusStyles[job.status] || "border-slate-200 bg-slate-50 text-slate-700";

              return (
                <button
                  key={job.job_id}
                  onClick={() => navigate(`/service-provider/job/${job.job_id}`)}
                  className="w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        Job #{job.job_id} | Booking {job.booking_id ?? "-"}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {safeText(job.title)}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {safeText(job.description)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                          <MapPin className="h-4 w-4" />
                          {safeText(job.location?.city)}, {safeText(job.location?.state)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                          <Calendar className="h-4 w-4" />
                          {safeText(job.schedule?.preferred_date)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                          <Clock className="h-4 w-4" />
                          {safeText(job.schedule?.preferred_time)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                          <DollarSign className="h-4 w-4" />
                          {fmtMoney(job.budget?.final_price ?? job.budget?.max)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full border px-2 py-1 text-xs ${badge}`}>
                        {String(job.status).replaceAll("_", " ")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                        View <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
