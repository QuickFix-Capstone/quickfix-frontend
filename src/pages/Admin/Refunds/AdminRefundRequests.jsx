import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = "/api";

const StatusPill = ({ status }) => {
    const s = String(status || "").toUpperCase();
    const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
    if (s === "PENDING") return <span className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}>PENDING</span>;
    if (s === "APPROVED") return <span className={`${base} bg-green-50 text-green-700 border border-green-200`}>APPROVED</span>;
    if (s === "REJECTED") return <span className={`${base} bg-red-50 text-red-700 border border-red-200`}>REJECTED</span>;
    return <span className={`${base} bg-neutral-100 text-neutral-700`}>{s || "UNKNOWN"}</span>;
};

export default function AdminRefundRequests() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("PENDING");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    const load = async () => {
        setLoading(true);
        setErrMsg("");
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.accessToken?.toString();
            if (!token) throw new Error("Not authenticated");
            const url = status
                ? `${API_BASE}/admin/refunds?status=${encodeURIComponent(status)}`
                : `${API_BASE}/admin/refunds`;
            const res = await fetch(url, {
                method: "GET",
                headers: { Authorization: token, "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
            const data = await res.json();
            setItems(data?.items || []);
        } catch (e) {
            console.error(e);
            setErrMsg(e?.message || "Failed to load refund requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Refund Requests</h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Review customer refund requests, view evidence, and approve or reject.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                    >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="">All</option>
                    </select>
                    <button
                        onClick={load}
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                {/* Table head */}
                <div className="hidden md:grid grid-cols-12 gap-2 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <div className="col-span-2">Request ID</div>
                    <div className="col-span-2">Payment</div>
                    <div className="col-span-2">Job</div>
                    <div className="col-span-3">Reason</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
                    </div>
                ) : errMsg ? (
                    <div className="p-6 text-sm text-red-600">{errMsg}</div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                            <span className="text-2xl">📋</span>
                        </div>
                        <p className="text-sm text-neutral-600">No {status.toLowerCase()} refund requests found.</p>
                    </div>
                ) : (
                    items.map((r) => (
                        <div
                            key={r.refund_request_id}
                            className="grid grid-cols-2 md:grid-cols-12 gap-2 border-b border-neutral-100 px-5 py-4 text-sm hover:bg-neutral-50 last:border-0"
                        >
                            <div className="md:col-span-2 font-semibold text-neutral-900">#{r.refund_request_id}</div>
                            <div className="md:col-span-2 text-neutral-600">#{r.payment_id}</div>
                            <div className="md:col-span-2 text-neutral-600">#{r.job_id}</div>
                            <div className="md:col-span-3 text-neutral-600 truncate">{r.reason_code?.replace(/_/g, " ")}</div>
                            <div className="md:col-span-2"><StatusPill status={r.status} /></div>
                            <div className="md:col-span-1 text-right">
                                <button
                                    onClick={() => navigate(`/admin/refunds/${r.refund_request_id}`)}
                                    className="rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
