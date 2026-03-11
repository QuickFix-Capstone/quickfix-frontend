import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    CreditCard,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    Filter,
    Download,
} from "lucide-react";
import { getAdminPaymentsAnalytics } from "../../api/adminPaymentsAnalytics";

const CHART_COLORS = [
    "#6366f1", // indigo
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#3b82f6", // blue
    "#a855f7", // purple
    "#14b8a6", // teal
    "#f97316", // orange
];

const AGING_COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // green / amber / red
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // paid=green, pending=amber, failed=red

function centsToCad(cents) {
    const n = Number(cents || 0) / 100;
    return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function n0(v) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
}

function toISODate(d) {
    return d.toISOString().slice(0, 10);
}

function StatusPill({ type = "info", text }) {
    const styles = {
        success: "bg-green-100 text-green-800 border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
        danger: "bg-red-100 text-red-800 border-red-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[type] || styles.info}`}
        >
            {text}
        </span>
    );
}

function InsightCard({ insight }) {
    const icon =
        insight.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
        ) : insight.type === "warning" ? (
            <AlertTriangle className="w-4 h-4" />
        ) : insight.type === "danger" ? (
            <XCircle className="w-4 h-4" />
        ) : (
            <TrendingUp className="w-4 h-4" />
        );

    const border =
        insight.type === "success"
            ? "border-green-200 bg-green-50"
            : insight.type === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : insight.type === "danger"
                    ? "border-red-200 bg-red-50"
                    : "border-blue-200 bg-blue-50";

    return (
        <div className={`border ${border} rounded-xl p-4`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-gray-800">{icon}</div>
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900">
                            {insight.title || "Insight"}
                        </p>
                        <StatusPill type={insight.type} text={String(insight.type || "info").toUpperCase()} />
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{insight.message}</p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "default" }) {
    const toneStyle =
        tone === "success"
            ? "border-green-200 bg-green-50"
            : tone === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : tone === "danger"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-white";

    return (
        <div className={`border ${toneStyle} rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
                    {subtitle ? (
                        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
                    ) : null}
                </div>
                {Icon ? (
                    <div className="p-2 rounded-xl bg-white border border-gray-200">
                        <Icon className="w-5 h-5 text-gray-800" />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function AdminPaymentsAnalytics() {
    const today = useMemo(() => new Date(), []);
    const [range, setRange] = useState(() => {
        const to = toISODate(today);
        const from = toISODate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
        return { from, to, groupBy: "day" };
    });

    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [data, setData] = useState(null);
    const [insightFilter, setInsightFilter] = useState("all"); // all | warning | danger

    function exportCSV(rows, columns, filename) {
        if (!rows || rows.length === 0) return;
        const header = columns.map((c) => c.label).join(",");
        const body = rows
            .map((r) =>
                columns.map((c) => JSON.stringify(String(r[c.key] ?? ""))).join(",")
            )
            .join("\n");
        const blob = new Blob([header + "\n" + body], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function load() {
        setLoading(true);
        setErrMsg("");
        try {
            const res = await getAdminPaymentsAnalytics(range);
            setData(res);
        } catch (e) {
            setErrMsg(e?.message || "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const summary = data?.summary || {};
    const charts = data?.charts || {};
    const actionTables = data?.actionTables || {};
    const insights = data?.insights || [];

    const paidCount = n0(summary.paid_count);
    const pendingCount = n0(summary.pending_count);
    const failedCount = n0(summary.failed_count);
    const totalPayments = n0(summary.total_payments);

    const paidRevenue = centsToCad(summary.paid_revenue_cents);
    const avgOrder = centsToCad(summary.avg_order_value_cents);

    const refundRate = n0(summary.refund_rate_percent);
    const refundPending = n0(summary.pending_refunds_count);
    const refundApproved = n0(summary.approved_refunds_count);

    const methodBreakdown = charts.paymentMethodBreakdown || [];
    const paymentTrend = (charts.paymentTrend || []).map((x) => ({
        period: x.period,
        total: Math.round(n0(x.total_amount_cents) / 100),
        count: n0(x.payment_count),
    }));

    const statusPie = useMemo(() => {
        return [
            { name: "Paid", value: paidCount },
            { name: "Pending", value: pendingCount },
            { name: "Failed", value: failedCount },
        ].filter((x) => x.value > 0);
    }, [paidCount, pendingCount, failedCount]);

    const pendingAging = charts.pendingAging || {};
    const pendingAgingBars = [
        { name: "< 24h", value: n0(pendingAging.under_24h) },
        { name: "1–3d", value: n0(pendingAging.between_1d_3d) },
        { name: "> 3d", value: n0(pendingAging.over_3d) },
    ];

    const pendingCompletedJobs = actionTables.pendingCompletedJobs || [];
    const oldPendingPayments = actionTables.oldPendingPayments || [];

    const refundReasons = charts.refundReasons || [];
    const topCities = data?.leaderboards?.topCities || [];
    const topProviders = data?.leaderboards?.topProviders || [];

    const fraud = data?.fraudMonitoring || {};
    const fraudRiskScore = n0(fraud.riskScore);
    const fraudAlerts = fraud.alerts || [];
    const flaggedProviders = fraud.flaggedProviders || [];
    const suspiciousCustomers = fraud.suspiciousCustomers || [];
    const rapidPaymentCustomers = fraud.rapidPaymentCustomers || [];
    const failedByGateway = fraud.failedByGateway || [];

    const fraudSummaryCards = [
        { label: "Flagged Providers", value: n0(fraud.flaggedProvidersCount) },
        { label: "Suspicious Customers", value: n0(fraud.suspiciousCustomersCount) },
        { label: "Rapid Payment Cases", value: n0(fraud.rapidPaymentCustomersCount) },
        { label: "Completed Jobs at Risk", value: n0(fraud.completedPendingJobsCount) },
    ];

    const filteredInsights = insights.filter((ins) =>
        insightFilter === "all" ? true : ins.type === insightFilter
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Payments Analytics
                    </h2>
                    <p className="text-sm text-gray-600">
                        Actionable insights for payments, refunds, and pending risk.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Filter className="w-4 h-4" />
                        <span className="font-medium">Range</span>
                    </div>

                    <div className="flex gap-2">
                        <div>
                            <label className="text-xs text-gray-600">From</label>
                            <input
                                type="date"
                                value={range.from}
                                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600">To</label>
                            <input
                                type="date"
                                value={range.to}
                                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600">Group</label>
                            <select
                                value={range.groupBy}
                                onChange={(e) => setRange((r) => ({ ...r, groupBy: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                            </select>
                        </div>

                        <button
                            onClick={load}
                            className="h-[42px] mt-[18px] inline-flex items-center gap-2 bg-black text-white px-4 rounded-lg text-sm font-semibold hover:bg-gray-900"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>

                        <button
                            onClick={() =>
                                exportCSV(
                                    oldPendingPayments,
                                    [
                                        { label: "payment_id", key: "payment_id" },
                                        { label: "job_id", key: "job_id" },
                                        { label: "payment_method", key: "payment_method" },
                                        { label: "age_hours", key: "age_hours" },
                                    ],
                                    "pending_payments.csv"
                                )
                            }
                            className="h-[42px] mt-[18px] inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-800 px-4 rounded-lg text-sm font-semibold hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {errMsg ? (
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-800">
                    {errMsg}
                </div>
            ) : null}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Paid Revenue"
                    value={paidRevenue}
                    subtitle="Paid payments only"
                    icon={TrendingUp}
                    tone="success"
                />
                <StatCard
                    title="Total Payments"
                    value={String(totalPayments)}
                    subtitle={`Paid ${paidCount} • Pending ${pendingCount} • Failed ${failedCount}`}
                    icon={CreditCard}
                />
                <StatCard
                    title="Pending Payments"
                    value={String(pendingCount)}
                    subtitle="Operational risk (follow up)"
                    icon={Clock}
                    tone={pendingCount > 0 ? "warning" : "default"}
                />
                <StatCard
                    title="Refund Rate"
                    value={`${refundRate.toFixed(1)}%`}
                    subtitle={`Approved ${refundApproved} • Pending ${refundPending}`}
                    icon={AlertTriangle}
                    tone={refundRate >= 10 ? "danger" : refundApproved > 0 ? "warning" : "default"}
                />
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Insights</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Filter:</span>
                            {["all", "warning", "danger"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setInsightFilter(f)}
                                    className={`text-xs px-2 py-1 rounded-full border font-semibold transition-all ${insightFilter === f
                                        ? "bg-black text-white border-black"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading && !data ? (
                            <div className="text-sm text-gray-600">Loading insights…</div>
                        ) : filteredInsights.length === 0 ? (
                            <div className="text-sm text-gray-600">
                                No {insightFilter === "all" ? "" : insightFilter + " "}insights available for this range.
                            </div>
                        ) : (
                            filteredInsights.map((ins, idx) => <InsightCard key={idx} insight={ins} />)
                        )}
                    </div>
                </div>

                {/* Pending Aging */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">Pending Aging</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Where pending payments are getting stuck
                    </p>

                    <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pendingAgingBars}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {pendingAgingBars.map((_, i) => (
                                        <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Trend */}
                <div className="xl:col-span-2 border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">Payment Trend</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Total amount (CAD) by {range.groupBy}
                    </p>

                    <div className="h-72 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={paymentTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5, fill: "#6366f1" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                    <p className="text-xs text-gray-500 mt-1">Usage distribution</p>

                    <div className="mt-4 space-y-3">
                        {methodBreakdown.length === 0 ? (
                            <div className="text-sm text-gray-600">No method data.</div>
                        ) : (
                            methodBreakdown.map((m, idx) => (
                                <div key={m.payment_method} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                        />
                                        <span className="text-sm font-medium text-gray-800">
                                            {String(m.payment_method || "unknown")}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {n0(m.payment_count)} • {centsToCad(m.total_amount_cents)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="h-52 mt-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={80} label>
                                    {statusPie.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                        Status distribution (paid/pending/failed)
                    </p>
                </div>
            </div>

            {/* Action Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Completed jobs with pending payment */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">
                        Completed Jobs with Pending Payment
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        These are completed but still unpaid (needs admin follow-up)
                    </p>

                    <div className="mt-4 overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b">
                                <tr>
                                    <th className="text-left py-2 pr-4">Job</th>
                                    <th className="text-left py-2 pr-4">City</th>
                                    <th className="text-left py-2 pr-4">Amount</th>
                                    <th className="text-left py-2 pr-4">Method</th>
                                    <th className="text-left py-2 pr-4">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {pendingCompletedJobs.length === 0 ? (
                                    <tr>
                                        <td className="py-3 text-gray-600" colSpan={5}>
                                            No completed jobs with pending payment.
                                        </td>
                                    </tr>
                                ) : (
                                    pendingCompletedJobs.map((r) => (
                                        <tr
                                            key={r.payment_id}
                                            className="cursor-pointer hover:bg-yellow-50 transition-colors"
                                            onClick={() => alert(`Job #${r.job_id}\nTitle: ${r.title}\nCity: ${r.location_city}\nAmount: $${Number(r.final_price || 0).toFixed(2)}\nMethod: ${r.payment_method}\nCreated: ${r.created_at}`)}
                                        >
                                            <td className="py-3 pr-4">
                                                <div className="font-medium text-gray-900">
                                                    #{r.job_id} — {r.title}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 text-gray-700">{r.location_city}</td>
                                            <td className="py-3 pr-4 text-gray-700">
                                                {r.final_price ? `$${Number(r.final_price).toFixed(2)}` : "-"}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <StatusPill type="warning" text={String(r.payment_method || "unknown")} />
                                            </td>
                                            <td className="py-3 pr-4 text-gray-700">
                                                {String(r.created_at || "").slice(0, 19).replace("T", " ")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Old pending payments */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">Oldest Pending Payments</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Prioritize these first (highest age in hours)
                    </p>

                    <div className="mt-4 overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b">
                                <tr>
                                    <th className="text-left py-2 pr-4">Payment</th>
                                    <th className="text-left py-2 pr-4">Job</th>
                                    <th className="text-left py-2 pr-4">Method</th>
                                    <th className="text-left py-2 pr-4">Total</th>
                                    <th className="text-left py-2 pr-4">Age (hrs)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {oldPendingPayments.length === 0 ? (
                                    <tr>
                                        <td className="py-3 text-gray-600" colSpan={5}>
                                            No pending payments.
                                        </td>
                                    </tr>
                                ) : (
                                    oldPendingPayments.map((r) => (
                                        <tr
                                            key={r.payment_id}
                                            className="cursor-pointer hover:bg-blue-50 transition-colors"
                                            onClick={() => alert(`Payment #${r.payment_id}\nJob: #${r.job_id}\nMethod: ${r.payment_method}\nAmount: ${centsToCad(r.final_amount_cents)}\nAge: ${n0(r.age_hours)}h`)}
                                        >
                                            <td className="py-3 pr-4 font-medium text-gray-900">#{r.payment_id}</td>
                                            <td className="py-3 pr-4 text-gray-700">#{r.job_id}</td>
                                            <td className="py-3 pr-4">
                                                <StatusPill type="info" text={String(r.payment_method || "unknown")} />
                                            </td>
                                            <td className="py-3 pr-4 text-gray-700">
                                                {centsToCad(r.final_amount_cents)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <StatusPill
                                                    type={n0(r.age_hours) > 72 ? "danger" : n0(r.age_hours) > 24 ? "warning" : "info"}
                                                    text={`${n0(r.age_hours)}h`}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Extra Advanced Widgets */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Refund Reasons */}
                <div className="xl:col-span-1 border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">Refund Reasons</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Top dispute reasons (helps reduce refunds)
                    </p>

                    <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={refundReasons.map((r) => ({
                                    reason: r.reason_code || "unknown",
                                    count: n0(r.refund_count),
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {refundReasons.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {refundReasons.length === 0 && (
                        <p className="text-xs text-gray-500 text-center mt-2">No refund reason data.</p>
                    )}
                </div>

                {/* Top Cities */}
                <div className="xl:col-span-1 border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">Top Cities (Paid)</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Where most paid revenue is coming from
                    </p>

                    <div className="mt-4 overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b">
                                <tr>
                                    <th className="text-left py-2 pr-4">City</th>
                                    <th className="text-left py-2 pr-4">Paid</th>
                                    <th className="text-left py-2 pr-4">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {topCities.length === 0 ? (
                                    <tr><td colSpan={3} className="py-3 text-gray-600">No paid data in range.</td></tr>
                                ) : (
                                    topCities.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 pr-4 font-medium text-gray-900">{r.city}</td>
                                            <td className="py-3 pr-4 text-gray-700">{n0(r.paid_count)}</td>
                                            <td className="py-3 pr-4 text-gray-700">{centsToCad(r.paid_revenue_cents)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Providers */}
                <div className="xl:col-span-1 border border-gray-200 rounded-2xl p-4 bg-white">
                    <h3 className="font-semibold text-gray-900">Top Providers (Paid)</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Highest earning providers in selected period
                    </p>

                    <div className="mt-4 overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b">
                                <tr>
                                    <th className="text-left py-2 pr-4">Provider</th>
                                    <th className="text-left py-2 pr-4">Paid</th>
                                    <th className="text-left py-2 pr-4">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {topProviders.length === 0 ? (
                                    <tr><td colSpan={3} className="py-3 text-gray-600">No paid data in range.</td></tr>
                                ) : (
                                    topProviders.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 pr-4 font-medium text-gray-900">
                                                {String(r.provider_id).length > 10
                                                    ? String(r.provider_id).slice(0, 10) + "…"
                                                    : String(r.provider_id)}
                                            </td>
                                            <td className="py-3 pr-4 text-gray-700">{n0(r.paid_count)}</td>
                                            <td className="py-3 pr-4 text-gray-700">{centsToCad(r.paid_revenue_cents)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Fraud Monitoring */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">AI-Inspired Fraud Monitoring</h3>
                        <p className="text-sm text-gray-600">
                            Behavioral risk detection using payment, refund, and job activity.
                        </p>
                    </div>

                    <StatusPill
                        type={
                            fraudRiskScore >= 70
                                ? "danger"
                                : fraudRiskScore >= 40
                                    ? "warning"
                                    : "success"
                        }
                        text={`Risk Score: ${fraudRiskScore}/100`}
                    />
                </div>

                {/* Fraud KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {fraudSummaryCards.map((item, idx) => (
                        <StatCard
                            key={idx}
                            title={item.label}
                            value={String(item.value)}
                            subtitle="Fraud monitoring signal"
                            icon={AlertTriangle}
                            tone={
                                fraudRiskScore >= 70
                                    ? "danger"
                                    : fraudRiskScore >= 40
                                        ? "warning"
                                        : "default"
                            }
                        />
                    ))}
                </div>

                {/* Fraud alerts + gateway failures */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Fraud Alerts</h3>
                            <p className="text-xs text-gray-500">Actionable risk indicators</p>
                        </div>

                        <div className="mt-4 space-y-3">
                            {fraudAlerts.length === 0 ? (
                                <div className="text-sm text-gray-600">No fraud alerts for this range.</div>
                            ) : (
                                fraudAlerts.map((alert, idx) => (
                                    <InsightCard key={idx} insight={alert} />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                        <h3 className="font-semibold text-gray-900">Failed Payments by Gateway</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Helps identify payment-method-specific issues
                        </p>

                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={failedByGateway.map((r) => ({
                                        method: r.payment_method || "unknown",
                                        failed: n0(r.failed_count),
                                    }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="method" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="failed" radius={[8, 8, 0, 0]}>
                                        {failedByGateway.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {failedByGateway.length === 0 && (
                            <p className="text-xs text-gray-500 text-center mt-2">No failed payment data.</p>
                        )}
                    </div>
                </div>

                {/* Fraud tables */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                        <h3 className="font-semibold text-gray-900">Flagged Providers</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Providers with abnormal refund behavior
                        </p>

                        <div className="mt-4 overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-xs text-gray-500 border-b">
                                    <tr>
                                        <th className="text-left py-2 pr-4">Provider</th>
                                        <th className="text-left py-2 pr-4">Refunds</th>
                                        <th className="text-left py-2 pr-4">Payments</th>
                                        <th className="text-left py-2 pr-4">Refund %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {flaggedProviders.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-3 text-gray-600">
                                                No flagged providers.
                                            </td>
                                        </tr>
                                    ) : (
                                        flaggedProviders.map((r, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 pr-4 font-medium text-gray-900">
                                                    {String(r.provider_id).length > 12
                                                        ? String(r.provider_id).slice(0, 12) + "…"
                                                        : String(r.provider_id)}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-700">{n0(r.refund_count)}</td>
                                                <td className="py-3 pr-4 text-gray-700">{n0(r.payment_count)}</td>
                                                <td className="py-3 pr-4">
                                                    <StatusPill
                                                        type={n0(r.refund_rate_percent) >= 30 ? "danger" : "warning"}
                                                        text={`${n0(r.refund_rate_percent)}%`}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                        <h3 className="font-semibold text-gray-900">Suspicious Customers</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Customers with unusually high pending payment concentration
                        </p>

                        <div className="mt-4 overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-xs text-gray-500 border-b">
                                    <tr>
                                        <th className="text-left py-2 pr-4">Customer</th>
                                        <th className="text-left py-2 pr-4">Pending</th>
                                        <th className="text-left py-2 pr-4">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {suspiciousCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-3 text-gray-600">
                                                No suspicious customers.
                                            </td>
                                        </tr>
                                    ) : (
                                        suspiciousCustomers.map((r, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 pr-4 font-medium text-gray-900">
                                                    {r.customer_id}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-700">
                                                    {n0(r.pending_count)}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-700">
                                                    {centsToCad(r.pending_amount_cents)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                        <h3 className="font-semibold text-gray-900">Rapid Payment Attempts</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Customers with clustered payment activity within 10 minutes
                        </p>

                        <div className="mt-4 overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-xs text-gray-500 border-b">
                                    <tr>
                                        <th className="text-left py-2 pr-4">Customer</th>
                                        <th className="text-left py-2 pr-4">Rapid Events</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {rapidPaymentCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="py-3 text-gray-600">
                                                No rapid payment anomalies.
                                            </td>
                                        </tr>
                                    ) : (
                                        rapidPaymentCustomers.map((r, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 pr-4 font-medium text-gray-900">
                                                    {r.customer_id}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <StatusPill type="info" text={String(n0(r.rapid_count))} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer note */}
            <div className="text-xs text-gray-500">
                QuickFix Payments Analytics — Real-time revenue insights, refund tracking, operational risk monitoring, and AI-inspired fraud detection for the QuickFix platform.
            </div>
        </div>
    );
}
