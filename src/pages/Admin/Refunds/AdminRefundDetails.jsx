import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

const btnBase = "px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors";
const styles = {
    green:  `${btnBase} bg-green-600 hover:bg-green-700`,
    red:    `${btnBase} bg-red-600 hover:bg-red-700`,
    blue:   `${btnBase} bg-blue-600 hover:bg-blue-700`,
    indigo: `${btnBase} bg-indigo-600 hover:bg-indigo-700`,
    amber:  `${btnBase} bg-amber-500 hover:bg-amber-600`,
};

const STATUS_CONFIG = {
    PENDING:            { pill: "bg-amber-50 text-amber-700 border border-amber-200" },
    UNDER_REVIEW:       { pill: "bg-blue-50 text-blue-700 border border-blue-200" },
    PROVIDER_CONTACTED: { pill: "bg-purple-50 text-purple-700 border border-purple-200" },
    REFUNDED:           { pill: "bg-green-50 text-green-700 border border-green-200" },
    RESOLVED:           { pill: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
    REJECTED:           { pill: "bg-red-50 text-red-700 border border-red-200" },
};

const StatusPill = ({ status }) => {
    const s = String(status || "").toUpperCase();
    const cfg = STATUS_CONFIG[s] || { pill: "bg-neutral-100 text-neutral-700" };
    const label = s.replace(/_/g, " ") || "UNKNOWN";
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${cfg.pill}`}>
            {label}
        </span>
    );
};

export default function AdminRefundDetails() {
    const { refundRequestId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading]     = useState(true);
    const [errMsg, setErrMsg]       = useState("");
    const [refund, setRefund]       = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [adminNote, setAdminNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ─── Auth ────────────────────────────────────────────────────────────────
    const getToken = async () => {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (!token) throw new Error("Not authenticated");
        return token;
    };

    // ─── Generic API caller ──────────────────────────────────────────────────
    const callApi = async (url, body = null) => {
        const token = await getToken();
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : null,
        });
        if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
        return res.json();
    };

    // ─── Load ────────────────────────────────────────────────────────────────
    const load = async () => {
        setLoading(true);
        setErrMsg("");
        try {
            // --- TEMP DEBUG: remove after checking ---
            const session = await fetchAuthSession();
            console.log("accessToken:", session.tokens?.accessToken?.toString());
            console.log("idToken:", session.tokens?.idToken?.toString());
            console.log("accessToken payload:", session.tokens?.accessToken?.payload);
            console.log("idToken payload:", session.tokens?.idToken?.payload);
            // --- END DEBUG ---

            const token = await getToken();
            const res = await fetch(`${API_BASE}/admin/refunds/${refundRequestId}`, {
                headers: { Authorization: token, "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
            const data = await res.json();
            const rr = data?.refund_request;
            const prov = data?.provider || {};
            const job  = data?.job  || {};

            // Merge nested provider + job fields into a flat refund object
            // so the cards can read refund.provider_name, refund.job_title, etc.
            const merged = rr ? {
                ...rr,
                // provider fields
                provider_name:          prov.name,
                business_name:          prov.business_name,
                provider_email:         prov.email,
                provider_phone_number:  prov.phone_number,
                provider_address_line:  prov.address_line,
                provider_city:          prov.city,
                provider_province:      prov.province,
                provider_postal_code:   prov.postal_code,
                verification_status:    prov.verification_status,
                provider_is_active:     prov.is_active,
                // job fields
                job_title:      job.title,
                job_category:   job.category,
                job_description: job.description,
                job_status:     job.status,
                preferred_date: job.preferred_date,
                preferred_time: job.preferred_time,
                location_address: job.location_address,
                location_city:  job.location_city,
                location_state: job.location_state,
                location_zip:   job.location_zip,
                final_price:    job.final_price,
            } : null;

            setRefund(merged);
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

    // ─── Actions ─────────────────────────────────────────────────────────────
    const withSubmit = (fn) => async () => {
        setSubmitting(true);
        try {
            await fn();
        } catch (e) {
            console.error(e);
            alert(e?.message || "Action failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const moveToReview = withSubmit(async () => {
        await callApi(`${API_BASE}/admin/refunds/${refundRequestId}/review`, {
            action: "MOVE_TO_REVIEW",
            admin_note: adminNote?.trim() || "",
        });
        await load();
    });

    const rejectRefund = withSubmit(async () => {
        if (!window.confirm("Reject this refund request?")) return;
        await callApi(`${API_BASE}/admin/refunds/${refundRequestId}/review`, {
            action: "REJECT",
            admin_note: adminNote?.trim() || "",
        });
        await load();
    });

    const markProviderContacted = withSubmit(async () => {
        await callApi(`${API_BASE}/admin/refunds/${refundRequestId}/provider-contacted`, {
            admin_note: adminNote?.trim() || "",
        });
        await load();
    });

    const resolveCase = withSubmit(async () => {
        if (!window.confirm("Mark this case as Resolved?")) return;
        await callApi(`${API_BASE}/admin/refunds/${refundRequestId}/resolve`, {
            admin_note: adminNote?.trim() || "",
            resolution_outcome: "FIXED",
        });
        await load();
    });

    const approveRefund = withSubmit(async () => {
        if (!window.confirm("Approve this refund request?")) return;
        await callApi(`${API_BASE}/admin/refunds/${refundRequestId}/approve`, {
            admin_note: adminNote?.trim() || "",
        });
        await load();
    });

    // ─── Loading / Error states ──────────────────────────────────────────────
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

    const status = String(refund.status || "").toUpperCase();
    const isTerminal = ["REFUNDED", "RESOLVED", "REJECTED"].includes(status);

    // ─── Dynamic action buttons ──────────────────────────────────────────────
    const ActionButtons = () => (
        <div className="flex gap-2 flex-wrap">
            {status === "PENDING" && (
                <>
                    <button disabled={submitting} onClick={rejectRefund}  className={styles.red}>Reject</button>
                    <button disabled={submitting} onClick={moveToReview}  className={styles.blue}>{submitting ? "Saving…" : "Move to Review"}</button>
                </>
            )}
            {status === "UNDER_REVIEW" && (
                <>
                    <button disabled={submitting} onClick={rejectRefund}           className={styles.red}>Reject</button>
                    <button disabled={submitting} onClick={resolveCase}            className={styles.indigo}>Resolved</button>
                    <button disabled={submitting} onClick={markProviderContacted}  className={styles.amber}>{submitting ? "Saving…" : "Provider Contacted"}</button>
                    <button disabled={submitting} onClick={approveRefund}          className={styles.green}>Approve Refund</button>
                </>
            )}
            {status === "PROVIDER_CONTACTED" && (
                <>
                    <button disabled={submitting} onClick={rejectRefund}  className={styles.red}>Reject</button>
                    <button disabled={submitting} onClick={resolveCase}   className={styles.indigo}>Resolved</button>
                    <button disabled={submitting} onClick={approveRefund} className={styles.green}>{submitting ? "Saving…" : "Approve Refund"}</button>
                </>
            )}
        </div>
    );

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

                {!isTerminal && <ActionButtons />}
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
                        <p className="mt-1 text-xs text-neutral-500">Click any image to open it in full size.</p>

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

                {/* Right: admin note + checklist + meta */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-neutral-800">Admin note</h2>
                        <p className="mt-1 text-xs text-neutral-500">
                            {isTerminal ? "Decision note (read-only)." : "Your note will be saved with the decision."}
                        </p>
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            rows={6}
                            disabled={isTerminal}
                            placeholder="Example: Approved — screenshots confirm incomplete work."
                            className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-500"
                        />
                        {isTerminal && (
                            <p className="mt-2 text-xs text-neutral-500">
                                This request is already <span className="font-medium">{status.replace(/_/g, " ").toLowerCase()}</span>.
                            </p>
                        )}
                    </div>

                    {/* Workflow guide */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
                        <p className="font-semibold">Workflow</p>
                        <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm">
                            <li><span className="font-medium">PENDING</span> → Move to Review</li>
                            <li><span className="font-medium">UNDER_REVIEW</span> → Provider Contacted / Approve / Resolved / Reject</li>
                            <li><span className="font-medium">PROVIDER_CONTACTED</span> → Approve / Resolved / Reject</li>
                        </ol>
                    </div>

                    {/* Review checklist */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
                        <p className="font-semibold text-neutral-800">Review checklist</p>
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-neutral-600">
                            <li>Check explanation clarity and timeline</li>
                            <li>Verify attachments match the job/service</li>
                            <li>Confirm payment is eligible for refund</li>
                            <li>Add a short admin note for audit trail</li>
                        </ul>
                    </div>

                    {/* Reviewed at / by */}
                    {refund.reviewed_at && (
                        <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-xs text-neutral-500">
                            <p><span className="font-semibold text-neutral-700">Reviewed at:</span> {new Date(refund.reviewed_at).toLocaleString()}</p>
                            {refund.reviewed_by && <p className="mt-1"><span className="font-semibold text-neutral-700">Reviewed by:</span> {refund.reviewed_by}</p>}
                        </div>
                    )}

                    {/* Provider Details */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-neutral-800">Service Provider Details</h2>
                        <div className="mt-3 space-y-2 text-sm text-neutral-700">
                            <p>
                                <span className="font-semibold text-neutral-800">Provider ID:</span>{" "}
                                {refund.provider_id || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Name:</span>{" "}
                                {refund.provider_name || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Business Name:</span>{" "}
                                {refund.business_name || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Email:</span>{" "}
                                {refund.provider_email || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Phone:</span>{" "}
                                {refund.provider_phone_number || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Address:</span>{" "}
                                {[refund.provider_address_line, refund.provider_city, refund.provider_province, refund.provider_postal_code]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Verification:</span>{" "}
                                {refund.verification_status || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Active:</span>{" "}
                                {refund.provider_is_active ? "Yes" : "No"}
                            </p>
                        </div>
                    </div>

                    {/* Job Details */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-neutral-800">Job Details</h2>
                        <div className="mt-3 space-y-2 text-sm text-neutral-700">
                            <p>
                                <span className="font-semibold text-neutral-800">Job ID:</span>{" "}
                                {refund.job_id || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Title:</span>{" "}
                                {refund.job_title || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Category:</span>{" "}
                                {refund.job_category || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Description:</span>{" "}
                                {refund.job_description || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Status:</span>{" "}
                                {refund.job_status || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Preferred Date:</span>{" "}
                                {refund.preferred_date || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Preferred Time:</span>{" "}
                                {refund.preferred_time || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Location:</span>{" "}
                                {[refund.location_address, refund.location_city, refund.location_state, refund.location_zip]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-neutral-800">Final Price:</span>{" "}
                                {refund.final_price ?? "—"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
