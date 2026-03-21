import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, FileSearch, Filter, Eye, Phone, Ban } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

const STATUS_CONFIG = {
    PENDING: {
        pill: "bg-amber-50 text-amber-700 border border-amber-200",
        row: "border-l-4 border-l-amber-400",
        icon: <Clock className="w-3.5 h-3.5" />,
        dot: "bg-amber-400",
    },
    UNDER_REVIEW: {
        pill: "bg-blue-50 text-blue-700 border border-blue-200",
        row: "border-l-4 border-l-blue-400",
        icon: <Eye className="w-3.5 h-3.5" />,
        dot: "bg-blue-400",
    },
    PROVIDER_CONTACTED: {
        pill: "bg-purple-50 text-purple-700 border border-purple-200",
        row: "border-l-4 border-l-purple-400",
        icon: <Phone className="w-3.5 h-3.5" />,
        dot: "bg-purple-400",
    },
    REFUNDED: {
        pill: "bg-green-50 text-green-700 border border-green-200",
        row: "border-l-4 border-l-green-400",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        dot: "bg-green-400",
    },
    RESOLVED: {
        pill: "bg-indigo-50 text-indigo-700 border border-indigo-200",
        row: "border-l-4 border-l-indigo-400",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        dot: "bg-indigo-400",
    },
    REJECTED: {
        pill: "bg-red-50 text-red-700 border border-red-200",
        row: "border-l-4 border-l-red-400",
        icon: <XCircle className="w-3.5 h-3.5" />,
        dot: "bg-red-400",
    },
};

const StatusPill = ({ status }) => {
    const s = String(status || "").toUpperCase();
    const cfg = STATUS_CONFIG[s] || { pill: "bg-neutral-100 text-neutral-700", icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.pill}`}>
            {cfg.icon}
            {s || "UNKNOWN"}
        </span>
    );
};

const SummaryCard = ({ label, count, color, icon: Icon }) => (
    <div className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm ${color}`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.replace("border-", "bg-").replace("-200", "-100")}`}>
            <Icon className={`w-5 h-5 ${color.replace("border-", "text-").replace("-200", "-600")}`} />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
    </div>
);

const REASON_LABELS = {
    service_not_completed: "Service Not Completed",
    service_quality: "Service Quality",
    overcharged: "Overcharged",
    provider_no_show: "Provider No-Show",
    duplicate_payment: "Duplicate Payment",
    other: "Other",
};

export default function AdminRefundRequests() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [items, setItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    const load = async (filter = statusFilter) => {
        setLoading(true);
        setErrMsg("");
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.accessToken?.toString();
            if (!token) throw new Error("Not authenticated");

            // Load filtered items
            const url = filter
                ? `${API_BASE}/admin/refunds?status=${encodeURIComponent(filter)}`
                : `${API_BASE}/admin/refunds`;
            const res = await fetch(url, {
                headers: { Authorization: token, "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
            const data = await res.json();
            setItems(data?.items || []);

            // Also load all for summary counts
            const allRes = await fetch(`${API_BASE}/admin/refunds`, {
                headers: { Authorization: token, "Content-Type": "application/json" },
            });
            if (allRes.ok) {
                const allData = await allRes.json();
                setAllItems(allData?.items || []);
            }
        } catch (e) {
            setErrMsg(e?.message || "Failed to load refund requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const counts = {
        pending: allItems.filter(r => r.status?.toUpperCase() === "PENDING").length,
        underReview: allItems.filter(r => r.status?.toUpperCase() === "UNDER_REVIEW").length,
        providerContacted: allItems.filter(r => r.status?.toUpperCase() === "PROVIDER_CONTACTED").length,
        refunded: allItems.filter(r => r.status?.toUpperCase() === "REFUNDED").length,
        resolved: allItems.filter(r => r.status?.toUpperCase() === "RESOLVED").length,
        rejected: allItems.filter(r => r.status?.toUpperCase() === "REJECTED").length,
    };

    const activeCount = counts.pending + counts.underReview + counts.providerContacted;

    const FILTER_TABS = [
        { label: "All", value: "" },
        { label: "Pending", value: "PENDING" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Provider Contacted", value: "PROVIDER_CONTACTED" },
        { label: "Refunded", value: "REFUNDED" },
        { label: "Resolved", value: "RESOLVED" },
        { label: "Rejected", value: "REJECTED" },
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FileSearch className="w-6 h-6 text-indigo-500" />
                        Refund Requests
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Review customer refund requests, examine evidence, and take action.
                    </p>
                </div>
                <button
                    onClick={() => load(statusFilter)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryCard label="Pending" count={counts.pending} color="border-amber-200" icon={Clock} />
                <SummaryCard label="Under Review" count={counts.underReview} color="border-blue-200" icon={Eye} />
                <SummaryCard label="Provider Contacted" count={counts.providerContacted} color="border-purple-200" icon={Phone} />
                <SummaryCard label="Refunded" count={counts.refunded} color="border-green-200" icon={CheckCircle2} />
                <SummaryCard label="Resolved" count={counts.resolved} color="border-indigo-200" icon={CheckCircle2} />
                <SummaryCard label="Rejected" count={counts.rejected} color="border-red-200" icon={XCircle} />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${statusFilter === tab.value
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.label}
                            {tab.value === "PENDING" && counts.pending > 0 && (
                                <span className="ml-1.5 inline-flex h-4 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                                    {counts.pending}
                                </span>
                            )}
                            {tab.value === "" && activeCount > 0 && (
                                <span className="ml-1.5 inline-flex h-4 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {errMsg && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errMsg}
                </div>
            )}

            {/* Table Card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Table head */}
                <div className="hidden md:grid grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <div className="col-span-2">Request</div>
                    <div className="col-span-2">Payment</div>
                    <div className="col-span-2">Job</div>
                    <div className="col-span-3">Reason</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-indigo-500" />
                        <p className="text-sm text-gray-400">Loading refund requests…</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                            <FileSearch className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-700">No refund requests</p>
                            <p className="text-sm text-gray-400 mt-1">
                                There are no {statusFilter ? statusFilter.toLowerCase() : ""} refund requests at the moment.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((r) => {
                            const s = String(r.status || "").toUpperCase();
                            const cfg = STATUS_CONFIG[s] || {};
                            return (
                                <div
                                    key={r.refund_request_id}
                                    className={`grid grid-cols-2 md:grid-cols-12 gap-2 items-center px-5 py-4 text-sm hover:bg-gray-50 transition-colors cursor-pointer group ${cfg.row || ""}`}
                                    onClick={() => navigate(`/admin/refunds/${r.refund_request_id}`)}
                                >
                                    <div className="md:col-span-2">
                                        <span className="font-bold text-gray-900">#{r.refund_request_id}</span>
                                    </div>
                                    <div className="md:col-span-2 text-gray-500 font-mono text-xs">
                                        #{r.payment_id}
                                    </div>
                                    <div className="md:col-span-2 text-gray-500 font-mono text-xs">
                                        #{r.job_id}
                                    </div>
                                    <div className="md:col-span-3">
                                        <span className="inline-block rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                            {REASON_LABELS[r.reason_code?.toLowerCase()] || r.reason_code?.replace(/_/g, " ") || "—"}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <StatusPill status={r.status} />
                                    </div>
                                    <div className="md:col-span-1 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/refunds/${r.refund_request_id}`); }}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors group-hover:shadow-md"
                                        >
                                            Review →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-400">
                        Showing {items.length} {statusFilter ? statusFilter.toLowerCase() : ""} request{items.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>
        </div>
    );
}
