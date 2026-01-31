import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { getReceipt, getAuthHeaders } from "../api/payments";
import Card from "../components/UI/Card";

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function ReceiptNew() {
    const { paymentId } = useParams();
    const auth = useAuth();
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                // Wait for auth to load
                if (auth.isLoading) return;

                const authHeaders = getAuthHeaders(auth.user);
                const r = await getReceipt(paymentId, authHeaders);
                // Unwrap payment object if it exists
                setData(r.payment || r);
            } catch (e) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [paymentId, auth.isLoading, auth.user]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading receipt...</div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-3xl">
                    <Card className="border-red-200 bg-red-50 p-6">
                        <h2 className="text-xl font-bold text-red-700">Receipt Error</h2>
                        <p className="mt-2 text-red-600">{err}</p>
                    </Card>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-3xl">
                    <Card className="p-6">
                        <p className="text-neutral-600">No receipt found.</p>
                    </Card>
                </div>
            </div>
        );
    }

    const status = (data.status || "").toUpperCase();
    const isPaid = status === "PAID" || status === "COMPLETED" || status === "SUCCEEDED";

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold text-neutral-900">Payment Receipt</h2>
                    <span className={badgeStyle(isPaid)}>{isPaid ? "PAID" : status || "PENDING"}</span>
                </div>

                <Card className="border-neutral-200 bg-white p-6 shadow-lg">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Info label="Payment ID" value={data.payment_id ?? data.paymentId ?? paymentId} />
                        <Info label="Job ID" value={data.job_id ?? data.jobId ?? "-"} />
                        <Info label="Provider" value={(data.provider || "-").toUpperCase()} />
                        <Info label="Currency" value={(data.currency || "cad").toUpperCase()} />
                        <Info
                            label="Provider Payment ID"
                            value={data.provider_payment_id || data.stripe_payment_intent_id || "-"}
                        />
                        <Info label="Created At" value={formatDate(data.created_at || data.createdAt)} />
                    </div>

                    <hr className="my-6 border-neutral-200" />

                    <h3 className="mb-4 text-xl font-semibold text-neutral-900">Amounts</h3>
                    <div className="space-y-3">
                        <Row label="Base price" value={money(data.amounts?.base_amount_cents ?? data.base_amount_cents)} />
                        <Row label="Tax" value={money(data.amounts?.tax_cents ?? data.tax_cents ?? data.tax_amount_cents)} />
                        <Row label="Application fee" value={money(data.amounts?.app_fee_cents ?? data.app_fee_cents)} />
                        <div className="border-t border-neutral-200 pt-3">
                            <Row
                                label={<span className="font-bold">Grand total</span>}
                                value={<span className="font-bold text-lg">{money(data.amounts?.final_amount_cents ?? data.final_amount_cents)}</span>}
                            />
                        </div>
                    </div>

                    {!isPaid && (
                        <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                            If your status is still pending, refresh in a moment (webhook may still be processing).
                        </div>
                    )}
                </Card>

                <div className="mt-6 flex gap-3">
                    <Link
                        to="/customer/dashboard"
                        className="rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-800 transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                    <Link
                        to="/customer/jobs"
                        className="rounded-xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-900 hover:border-neutral-400 transition-colors"
                    >
                        View My Jobs
                    </Link>
                </div>
            </div>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="mt-1 break-words font-semibold text-neutral-900">{value}</div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="text-neutral-700">{label}</div>
            <div className="text-neutral-900">{value}</div>
        </div>
    );
}

function badgeStyle(paid) {
    return `inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${paid
        ? "border border-green-700 bg-green-100 text-green-800"
        : "border border-yellow-600 bg-yellow-100 text-yellow-800"
        }`;
}

function formatDate(d) {
    if (!d) return "-";
    try {
        return new Date(d).toLocaleString();
    } catch {
        return String(d);
    }
}
