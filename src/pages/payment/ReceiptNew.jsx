import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { getReceipt, getAuthHeaders } from "../../api/payments";
import Card from "../../components/UI/Card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function ReceiptNew() {
    const { id: paymentId } = useParams();
    const auth = useAuth();
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const invoiceRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                if (auth.isLoading) return;

                const authHeaders = getAuthHeaders(auth.user);
                const r = await getReceipt(paymentId, authHeaders);
                setData(r.payment || r);
            } catch (e) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [paymentId, auth.isLoading, auth.user]);

    const downloadPDF = async () => {
        if (!invoiceRef.current) return;

        setDownloading(true);
        try {
            const element = invoiceRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`QuickFix-Invoice-${paymentId}.pdf`);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading invoice...</div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-4xl">
                    <Card className="border-red-200 bg-red-50 p-6">
                        <h2 className="text-xl font-bold text-red-700">Invoice Error</h2>
                        <p className="mt-2 text-red-600">{err}</p>
                    </Card>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-4xl">
                    <Card className="p-6">
                        <p className="text-neutral-600">No invoice found.</p>
                    </Card>
                </div>
            </div>
        );
    }

    const status = (data.status || "").toUpperCase();
    const isPaid = status === "PAID" || status === "COMPLETED" || status === "SUCCEEDED";
    const provider = (data.provider || "").toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-4xl">
                {/* Action Buttons */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <Link
                        to="/customer/dashboard"
                        className="text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                    <button
                        onClick={downloadPDF}
                        disabled={downloading}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {downloading ? "Generating PDF..." : "📥 Download Invoice"}
                    </button>
                </div>

                {/* Invoice Card */}
                <Card className="border-neutral-200 bg-white shadow-xl">
                    <div ref={invoiceRef} className="p-8">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b-2 border-neutral-200 pb-6 mb-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/quickfix-logo.png"
                                    alt="QuickFix Logo"
                                    className="h-10 w-auto"
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900">QuickFix</h1>
                                    <p className="text-sm text-neutral-600">Service Marketplace</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-bold text-neutral-900">INVOICE</h2>
                                <p className="mt-1 text-sm text-neutral-600">#{paymentId}</p>
                                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${isPaid
                                        ? "bg-green-100 text-green-800 border border-green-300"
                                        : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                    }`}>
                                    {isPaid ? "PAID" : status || "PENDING"}
                                </span>
                            </div>
                        </div>

                        {/* Billing Information */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Bill To</h3>
                                <p className="font-medium text-neutral-900">{auth.user?.profile?.name || "Customer"}</p>
                                <p className="text-sm text-neutral-600">{auth.user?.profile?.email || "—"}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Invoice Details</h3>
                                <div className="text-sm space-y-1">
                                    <p className="text-neutral-600">
                                        <span className="font-medium">Date:</span> {formatDate(data.created_at || data.createdAt)}
                                    </p>
                                    <p className="text-neutral-600">
                                        <span className="font-medium">Job ID:</span> {data.job_id ?? data.jobId ?? "—"}
                                    </p>
                                    <p className="text-neutral-600">
                                        <span className="font-medium">Payment Method:</span> {provider || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Itemized Charges */}
                        <div className="mb-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-neutral-300">
                                        <th className="pb-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Description</th>
                                        <th className="pb-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    <tr>
                                        <td className="py-4 text-neutral-900">Service Fee</td>
                                        <td className="py-4 text-right text-neutral-900">{money(data.amounts?.base_amount_cents ?? data.base_amount_cents)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 text-neutral-900">Tax (13%)</td>
                                        <td className="py-4 text-right text-neutral-900">{money(data.amounts?.tax_cents ?? data.tax_cents ?? data.tax_amount_cents)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 text-neutral-900">Application Fee</td>
                                        <td className="py-4 text-right text-neutral-900">{money(data.amounts?.app_fee_cents ?? data.app_fee_cents)}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-neutral-300">
                                        <td className="pt-4 text-lg font-bold text-neutral-900">Total</td>
                                        <td className="pt-4 text-right text-lg font-bold text-blue-600">
                                            {money(data.amounts?.final_amount_cents ?? data.final_amount_cents)} CAD
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Transaction Details */}
                        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Transaction Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-neutral-500">Payment ID</p>
                                    <p className="font-mono text-xs text-neutral-900 break-all">{data.payment_id ?? data.paymentId ?? paymentId}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-500">Transaction ID</p>
                                    <p className="font-mono text-xs text-neutral-900 break-all">
                                        {data.provider_payment_id || data.stripe_payment_intent_id || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-neutral-200 pt-6 text-center">
                            <p className="text-sm text-neutral-600 mb-1">Thank you for using QuickFix!</p>
                            <p className="text-xs text-neutral-500">
                                For support, contact us at support@quickfix.com
                            </p>
                            <p className="text-xs text-neutral-400 mt-2">
                                This is a computer-generated invoice and does not require a signature.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Additional Actions */}
                <div className="mt-6 flex justify-center gap-3">
                    <Link
                        to="/customer/jobs"
                        className="rounded-lg border border-neutral-300 px-6 py-2.5 font-semibold text-neutral-900 hover:border-neutral-400 transition-colors"
                    >
                        View My Jobs
                    </Link>
                </div>

                {!isPaid && (
                    <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                        ⏳ If your payment status is still pending, please refresh in a moment. The payment processor may still be confirming your transaction.
                    </div>
                )}
            </div>
        </div>
    );
}

function formatDate(d) {
    if (!d) return "—";
    try {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return String(d);
    }
}
