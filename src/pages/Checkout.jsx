import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { getQuote, stripeCreateIntent, getAuthHeaders } from "../api/payments";
import PayPalCheckout from "../components/payments/PayPalCheckout";
import StripeCheckoutForm from "../components/payments/StripeCheckoutForm";
import Card from "../components/UI/Card";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function Checkout() {
    const { jobId } = useParams();
    const nav = useNavigate();
    const auth = useAuth();

    const [method, setMethod] = useState("paypal");
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [clientSecret, setClientSecret] = useState(null);
    const [stripePaymentId, setStripePaymentId] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                // Wait for auth to load
                if (auth.isLoading) return;

                // Require authentication
                if (!auth.isAuthenticated) {
                    nav("/login");
                    return;
                }

                const authHeaders = getAuthHeaders(auth.user);
                const q = await getQuote(jobId, authHeaders);
                setQuote(q);
            } catch (e) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [jobId, auth.isLoading, auth.isAuthenticated, auth.user, nav]);

    const paypalOptions = useMemo(
        () => ({
            clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
            currency: "CAD",
            intent: "capture",
        }),
        []
    );

    const startStripe = async () => {
        try {
            setErr("");
            const authHeaders = getAuthHeaders(auth.user);
            const res = await stripeCreateIntent(jobId, authHeaders);
            // Expected: { clientSecret, payment_id } (or paymentId)
            setClientSecret(res.clientSecret);
            setStripePaymentId(res.payment_id ?? res.paymentId);
        } catch (e) {
            setErr(e.message);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading checkout...</div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-2xl">
                    <Card className="border-red-200 bg-red-50 p-6">
                        <h2 className="text-xl font-bold text-red-700">Checkout Error</h2>
                        <p className="mt-2 text-red-600">{err}</p>
                    </Card>
                </div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-2xl">
                    <Card className="p-6">
                        <p className="text-neutral-600">No quote found.</p>
                    </Card>
                </div>
            </div>
        );
    }

    const paymentId = quote.payment_id ?? quote.paymentId;

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-6xl">
                <h2 className="mb-6 text-3xl font-bold text-neutral-900">Checkout</h2>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Summary */}
                    <Card className="border-neutral-200 bg-white p-6 shadow-lg">
                        <h3 className="text-xl font-semibold text-neutral-900">Order Summary</h3>

                        <div className="mt-4 space-y-3">
                            <Row label="Base price" value={money(quote.amounts?.base_amount_cents)} />
                            <Row label="Tax" value={money(quote.amounts?.tax_cents)} />
                            <Row label="Application fee" value={money(quote.amounts?.app_fee_cents)} />
                            <div className="border-t border-neutral-200 pt-3">
                                <Row
                                    label={<span className="font-bold">Grand total</span>}
                                    value={<span className="font-bold text-lg">{money(quote.amounts?.final_amount_cents)}</span>}
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="mb-3 font-semibold text-neutral-900">Choose payment method</div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMethod("paypal")}
                                    className={btnStyle(method === "paypal")}
                                >
                                    PayPal
                                </button>
                                <button
                                    onClick={() => setMethod("stripe")}
                                    className={btnStyle(method === "stripe")}
                                >
                                    Card (Stripe)
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
                            <p>
                                <span className="font-semibold">Job ID:</span> {jobId}
                            </p>
                            <p>
                                <span className="font-semibold">Payment ID:</span> {paymentId}
                            </p>
                        </div>
                    </Card>

                    {/* Payment */}
                    <Card className="border-neutral-200 bg-white p-6 shadow-lg">
                        {method === "paypal" && (
                            <PayPalScriptProvider options={paypalOptions}>
                                <PayPalCheckout jobId={jobId} onPaid={(pid) => nav(`/receipt-new/${pid}`)} />
                            </PayPalScriptProvider>
                        )}

                        {method === "stripe" && (
                            <div>
                                {!clientSecret ? (
                                    <div>
                                        <h3 className="text-xl font-semibold mb-3">Pay with card</h3>
                                        <p className="mb-4 text-neutral-600">
                                            Click continue to open Stripe card form.
                                        </p>
                                        <button
                                            onClick={startStripe}
                                            className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white hover:bg-neutral-800 transition-colors"
                                        >
                                            Continue with Stripe
                                        </button>
                                    </div>
                                ) : (
                                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                                        <StripeCheckoutForm
                                            paymentId={stripePaymentId}
                                            onSuccess={(pid) => nav(`/receipt-new/${pid}`)}
                                        />
                                    </Elements>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
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

function btnStyle(active) {
    return `flex-1 rounded-xl px-4 py-3 font-semibold transition-all ${active
        ? "border-2 border-neutral-900 bg-neutral-900 text-white"
        : "border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400"
        }`;
}
