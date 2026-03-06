import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

const StatusPill = ({ status }) => {
    const s = String(status || "").toUpperCase();
    const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
    if (s === "PENDING") return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>PENDING</span>;
    if (s === "APPROVED") return <span className={`${base} bg-green-50 text-green-700 border-green-200`}>APPROVED</span>;
    if (s === "REJECTED") return <span className={`${base} bg-red-50 text-red-700 border-red-200`}>REJECTED</span>;
    return <span className={`${base} bg-neutral-100 text-neutral-700 border-neutral-200`}>{s || "UNKNOWN"}</span>;
};

export default function AdminRefundDetails() {
    const { refundRequestId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");
    const [refund, setRefund] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [adminNote, setAdminNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const getToken = async () => {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (!token) throw new Error("Not authenticated");
        return token;
    };

    const load = async () => {
        setLoading(true);
        setErrMsg("");
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/admin/refunds/${refundRequestId}`, {
                headers: { Authorization: token, "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
            const data = await res.json();
            const rr = data?.refund_request;
            setRefund(rr || null);
            setAttachments(data?.attachments || []);
            setAdminNote(rr?.admin_note || "");
        } catch (e) {
            console.error(e);
            setErrMsg(e?.message || "Failed to load refund details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refundRequestId]);

    const review = async (action) => {
        if (!refund) return;
        if (!window.confirm(action === "APPROVE" ? "Approve this refund request?" : "Reject this refund request?")) return;

        setSubmitting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/admin/refunds/${refundRequestId}/review`, {
                method: "POST",
                headers: { Authorization: token, "Content-Type": "application/json" },
                body: JSON.stringify({ action, admin_note: adminNote?.trim() || "" }),
            });
            if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
            await load();
        } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to submit decision.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
            </div>
        );
    }

    if (errMsg) {
        return (
            <div className="p-6">
                <button onClick={() => navigate("/admin/refunds")} className="mb-4 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
                    ← Back
                </button>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{errMsg}</div>
            </div>
        );
    }

    if (!refund) {
        return (
            <div className="p-6">
                <button onClick={() => navigate("/admin/refunds")} className="mb-4 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
                    ← Back
                </button>
                <p className="text-sm text-neutral-600">Refund request not found.</p>
            </div>
        );
    }

    const isPending = String(refund.status).toUpperCase() === "PENDING";

    return (
        <div className="p-6">
            {/* Page header */}
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <button
                        onClick={() => navigate("/admin/refunds")}
                        className="mb-3 inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                    >
                        ← Back to list
                    </button>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Refund Request #{refund.refund_request_id}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">Payment #{refund.payment_id}</span>
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">Job #{refund.job_id}</span>
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">Customer #{refund.customer_id}</span>
                        <StatusPill status={refund.status} />
                    </div>
                </div>

                {isPending && (
                    <div className="flex shrink-0 gap-2">
                        <button
                            disabled={submitting}
                            onClick={() => review("REJECT")}
                            className="rounded-xl border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                            Reject
                        </button>
                        <button
                            disabled={submitting}
                            onClick={() => review("APPROVE")}
                            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                            {submitting ? "Saving..." : "Approve"}
                        </button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Left: explanation + attachments */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Reason + explanation */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-neutral-800">Reason</h2>
                        <p className="mt-1 text-sm text-neutral-600">{refund.reason_code?.replace(/_/g, " ")}</p>

                        <h2 className="mt-5 text-sm font-semibold text-neutral-800">Customer explanation</h2>
                        <div className="mt-2 whitespace-pre-wrap rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-800 leading-relaxed">
                            {refund.reason_text || <span className="italic text-neutral-400">No explanation provided.</span>}
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-neutral-800">
                            Attachments{" "}
                            <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-600">
                                {attachments.length}
                            </span>
                        </h2>
                        <p className="mt-1 text-xs text-neutral-500">
                            Click any image to open it in full size.
                        </p>

                        {attachments.length === 0 ? (
                            <p className="mt-4 text-sm text-neutral-500 italic">No attachments uploaded.</p>
                        ) : (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {attachments.map((a) => (
                                    <a
                                        key={a.refund_attachment_id}
                                        href={a.view_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 hover:shadow-md transition"
                                    >
                                        <div className="aspect-video w-full overflow-hidden bg-neutral-100">
                                            <img
                                                src={a.view_url}
                                                alt="evidence attachment"
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                onError={(e) => { e.target.style.display = "none"; }}
                                            />
                                        </div>
                                        <div className="p-2">
                                            <p className="truncate text-xs text-neutral-500">{a.s3_key?.split("/").pop()}</p>
                                            <p className="mt-0.5 text-xs font-semibold text-blue-600 group-hover:underline">Open ↗</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: admin note + checklist */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-neutral-800">Admin note</h2>
                        <p className="mt-1 text-xs text-neutral-500">
                            {isPending ? "Your note will be saved with the decision." : "Decision note (read-only)."}
                        </p>
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            rows={6}
                            disabled={!isPending}
                            placeholder="Example: Approved — screenshots confirm incomplete work."
                            className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-500"
                        />
                        {!isPending && (
                            <p className="mt-2 text-xs text-neutral-500">
                                This request is already {String(refund.status).toLowerCase()}.
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
                        <p className="font-semibold">Review checklist</p>
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                            <li>Check explanation clarity and timeline</li>
                            <li>Verify attachments match the job/service</li>
                            <li>Confirm payment is eligible for refund</li>
                            <li>Add a short admin note for audit trail</li>
                        </ul>
                    </div>

                    {refund.reviewed_at && (
                        <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-xs text-neutral-500">
                            <p><span className="font-semibold text-neutral-700">Reviewed at:</span> {new Date(refund.reviewed_at).toLocaleString()}</p>
                            {refund.reviewed_by && <p className="mt-1"><span className="font-semibold text-neutral-700">Reviewed by:</span> {refund.reviewed_by}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
