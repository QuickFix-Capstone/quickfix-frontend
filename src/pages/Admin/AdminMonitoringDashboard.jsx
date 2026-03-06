import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSystemHealth } from "../../api/systemHealth";
import StatusBadge from "../../components/Admin/StatusBadge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const REFRESH_MS = 30000;
const STATUS_ORDER = {
  healthy: 0,
  warning: 1,
  degraded: 2,
  no_data: 3,
};

const statusDotClass = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  degraded: "bg-rose-500",
  no_data: "bg-slate-400",
};

const statusTextClass = {
  healthy: "text-emerald-700",
  warning: "text-amber-700",
  degraded: "text-rose-700",
  no_data: "text-slate-600",
};

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeMonitoringResponse(raw) {
  const lambdaFunctions = Array.isArray(raw?.lambda?.functions)
    ? raw.lambda.functions
    : [];

  const functions = lambdaFunctions.map((fn) => {
    const invocations = safeNumber(fn?.invocations);
    const errors = safeNumber(fn?.errors);
    const avgLatency = safeNumber(fn?.avg_latency_ms);
    const throttles = safeNumber(fn?.throttles);
    const errorRateFromApi = safeNumber(fn?.error_rate_percent, NaN);
    const computedRate = invocations > 0 ? (errors / invocations) * 100 : 0;
    const errorRate = Number.isFinite(errorRateFromApi) ? errorRateFromApi : computedRate;

    return {
      function: String(fn?.function || "Unknown"),
      status: String(fn?.status || "no_data"),
      invocations,
      avg_latency_ms: avgLatency,
      errors,
      error_rate_percent: Number(errorRate.toFixed(2)),
      throttles,
    };
  });

  const summary = {
    current_invocations: safeNumber(raw?.lambda?.summary?.current_invocations),
    avg_latency_ms: safeNumber(raw?.lambda?.summary?.avg_latency_ms),
    error_rate_percent: safeNumber(raw?.lambda?.summary?.error_rate_percent),
    total_invocations: safeNumber(raw?.lambda?.summary?.total_invocations),
    active_functions: safeNumber(raw?.lambda?.summary?.active_functions),
  };

  if (!summary.total_invocations) {
    summary.total_invocations = functions.reduce((acc, fn) => acc + fn.invocations, 0);
  }

  if (!summary.active_functions) {
    summary.active_functions = functions.filter((fn) => fn.status !== "no_data").length;
  }

  let systemScore = safeNumber(raw?.system_score, -1);
  if (systemScore < 0) {
    if (raw?.status === "healthy") systemScore = 90;
    else if (raw?.status === "warning") systemScore = 65;
    else if (raw?.status === "degraded") systemScore = 35;
    else systemScore = 50;
  }

  return {
    status: String(raw?.status || "no_data"),
    timestamp: raw?.timestamp || new Date().toISOString(),
    execution_ms: safeNumber(raw?.execution_ms),
    system_score: Math.max(0, Math.min(100, systemScore)),
    lambda: { summary, functions },
  };
}

function scoreColor(score) {
  if (score >= 80) return "#16a34a";
  if (score >= 50) return "#f59e0b";
  return "#dc2626";
}

