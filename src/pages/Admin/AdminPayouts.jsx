// src/pages/Admin/AdminPayouts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, RefreshCw, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getEligiblePayouts, payProvider, getPayoutHistory } from "../../api/adminPayouts";

function centsToCad(cents) {
    const n = Number(cents || 0) / 100;
    return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function StatusPill({ status }) {
    const map = {
        queued: "bg-yellow-100 text-yellow-800",
        processing: "bg-blue-100 text-blue-800",
        paid: "bg-green-100 text-green-800",
        completed: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
    };
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${map[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
                }`}
        >
            {status?.toLowerCase() === "paid" || status?.toLowerCase() === "completed" ? (
                <CheckCircle className="w-3 h-3" />
            ) : status?.toLowerCase() === "failed" ? (
                <XCircle className="w-3 h-3" />
            ) : (
                <Clock className="w-3 h-3" />
            )}
            {status || "—"}
        </span>
    );
}

function MethodBadge({ method }) {
    const map = {
        paypal: "bg-blue-50 text-blue-700",
        stripe_connect: "bg-purple-50 text-purple-700",
    };
    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${map[method?.toLowerCase()] || "bg-gray-100 text-gray-700"
                }`}
        >
            {method === "stripe_connect" ? "Stripe Connect" : method === "paypal" ? "PayPal" : method || "—"}
        </span>
    );
}

export default function AdminPayouts() {
    const [tab, setTab] = useState("eligible");
    const [eligible, setEligible] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [payingId, setPayingId] = useState(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    async function loadEligible() {
        setLoading(true);
        setError("");
        try {
            const data = await getEligiblePayouts();
            setEligible(Array.isArray(data) ? data : (data?.items ?? []));
        } catch (e) {
            setError(e.message || "Failed to load eligible payouts.");
        } finally {
            setLoading(false);
        }
    }

    async function loadHistory() {
        setLoading(true);
        setError("");
        try {
            const data = await getPayoutHistory();
            setHistory(Array.isArray(data) ? data : (data?.items ?? []));
        } catch (e) {
            setError(e.message || "Failed to load payout history.");
        } finally {
            setLoading(false);
        }
    }

    function refresh() {
        setSuccessMsg("");
        if (tab === "eligible") loadEligible();
        else loadHistory();
    }

    useEffect(() => {
        if (tab === "eligible") loadEligible();
        else loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const totalEligible = useMemo(
        () => eligible.reduce((sum, r) => sum + Number(r.owed_cents || 0), 0),
        [eligible]
    );

    async function onPay(provider_id) {
        const row = eligible.find(r => r.provider_id === provider_id);
        const providerName = row?.name || row?.provider_name || row?.business_name || provider_id;
        const displayAmt = row?.owed_cents ? centsToCad(row.owed_cents) : "their outstanding earnings";
        if (!window.confirm(`Pay out ${displayAmt} to ${providerName}?`)) return;
        setPayingId(provider_id);
        setError("");
        setSuccessMsg("");
        try {
            const res = await payProvider(provider_id);
            setSuccessMsg(`✅ Payout #${res.payout_id} queued — ${centsToCad(res.amount_cents)}`);
            await loadEligible();
            await loadHistory();
        } catch (e) {
            setError(e.message || "Payout failed.");
        } finally {
            setPayingId(null);
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Provider Payouts</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Trigger payouts for verified providers with outstanding earnings.
                        Clicking <strong>Pay Now</strong> queues the payout via SQS.
                    </p>
                </div>

                <button
                    onClick={refresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:opacity-90 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setTab("eligible")}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${tab === "eligible"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    Ready to Pay
                    {eligible.length > 0 && (
                        <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {eligible.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab("history")}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${tab === "history"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    History
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm font-medium">
                    ❌ {error}
                </div>
            )}
            {successMsg && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
                    {successMsg}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : tab === "eligible" ? (
                <div className="rounded-xl border bg-white overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                        <div className="font-semibold text-gray-800">Eligible providers</div>
                        <div className="text-sm text-gray-600">
                            Total outstanding:{" "}
                            <span className="font-bold text-gray-900">{centsToCad(totalEligible)}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-left p-3 pl-4">Provider</th>
                                    <th className="text-left p-3">Method</th>
                                    <th className="text-left p-3">Earnings</th>
                                    <th className="text-left p-3">Amount</th>
                                    <th className="text-right p-3 pr-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {eligible.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                                            No providers are eligible for payout right now.
                                        </td>
                                    </tr>
                                ) : (
                                    eligible.map((row) => (
                                        <tr key={row.provider_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3 pl-4">
                                                <div className="font-semibold text-gray-900">
                                                    {row.name || row.provider_name || row.business_name || "Provider"}
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono">{row.provider_id}</div>
                                            </td>
                                            <td className="p-3">
                                                <MethodBadge method={row.method} />
                                            </td>
                                            <td className="p-3 text-gray-700">
                                                {row.earning_count != null ? `${row.earning_count} earning${row.earning_count !== 1 ? "s" : ""}` : "—"}
                                            </td>
                                            <td className="p-3 font-bold text-gray-900">{centsToCad(row.owed_cents)}</td>
                                            <td className="p-3 pr-4 text-right">
                                                <button
                                                    onClick={() => onPay(row.provider_id)}
                                                    disabled={payingId === row.provider_id}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity ${payingId === row.provider_id
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-green-600 hover:bg-green-700"
                                                        }`}
                                                >
                                                    {payingId === row.provider_id ? (
                                                        <span className="flex items-center gap-1">
                                                            <Loader2 className="w-3 h-3 animate-spin" /> Paying…
                                                        </span>
                                                    ) : (
                                                        "Pay Now"
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-3 border-t bg-gray-50 text-xs text-gray-400">
                        Clicking "Pay Now" queues a payout job via SQS. The{" "}
                        <code className="bg-gray-200 px-1 rounded">payout_execute</code> Lambda completes it
                        asynchronously.
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border bg-white overflow-hidden">
                    <div className="p-4 border-b font-semibold text-gray-800 bg-gray-50">
                        Payout history
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-left p-3 pl-4">Payout ID</th>
                                    <th className="text-left p-3">Provider</th>
                                    <th className="text-left p-3">Method</th>
                                    <th className="text-left p-3">Amount</th>
                                    <th className="text-left p-3">Status</th>
                                    <th className="text-left p-3">External ID</th>
                                    <th className="text-left p-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400 text-sm">
                                            No payouts processed yet.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((p) => (
                                        <tr key={p.payout_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3 pl-4 font-mono font-semibold text-gray-700">
                                                #{p.payout_id}
                                            </td>
                                            <td className="p-3">
                                                <div className="text-xs text-gray-500 font-mono">{p.provider_id}</div>
                                            </td>
                                            <td className="p-3">
                                                <MethodBadge method={p.method} />
                                            </td>
                                            <td className="p-3 font-bold text-gray-900">{centsToCad(p.amount_cents)}</td>
                                            <td className="p-3">
                                                <StatusPill status={p.status} />
                                            </td>
                                            <td className="p-3 text-xs text-gray-500 font-mono">
                                                {p.external_id || "—"}
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {p.paid_at || p.created_at || "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
