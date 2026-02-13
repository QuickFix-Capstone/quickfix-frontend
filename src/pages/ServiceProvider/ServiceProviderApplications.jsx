import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, CheckCircle2, Clock3, Search, XCircle } from "lucide-react";
import { API_BASE } from "../../api/config";

const statusStyles = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function fmtMoney(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `$${n.toFixed(2)}`;
}

function normalizeStatus(v) {
  return String(v || "pending").toLowerCase();
}

export default function ServiceProviderApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    const counts = { all: applications.length, pending: 0, accepted: 0, rejected: 0 };
    for (const app of applications) {
      const key = normalizeStatus(app.application_status);
      if (counts[key] !== undefined) counts[key] += 1;
    }
    return counts;
  }, [applications]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return applications
      .filter((app) => (status === "all" ? true : normalizeStatus(app.application_status) === status))
      .filter((app) => {
        if (!query) return true;
        const hay = [
          app.title,
          app.message,
          app.application_status,
          app.job_id,
          app.application_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [applications, q, status]);

  async function loadApplications({ isRefresh = false } = {}) {
    try {
      setError("");
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(`${API_BASE}/service_provider/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to load applications");
      }
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (err) {
      setError(err?.message || "Failed to load applications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">My Job Applications</h1>
              <p className="mt-1 text-sm text-slate-600">
                Track every proposal you submitted to open jobs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadApplications({ isRefresh: true })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                disabled={refreshing}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => navigate("/service-provider/jobs")}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Browse Jobs
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title, status, job id..."
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="all">All ({stats.all})</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="accepted">Accepted ({stats.accepted})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border bg-slate-200/70" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border bg-white p-6 text-center">
              <p className="font-semibold text-red-600">Could not load applications</p>
              <p className="mt-1 text-sm text-slate-600">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-center">
              <p className="font-semibold text-slate-900">No applications found</p>
              <p className="mt-1 text-sm text-slate-600">
                Submit an application from an open job to see it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((app) => {
                const normalized = normalizeStatus(app.application_status);
                const badge =
                  statusStyles[normalized] || "border-slate-200 bg-slate-50 text-slate-700";
                const canOpenJob = Boolean(app.job_id);

                return (
                  <div
                    key={app.application_id || `${app.job_id}-${app.created_at}`}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">
                          Application #{app.application_id || "-"}
                        </p>
                        <h3 className="text-base font-semibold text-slate-900">
                          {app.title || `Job #${app.job_id || "-"}`}
                        </h3>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-xs font-medium ${badge}`}>
                        {String(app.application_status || "pending").toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <Briefcase className="h-4 w-4" />
                        Job #{app.job_id || "-"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <Calendar className="h-4 w-4" />
                        {fmtDate(app.created_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        {fmtMoney(app.proposed_price)}
                      </span>
                    </div>

                    {app.message && (
                      <p className="mt-3 text-sm text-slate-600 line-clamp-3">{app.message}</p>
                    )}

                    <div className="mt-3">
                      {normalized === "accepted" && (
                        <div className="inline-flex items-center gap-1 text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Accepted by customer
                        </div>
                      )}
                      {normalized === "pending" && (
                        <div className="inline-flex items-center gap-1 text-sm text-yellow-700">
                          <Clock3 className="h-4 w-4" />
                          Waiting for customer decision
                        </div>
                      )}
                      {normalized === "rejected" && (
                        <div className="inline-flex items-center gap-1 text-sm text-red-700">
                          <XCircle className="h-4 w-4" />
                          Not selected
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        disabled={!canOpenJob}
                        onClick={() => canOpenJob && navigate(`/service-provider/job/${app.job_id}`)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        View Job Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
