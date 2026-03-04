import { useMemo, useState } from "react";
import Card from "../UI/Card";
import { createRefundRequest, refundPresignUploads } from "../../api/payments";

const REASONS = [
    { code: "SERVICE_NOT_AS_DESCRIBED", label: "Service not as described" },
    { code: "SERVICE_NOT_COMPLETED", label: "Service not completed" },
    { code: "OVERCHARGED", label: "Overcharged" },
    { code: "OTHER", label: "Other" },
];

const PLACEHOLDER = `What happened:
- [Briefly describe the issue]

When it happened:
- [Date/time or timeline]

What was expected:
- [Expected service/result]

What was received:
- [What actually happened]

Evidence:
- [What the screenshots show]

Requested resolution:
- [Full refund / partial refund / redo service]`;

export default function RefundRequestModal({ isOpen, onClose, payment, authUser, onSuccess }) {
    const [reasonCode, setReasonCode] = useState(REASONS[0].code);
    const [reasonText, setReasonText] = useState("");
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);

    const authHeaders = useMemo(() => {
        const token = authUser?.access_token || authUser?.id_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [authUser]);

    if (!isOpen || !payment) return null;

    const onPickFiles = (e) => {
        const picked = Array.from(e.target.files || []);
        setFiles((prev) => [...prev, ...picked].slice(0, 5));
    };

    const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name));

    const uploadToS3 = async (uploads, fileList) => {
        for (let i = 0; i < uploads.length; i++) {
            const { upload_url } = uploads[i];
            const file = fileList[i];
            const putRes = await fetch(upload_url, {
                method: "PUT",
                headers: { "Content-Type": file.type || "application/octet-stream" },
                body: file,
            });
            if (!putRes.ok) {
                const t = await putRes.text().catch(() => "");
                throw new Error(t || `S3 upload failed (HTTP ${putRes.status})`);
            }
        }
    };

    const handleClose = () => {
        setReasonCode(REASONS[0].code);
        setReasonText("");
        setFiles([]);
        setSuccessData(null);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!authHeaders.Authorization) {
            alert("You are not logged in.");
            return;
        }
        setSubmitting(true);
        try {
            let attachmentKeys = [];
            if (files.length > 0) {
                const presignRes = await refundPresignUploads(
                    payment.payment_id,
                    payment.job_id,
                    files,
                    authHeaders
                );
                const uploads = presignRes?.uploads || [];
                if (uploads.length !== files.length) throw new Error("Presign failed: uploads count mismatch");
                await uploadToS3(uploads, files);
                attachmentKeys = uploads.map((u) => u.s3_key);
            }

            const result = await createRefundRequest(
                {
                    payment_id: payment.payment_id,
                    job_id: payment.job_id,
                    reason_code: reasonCode,
                    reason_text: reasonText.trim(),
                    attachments: attachmentKeys,
                },
                authHeaders
            );

            setSuccessData({ id: result.refund_request_id, status: result.status || "PENDING" });
            onSuccess?.(result);
        } catch (err) {
            console.error(err);
            alert(err?.message || "Refund request failed.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ──────────────────────────────────────────────────────────
    if (successData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <Card className="w-full max-w-lg rounded-2xl p-0 shadow-2xl">
                    <div className="px-6 py-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-neutral-900">Refund request submitted</h2>
                        <p className="mt-1 text-sm text-neutral-600">
                            Your request has been sent to our admin team for review.
                        </p>

                        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-600">Refund Request ID</span>
                                <span className="font-semibold text-neutral-900">#{successData.id}</span>
                            </div>
                            <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2">
                                <span className="text-neutral-600">Status</span>
                                <span className="font-semibold text-yellow-700">{successData.status}</span>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                            <p className="font-medium">What happens next?</p>
                            <ul className="mt-1 list-disc pl-5 space-y-1">
                                <li>Admin reviews your details and attachments.</li>
                                <li>You'll receive an email update when it's approved or rejected.</li>
                                <li>If approved, the refund is processed to your original payment method.</li>
                            </ul>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleClose}
                                className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // ── Main form ───────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-2xl rounded-2xl p-0 shadow-2xl">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                                Request a refund
                            </h2>
                            <p className="mt-1 text-sm text-neutral-600">
                                Please provide clear details so our admin team can review quickly.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">
                                    Payment #{payment.payment_id}
                                </span>
                                <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">
                                    Job #{payment.job_id}
                                </span>
                                {payment.status && (
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                                        Status: {String(payment.status).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Form body */}
                    <div className="space-y-5 px-6 py-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Reason */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-neutral-800">Reason</label>
                                <select
                                    value={reasonCode}
                                    onChange={(e) => setReasonCode(e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                                >
                                    {REASONS.map((r) => (
                                        <option key={r.code} value={r.code}>{r.label}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-neutral-500">
                                    Choose the closest reason for faster review.
                                </p>
                            </div>

                            {/* File upload */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-neutral-800">
                                    Evidence{" "}
                                    <span className="font-normal text-neutral-500">(optional)</span>
                                </label>
                                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm hover:bg-neutral-100">
                                    <span className="text-neutral-700">Upload screenshots (max 5)</span>
                                    <span className="rounded-lg border bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                                        Choose files
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        multiple
                                        onChange={onPickFiles}
                                        className="hidden"
                                    />
                                </label>
                                {files.length > 0 && (
                                    <div className="mt-2 rounded-xl border border-neutral-200 bg-white p-3">
                                        <p className="mb-2 text-xs font-medium text-neutral-700">
                                            Selected ({files.length})
                                        </p>
                                        <ul className="space-y-1 text-sm text-neutral-700">
                                            {files.map((f) => (
                                                <li key={f.name} className="flex items-center justify-between">
                                                    <span className="max-w-[160px] truncate">{f.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(f.name)}
                                                        className="text-xs text-red-600 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Explanation */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-800">
                                Explain what happened
                            </label>
                            <textarea
                                value={reasonText}
                                onChange={(e) => setReasonText(e.target.value)}
                                placeholder={PLACEHOLDER}
                                rows={8}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                            />
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className={reasonText.trim().length < 30 ? "text-red-600" : "text-green-600"}>
                                    {reasonText.trim().length < 30
                                        ? `${reasonText.trim().length} / 30 characters minimum`
                                        : "✓ Looks good"}
                                </span>
                                <span className="text-neutral-500">Be specific. Attach screenshots if possible.</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                        <p className="text-xs text-neutral-500">
                            Once submitted, an admin will review your request.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={submitting}
                                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || reasonText.trim().length < 30}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {submitting ? "Submitting..." : "Submit request"}
                            </button>
                        </div>
                    </div>
                </form>
            </Card>
        </div>
    );
}
