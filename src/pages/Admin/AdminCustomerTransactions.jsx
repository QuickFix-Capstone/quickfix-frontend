import React, { useEffect, useMemo, useState } from "react";
import {
    RefreshCw, CreditCard, CheckCircle2, Clock, XCircle,
    Search, Filter, Download, ArrowUpDown, Receipt, Users
} from "lucide-react";
import { getAdminCustomerTransactions } from "../../api/adminCustomerTransactions";

/* ─── Helpers ─────────────────────────────────────────────────── */
function centsToCad(cents) {
    return (Number(cents || 0) / 100).toLocaleString("en-CA", {
        style: "currency", currency: "CAD",
    });
}

function fmtDate(v) {
    if (!v) return "—";
    try { return new Date(v).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }); }
    catch { return v; }
}

function exportCSV(rows) {
    if (!rows.length) return;
    const cols = ["payment_id", "job_id", "customer_id", "customer_name", "customer_email",
        "payment_method", "final_amount_cents", "status", "paid_at", "created_at"];
    const header = cols.join(",");
    const body = rows.map(r => cols.map(c => JSON.stringify(String(r[c] ?? ""))).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "customer_transactions.csv"; a.click();
    URL.revokeObjectURL(url);
}

/* ─── Sub-components ──────────────────────────────────────────── */
const STATUS_CFG = {
    paid: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-emerald-400" },
    pending: { pill: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-amber-400" },
    failed: { pill: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="w-3.5 h-3.5" />, dot: "bg-red-400" },
    refunded: { pill: "bg-blue-50 text-blue-700 border-blue-200", icon: <CreditCard className="w-3.5 h-3.5" />, dot: "bg-blue-400" },
};

function StatusPill({ status }) {
    const s = String(status || "").toLowerCase();
    const cfg = STATUS_CFG[s] || { pill: "bg-gray-100 text-gray-700 border-gray-200", icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
            {cfg.icon}{status || "—"}
        </span>
    );
}

function SummaryCard({ label, value, sub, color, icon: Icon }) {
    return (
        <div className={`flex items-center gap-4 rounded-2xl border p-4 bg-white shadow-sm ${color}`}>
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color.replace("border-", "bg-").replace("-200", "-100")}`}>
                <Icon className={`w-5 h-5 ${color.replace("border-", "text-").replace("-200", "-600")}`} />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
                {sub && <p className="text-xs font-semibold text-gray-700 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function AdminCustomerTransactions() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    // Filters & UI state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortKey, setSortKey] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [viewMode, setViewMode] = useState("flat"); // "flat" | "grouped"

    async function load() {
        setLoading(true);
        setErrMsg("");
        try {
            const res = await getAdminCustomerTransactions();
            setItems(Array.isArray(res?.items) ? res.items : []);
        } catch (e) {
            setErrMsg(e?.message || "Failed to load customer transactions.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    /* ── Computed stats ── */
    const stats = useMemo(() => {
        const paid = items.filter(x => x.status?.toLowerCase() === "paid");
        const pending = items.filter(x => x.status?.toLowerCase() === "pending");
        const failed = items.filter(x => x.status?.toLowerCase() === "failed");
        const totalValue = items.reduce((s, r) => s + Number(r.final_amount_cents || 0), 0);
        const paidValue = paid.reduce((s, r) => s + Number(r.final_amount_cents || 0), 0);
        const uniqueCustomers = new Set(items.map(r => r.customer_id)).size;
        return { paid: paid.length, pending: pending.length, failed: failed.length, totalValue, paidValue, uniqueCustomers };
    }, [items]);

    /* ── Filtered + sorted rows ── */
    const filtered = useMemo(() => {
        let rows = [...items];
        if (statusFilter) rows = rows.filter(r => r.status?.toLowerCase() === statusFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter(r =>
                String(r.payment_id).includes(q) ||
                String(r.job_id).includes(q) ||
                String(r.customer_id || "").toLowerCase().includes(q) ||
                String(r.customer_name || "").toLowerCase().includes(q) ||
                String(r.customer_email || "").toLowerCase().includes(q)
            );
        }
        rows.sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (sortKey === "final_amount_cents") { av = Number(av || 0); bv = Number(bv || 0); }
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
        return rows;
    }, [items, search, statusFilter, sortKey, sortDir]);

    /* ── Grouped by customer ── */
    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(r => {
            const key = r.customer_id || "unknown";
            if (!map[key]) map[key] = { customer_id: key, name: r.customer_name || "—", email: r.customer_email || "—", rows: [] };
            map[key].rows.push(r);
        });
        return Object.values(map).sort((a, b) => b.rows.length - a.rows.length);
    }, [filtered]);

    function toggleSort(key) {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    }

    const SortBtn = ({ col }) => (
        <button onClick={() => toggleSort(col)} className="ml-1 inline-flex opacity-50 hover:opacity-100 transition-opacity">
            <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
    );

    const STATUS_TABS = [
        { label: "All", value: "" },
        { label: "Paid", value: "paid" },
        { label: "Pending", value: "pending" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-500" />
                        Customer Transactions
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Full view of all customer payment records across the platform.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => exportCSV(filtered)}
                        title="Export visible rows as CSV"
                        className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <SummaryCard label="Total Transactions" value={items.length} sub={`${stats.uniqueCustomers} customers`} color="border-gray-200" icon={CreditCard} />
                <SummaryCard label="Paid" value={stats.paid} sub={centsToCad(stats.paidValue)} color="border-emerald-200" icon={CheckCircle2} />
                <SummaryCard label="Pending" value={stats.pending} color="border-amber-200" icon={Clock} />
                <SummaryCard label="Total Value" value={centsToCad(stats.totalValue)} sub="All statuses" color="border-indigo-200" icon={Users} />
            </div>

            {/* ── Error ── */}
            {errMsg && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <XCircle className="w-4 h-4 flex-shrink-0" />{errMsg}
                </div>
            )}

            {/* ── Controls ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, customer, email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Status filter tabs */}
                    <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
                        {STATUS_TABS.map(t => (
                            <button
                                key={t.value}
                                onClick={() => setStatusFilter(t.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === t.value
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* View mode toggle */}
                    <div className="flex gap-1 rounded-xl bg-gray-100 p-1 text-xs">
                        <button onClick={() => setViewMode("flat")} className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${viewMode === "flat" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>Flat</button>
                        <button onClick={() => setViewMode("grouped")} className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${viewMode === "grouped" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>By Customer</button>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-indigo-500" />
                        <p className="text-sm text-gray-400">Loading transactions…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                            <Filter className="w-7 h-7 text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-700">No transactions found</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
                        </div>
                    </div>
                ) : viewMode === "flat" ? (
                    /* ── FLAT VIEW ── */
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 font-semibold">Payment <SortBtn col="payment_id" /></th>
                                    <th className="px-4 py-3 font-semibold">Job</th>
                                    <th className="px-4 py-3 font-semibold">Customer <SortBtn col="customer_name" /></th>
                                    <th className="px-4 py-3 font-semibold">Email</th>
                                    <th className="px-4 py-3 font-semibold">Method</th>
                                    <th className="px-4 py-3 font-semibold">Amount <SortBtn col="final_amount_cents" /></th>
                                    <th className="px-4 py-3 font-semibold">Status <SortBtn col="status" /></th>
                                    <th className="px-4 py-3 font-semibold">Paid At <SortBtn col="paid_at" /></th>
                                    <th className="px-4 py-3 font-semibold">Created <SortBtn col="created_at" /></th>
                                    <th className="px-4 py-3 font-semibold text-right">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(row => (
                                    <tr key={row.payment_id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-3 font-bold text-gray-900">#{row.payment_id}</td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{row.job_id ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{row.customer_name || "—"}</div>
                                            <div className="text-xs text-gray-400 font-mono">{row.customer_id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{row.customer_email || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                                                {row.payment_method || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-900">{centsToCad(row.final_amount_cents)}</td>
                                        <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(row.paid_at)}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(row.created_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {row.invoice_url ? (
                                                <button
                                                    onClick={() => window.open(row.invoice_url, "_blank", "noopener,noreferrer")}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    <Receipt className="w-3.5 h-3.5" /> View
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* ── GROUPED BY CUSTOMER VIEW ── */
                    <div className="divide-y divide-gray-100">
                        {grouped.map(group => (
                            <CustomerGroup key={group.customer_id} group={group} />
                        ))}
                    </div>
                )}

                {/* Footer */}
                {!loading && filtered.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 flex items-center justify-between text-xs text-gray-400">
                        <span>Showing {filtered.length} of {items.length} transactions</span>
                        <span>{stats.uniqueCustomers} unique customers</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Grouped Customer Row ─────────────────────────────────────── */
function CustomerGroup({ group }) {
    const [expanded, setExpanded] = useState(false);
    const totalValue = group.rows.reduce((s, r) => s + Number(r.final_amount_cents || 0), 0);
    const paid = group.rows.filter(r => r.status?.toLowerCase() === "paid").length;

    return (
        <div>
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                        {String(group.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{group.name}</p>
                        <p className="text-xs text-gray-400">{group.email} · {group.customer_id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                        <p className="font-bold text-gray-900">{(Number(totalValue) / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}</p>
                        <p className="text-xs text-gray-400">{group.rows.length} txn · {paid} paid</p>
                    </div>
                    <span className={`text-gray-400 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}>›</span>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                    <table className="min-w-full text-xs">
                        <thead>
                            <tr className="text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                <th className="px-8 py-2 text-left font-semibold">Payment</th>
                                <th className="px-4 py-2 text-left font-semibold">Job</th>
                                <th className="px-4 py-2 text-left font-semibold">Method</th>
                                <th className="px-4 py-2 text-left font-semibold">Amount</th>
                                <th className="px-4 py-2 text-left font-semibold">Status</th>
                                <th className="px-4 py-2 text-left font-semibold">Date</th>
                                <th className="px-4 py-2 text-right font-semibold">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {group.rows.map(row => (
                                <tr key={row.payment_id} className="hover:bg-white transition-colors">
                                    <td className="px-8 py-2.5 font-bold text-gray-800">#{row.payment_id}</td>
                                    <td className="px-4 py-2.5 text-gray-500 font-mono">#{row.job_id ?? "—"}</td>
                                    <td className="px-4 py-2.5">
                                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-semibold capitalize">{row.payment_method || "—"}</span>
                                    </td>
                                    <td className="px-4 py-2.5 font-bold text-gray-900">{(Number(row.final_amount_cents || 0) / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}</td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_CFG[row.status?.toLowerCase()]?.pill || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                                            {row.status || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500">
                                        {row.paid_at ? new Date(row.paid_at).toLocaleDateString("en-CA") : new Date(row.created_at).toLocaleDateString("en-CA")}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        {row.invoice_url ? (
                                            <a href={row.invoice_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold">
                                                <Receipt className="w-3 h-3" /> View
                                            </a>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
