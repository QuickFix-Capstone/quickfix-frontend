import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import Card from "../components/UI/Card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Receipt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    const [payment, setPayment] = useState(null);
    const [error, setError] = useState("");

    const token = auth.user?.id_token || auth.user?.access_token;

    // ✅ constants (matching Payment.jsx)
    const TAX_RATE = 0.13;
    const APP_FEE = 14.0;

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                setError("");

                if (auth.isLoading) return;

                if (!auth.isAuthenticated || !token) {
                    navigate("/login");
                    return;
                }

                const res = await fetch(`${API_BASE}/payment/${id}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json().catch(() => ({}));
                console.log("Receipt fetch status:", res.status, "Data:", data);

                if (!res.ok) throw new Error(data?.message || data?.error || "Failed to load receipt.");

                const paymentInfo = data.payment || data;
                setPayment(paymentInfo);

                // poll while pending (webhook may update after redirect)
                const status = (paymentInfo?.status || "").toLowerCase();
                const isFinal = status === "paid" || status === "succeeded" || status === "complete";

                if (!isFinal) timer = setTimeout(load, 2000);
            } catch (e) {
                setError(e?.message || "Error loading receipt.");
            }
        };

        load();
        return () => timer && clearTimeout(timer);
    }, [API_BASE, id, auth.isLoading, auth.isAuthenticated, token, navigate]);

    // ✅ Use breakdown from localStorage (set during payment)
    // This ensures receipt shows EXACT same values that were charged
    const amounts = useMemo(() => {
        // Try to get stored breakdown first
        const storedSubtotal = Number(localStorage.getItem("receipt_subtotal_cents") || 0);
        const storedTax = Number(localStorage.getItem("receipt_tax_cents") || 0);
        const storedFee = Number(localStorage.getItem("receipt_fee_cents") || 0);
        const storedTotal = Number(localStorage.getItem("receipt_total_cents") || 0);

        // If we have stored values, use them
        if (storedTotal > 0) {
            return {
                subtotal: storedSubtotal / 100,
                tax: storedTax / 100,
                fee: storedFee / 100,
                total: storedTotal / 100,
            };
        }

        // Fallback: if no stored values, use backend total
        // (This shouldn't happen in normal flow, but good to have)
        const cents = typeof payment?.amount_cents === "number" ? payment.amount_cents : null;
        if (cents == null) return null;

        const total = cents / 100;
        const subtotal = total / (1 + TAX_RATE + (APP_FEE / 100));
        const tax = +(subtotal * TAX_RATE).toFixed(2);
        const fee = APP_FEE;

        return { subtotal: +(total - tax - fee).toFixed(2), tax, fee, total };
    }, [payment]);

    const downloadPdf = () => {
        // Simple print approach - more reliable than html2canvas
        window.print();
    };

    const currency = (payment?.currency || "cad").toUpperCase();
    const status = (payment?.status || "unknown").toLowerCase();
    const isPaid = status === "paid";

    return (
        <div className="mx-auto max-w-2xl p-6">
            <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-blue-700">Payment Receipt</h2>
                        <p className="text-sm text-neutral-500">QuickFix Capstone • Transaction summary</p>
                    </div>

                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                            }`}
                    >
                        {payment?.status ?? "unknown"}
                    </span>
                </div>

                {error && <p className="mt-4 text-red-600">{error}</p>}

                {!payment && !error ? (
                    <p className="mt-4 text-neutral-600">Loading receipt...</p>
                ) : payment ? (
                    <>
                        {/* ✅ This block becomes the PDF */}
                        <div id="receipt-print" className="mt-6 rounded-2xl border bg-white p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-bold text-neutral-900">QuickFix</p>
                                    <p className="text-sm text-neutral-600">Capstone Project</p>
                                    <p className="text-sm text-neutral-600">support@quickfix.example</p>
                                </div>

                                <div className="text-right text-sm">
                                    <p className="text-neutral-500">Receipt #</p>
                                    <p className="font-bold text-neutral-900">{payment.id ?? id}</p>
                                    {payment.created_at && (
                                        <>
                                            <p className="mt-2 text-neutral-500">Date</p>
                                            <p className="text-neutral-900">{payment.created_at}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 border-t pt-4 text-sm">
                                <div className="flex justify-between py-2">
                                    <span className="text-neutral-700">Customer</span>
                                    <span className="font-medium text-neutral-900">{auth.user?.profile?.email || "—"}</span>
                                </div>

                                <div className="flex justify-between py-2">
                                    <span className="text-neutral-700">Payment Status</span>
                                    <span className="font-medium text-neutral-900">{payment.status ?? "unknown"}</span>
                                </div>

                                {payment.stripe_payment_intent_id && (
                                    <div className="flex justify-between py-2">
                                        <span className="text-neutral-700">Stripe PaymentIntent</span>
                                        <span className="font-mono text-xs text-neutral-900">
                                            {payment.stripe_payment_intent_id}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 border-t pt-4">
                                <p className="font-semibold text-neutral-900 mb-3">Charges</p>

                                {amounts ? (
                                    <div className="text-sm">
                                        <div className="flex justify-between py-2">
                                            <span className="text-neutral-700">Service subtotal</span>
                                            <span className="text-neutral-900">
                                                ${amounts.subtotal.toFixed(2)} {currency}
                                            </span>
                                        </div>

                                        <div className="flex justify-between py-2">
                                            <span className="text-neutral-700">Tax (13%)</span>
                                            <span className="text-neutral-900">
                                                ${amounts.tax.toFixed(2)} {currency}
                                            </span>
                                        </div>

                                        <div className="flex justify-between py-2">
                                            <span className="text-neutral-700">Application fee</span>
                                            <span className="text-neutral-900">
                                                ${amounts.fee.toFixed(2)} {currency}
                                            </span>
                                        </div>

                                        <div className="flex justify-between py-3 mt-2 border-t font-bold">
                                            <span className="text-neutral-900">Total</span>
                                            <span className="text-neutral-900">
                                                ${amounts.total.toFixed(2)} {currency}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-600">Amount not available.</p>
                                )}
                            </div>

                            <div className="mt-8 text-xs text-neutral-500">
                                <p>Thank you for using QuickFix.</p>
                                <p>This receipt is generated automatically for your records.</p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                onClick={downloadPdf}
                                className="px-4 py-2 rounded-xl border font-semibold hover:bg-neutral-50"
                            >
                                Download PDF
                            </button>

                            <Link to="/" className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                                Back Home
                            </Link>

                            <Link to="/profile" className="px-4 py-2 rounded-xl border">
                                Profile
                            </Link>
                        </div>
                    </>
                ) : null}
            </Card>
        </div>
    );
}