function formatAgo(dateValue) {
  if (!dateValue) return "never";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function SummaryCards({ data }) {
  const statusLabel = String(data.status || "no_data").replace("_", " ");

  const cards = [
    { label: "Overall Status", value: statusLabel.toUpperCase(), asStatus: true },
    {
      label: "Active Functions",
      value: data.lambda.summary.active_functions,
    },
    {
      label: "Error Rate %",
      value: `${safeNumber(data.lambda.summary.error_rate_percent).toFixed(2)}%`,
      warn: safeNumber(data.lambda.summary.error_rate_percent) > 5,
    },
    {
      label: "Avg Latency",
      value: `${Math.round(safeNumber(data.lambda.summary.avg_latency_ms))} ms`,
      warn: safeNumber(data.lambda.summary.avg_latency_ms) > 3000,
    },
    {
      label: "Total Invocations",
      value: data.lambda.summary.total_invocations,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
          <div className="mt-2 flex items-center gap-2">
            {card.asStatus && <StatusBadge status={data.status} />}
            <p
              className={`text-2xl font-semibold ${
                card.warn ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SystemHealthRing({ score }) {
  const radius = 58;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(100, safeNumber(score)));
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = scoreColor(progress);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center justify-center">
      <p className="text-sm font-medium text-slate-700 mb-3">System Health Score</p>
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#e2e8f0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <p className="-mt-16 text-3xl font-bold" style={{ color }}>
        {Math.round(progress)}
      </p>
      <p className="mt-8 text-xs text-slate-500">Based on latest monitoring response</p>
    </div>
  );
}

function LambdaTable({
  functions,
  search,
  setSearch,
  degradedOnly,
  setDegradedOnly,
  sortConfig,
  onSort,
  selected,
  setSelected,
  rowRefs,
}) {
  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ^" : " v";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-slate-900">Lambda Table</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search function"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={degradedOnly}
              onChange={(e) => setDegradedOnly(e.target.checked)}
            />
            Show degraded only
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">
                <button className="font-medium" onClick={() => onSort("function")}>Function{sortIndicator("function")}</button>
              </th>
              <th className="px-3 py-2 text-right">
                <button className="font-medium" onClick={() => onSort("invocations")}>Invocations{sortIndicator("invocations")}</button>
              </th>
              <th className="px-3 py-2 text-right">
                <button className="font-medium" onClick={() => onSort("avg_latency_ms")}>Avg Latency{sortIndicator("avg_latency_ms")}</button>
              </th>
              <th className="px-3 py-2 text-right">
                <button className="font-medium" onClick={() => onSort("errors")}>Errors{sortIndicator("errors")}</button>
              </th>
              <th className="px-3 py-2 text-right">
                <button className="font-medium" onClick={() => onSort("error_rate_percent")}>Error Rate{sortIndicator("error_rate_percent")}</button>
              </th>
              <th className="px-3 py-2 text-right">
                <button className="font-medium" onClick={() => onSort("throttles")}>Throttles{sortIndicator("throttles")}</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {functions.map((fn) => {
              const isRisk = fn.error_rate_percent > 5 || fn.throttles > 0;
              return (
                <tr
                  key={fn.function}
                  ref={(el) => {
                    if (el) rowRefs.current[fn.function] = el;
                  }}
                  onClick={() => setSelected(fn)}
                  className={`border-b border-slate-100 cursor-pointer ${
                    isRisk ? "bg-rose-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusDotClass[fn.status] || "bg-slate-400"}`} />
                  </td>
                  <td className={`px-3 py-2 font-medium ${statusTextClass[fn.status] || "text-slate-700"}`}>{fn.function}</td>
                  <td className="px-3 py-2 text-right">{fn.invocations}</td>
                  <td className="px-3 py-2 text-right">{Math.round(fn.avg_latency_ms)} ms</td>
                  <td className="px-3 py-2 text-right">{fn.errors}</td>
                  <td className="px-3 py-2 text-right">{fn.error_rate_percent.toFixed(2)}%</td>
                  <td className="px-3 py-2 text-right">{fn.throttles}</td>
                </tr>
              );
            })}
            {functions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  No functions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">{selected.function}</h4>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-900">Close</button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>Status: <span className="font-medium">{selected.status}</span></p>
              <p>Invocations: <span className="font-medium">{selected.invocations}</span></p>
              <p>Avg latency: <span className="font-medium">{Math.round(selected.avg_latency_ms)} ms</span></p>
              <p>Errors: <span className="font-medium">{selected.errors}</span></p>
              <p>Error rate: <span className="font-medium">{selected.error_rate_percent.toFixed(2)}%</span></p>
              <p>Throttles: <span className="font-medium">{selected.throttles}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LambdaCharts({ trendData, functions }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Invocation Trend</h3>
        <p className="text-xs text-slate-500 mb-3">Session trend from live refresh snapshots</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeLabel" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="invocations" stroke="#0f766e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Error Distribution</h3>
        <p className="text-xs text-slate-500 mb-3">Functions with highest error counts</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={functions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="function" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="errors" name="Errors">
              {functions.map((fn) => (
                <Cell key={fn.function} fill={fn.errors > 0 ? "#dc2626" : "#94a3b8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
      </div>
      <div className="h-72 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}

export default function AdminMonitoringDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [secondsTick, setSecondsTick] = useState(0);
  const [search, setSearch] = useState("");
  const [degradedOnly, setDegradedOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "errors", direction: "desc" });
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const rowRefs = useRef({});

  const loadHealth = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const raw = await fetchSystemHealth();
      const normalized = normalizeMonitoringResponse(raw);
      setData(normalized);
      setLastUpdated(new Date().toISOString());
      setError("");

      const point = {
        timeLabel: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        invocations: normalized.lambda.summary.total_invocations,
        errorRate: normalized.lambda.summary.error_rate_percent,
      };
      setTrendData((prev) => [...prev.slice(-11), point]);
    } catch (err) {
      setError(err?.message || "Failed to load system health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    const refreshInterval = setInterval(() => loadHealth(), REFRESH_MS);
    const secondsInterval = setInterval(() => setSecondsTick((prev) => prev + 1), 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(secondsInterval);
    };
  }, [loadHealth]);

  useEffect(() => {
    if (!data || data.status !== "degraded") return;
    const firstProblem = data.lambda.functions.find((fn) => fn.status === "degraded" || fn.status === "warning");
    if (!firstProblem) return;
    const row = rowRefs.current[firstProblem.function];
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  const sortedAndFiltered = useMemo(() => {
    if (!data) return [];

    const searchLower = search.trim().toLowerCase();
    const filtered = data.lambda.functions.filter((fn) => {
      const matchesSearch = !searchLower || fn.function.toLowerCase().includes(searchLower);
      const matchesDegraded = !degradedOnly || fn.status === "degraded" || fn.status === "warning";
      return matchesSearch && matchesDegraded;
    });

    return [...filtered].sort((a, b) => {
      if (sortConfig.key === "status") {
        const av = STATUS_ORDER[a.status] ?? 999;
        const bv = STATUS_ORDER[b.status] ?? 999;
        return sortConfig.direction === "asc" ? av - bv : bv - av;
      }

      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];

      if (typeof av === "string" && typeof bv === "string") {
        return sortConfig.direction === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }

      return sortConfig.direction === "asc" ? av - bv : bv - av;
    });
  }, [data, search, degradedOnly, sortConfig]);

  const onSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  return (
    <div className="space-y-4 p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Monitoring Dashboard</h1>
          <p className="text-sm text-slate-600">Live health using the existing monitoring API route</p>
        </div>
        <div className="flex items-center gap-3">
          <span key={secondsTick} className="text-xs text-slate-500">
            Last updated {formatAgo(lastUpdated)}
          </span>
          <button
            onClick={() => loadHealth(true)}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {data?.status === "degraded" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Warning: the system is degraded. The table auto-focuses affected Lambda functions.
        </div>
      )}

      {loading && !data ? (
        <LoadingState />
      ) : (
        <>
          <SummaryCards data={data} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1">
              <SystemHealthRing score={data.system_score} />
            </div>
            <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900">Monitoring Meta</h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-slate-500">API Status</p>
                  <p className="font-medium text-slate-900 mt-1">{data.status}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-slate-500">Execution Time</p>
                  <p className="font-medium text-slate-900 mt-1">{Math.round(data.execution_ms)} ms</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-slate-500">Payload Timestamp</p>
                  <p className="font-medium text-slate-900 mt-1">{new Date(data.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <LambdaTable
            functions={sortedAndFiltered}
            search={search}
            setSearch={setSearch}
            degradedOnly={degradedOnly}
            setDegradedOnly={setDegradedOnly}
            sortConfig={sortConfig}
            onSort={onSort}
            selected={selectedFunction}
            setSelected={setSelectedFunction}
            rowRefs={rowRefs}
          />

          <LambdaCharts trendData={trendData} functions={data.lambda.functions} />
        </>
      )}
    </div>
  );
}
