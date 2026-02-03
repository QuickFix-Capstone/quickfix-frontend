import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    useStripe,
    useElements,
    PaymentElement,
} from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "react-oidc-context";
import Card from "../components/UI/Card";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ✅ Tax and fee constants
const TAX_RATE = 0.13;
const APP_FEE_CENTS = 1400; // $14

function CheckoutForm({ paymentId }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");

        if (!stripe || !elements) return;

        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/receipt/${paymentId}`,
            },
        });

        if (error) setMsg(error.message || "Payment failed.");
        setLoading(false);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <PaymentElement />
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <button
                disabled={!stripe || loading}
                className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
}

// PayPal component
function PayPalCheckout({ paymentId, totalCents }) {
    const navigate = useNavigate();

    return (
        <PayPalButtons
            style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
            createOrder={(data, actions) => {
                return actions.order.create({
                    purchase_units: [
                        {
                            amount: {
                                value: (totalCents / 100).toFixed(2),
                                currency_code: "CAD",
                            },
                            description: `QuickFix Payment #${paymentId}`,
                        },
                    ],
                    application_context: {
                        shipping_preference: "NO_SHIPPING",
                    },
                });
            }}
            onApprove={async (data, actions) => {
                try {
                    const details = await actions.order.capture();
                    console.log("PayPal payment successful:", details);
                    // Redirect to receipt page
                    navigate(`/receipt/${paymentId}`);
                } catch (error) {
                    console.error("PayPal capture error:", error);
                }
            }}
            onError={(err) => {
                console.error("PayPal error:", err);
            }}
        />
    );
}

export default function Payment() {
    const navigate = useNavigate();
    const auth = useAuth();

    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    const [clientSecret, setClientSecret] = useState("");
    const [paymentId, setPaymentId] = useState(null);
    const [error, setError] = useState("");

    // Store breakdown for display
    const [subtotalCents, setSubtotalCents] = useState(0);
    const [taxCents, setTaxCents] = useState(0);
    const [totalCents, setTotalCents] = useState(0);

    // ✅ Prevent duplicate PaymentIntent creation in React 18 StrictMode
    const createdRef = useRef(false);

    // ✅ Extract token to reduce dependency changes
    const token = auth.user?.access_token || auth.user?.id_token;

    // Stripe Elements options should be stable object
    const elementsOptions = useMemo(() => {
        if (!clientSecret) return null;
        return {
            clientSecret,
            appearance: { theme: "stripe" },
        };
    }, [clientSecret]);

    // PayPal options
    const paypalOptions = {
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "CAD",
        intent: "capture",
    };

    useEffect(() => {
        const run = async () => {
            try {
                setError("");

                if (auth.isLoading) return;

                if (!auth.isAuthenticated || !token) {
                    navigate("/login");
                    return;
                }

                // ✅ Correct flow: Read local storage first
                const serviceOfferingId = localStorage.getItem("selected_service_offering_id");
                const amountCents = Number(localStorage.getItem("quote_amount_cents"));

                if (!serviceOfferingId) throw new Error("Missing serviceOfferingId. Please create a booking first.");
                if (!amountCents) throw new Error("Missing amount. Please create a booking first.");

                // ✅ Prevent duplicate create-intent calls
                if (createdRef.current) return;
                createdRef.current = true;

                // ✅ Calculate total with tax and fee
                const subtotalCents = amountCents; // service price in cents
                const taxCents = Math.round(subtotalCents * TAX_RATE);
                const totalCents = subtotalCents + taxCents + APP_FEE_CENTS;

                // Store breakdown for display
                setSubtotalCents(subtotalCents);
                setTaxCents(taxCents);
                setTotalCents(totalCents);

                // ✅ Store breakdown in localStorage for Receipt page
                localStorage.setItem("receipt_subtotal_cents", String(subtotalCents));
                localStorage.setItem("receipt_tax_cents", String(taxCents));
                localStorage.setItem("receipt_fee_cents", String(APP_FEE_CENTS));
                localStorage.setItem("receipt_total_cents", String(totalCents));

                // Create PaymentIntent directly
                const payload = {
                    serviceOfferingId,
                    amountCents: totalCents,   // ✅ charge total to Stripe
                    currency: "cad",
                    bookingId: localStorage.getItem("booking_id") || ""
                };

                const piRes = await fetch(`${API_BASE}/payment/create-intent`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                const piData = await piRes.json().catch(() => ({}));
                if (!piRes.ok) throw new Error(piData?.message || piData?.error || "Failed to create payment.");

                if (!piData.clientSecret) throw new Error("Missing clientSecret from server.");

                setClientSecret(piData.clientSecret);
                setPaymentId(piData.paymentId); // ✅ real payment.id from DB
            } catch (e) {
                setError(e?.message || "Payment setup failed.");
            }
        };

        run();
    }, [API_BASE, auth.isLoading, auth.isAuthenticated, token, navigate]);

    if (error) {
        return (
            <div className="mx-auto max-w-xl p-6">
                <Card className="p-6">
                    <h2 className="text-xl font-bold text-red-600">Payment Error</h2>
                    <p className="mt-2 text-neutral-600">{error}</p>
                </Card>
            </div>
        );
    }

    if (!clientSecret || !elementsOptions) {
        return <div className="p-6 text-center text-neutral-600">Preparing secure checkout…</div>;
    }

    return (
        <div className="mx-auto max-w-xl p-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold text-blue-700">Secure Payment</h2>

                <div className="mt-3 text-sm text-neutral-700 space-y-1">
                    <p>
                        <b>Payment ID:</b> {paymentId}
                    </p>

                    {/* ✅ Display price breakdown */}
                    {subtotalCents > 0 && (
                        <>
                            <p className="mt-3"><b>Subtotal:</b> ${(subtotalCents / 100).toFixed(2)} CAD</p>
                            <p><b>Tax (13%):</b> ${(taxCents / 100).toFixed(2)} CAD</p>
                            <p><b>Application fee:</b> $14.00 CAD</p>
                            <p className="font-bold text-base mt-2"><b>Total:</b> ${(totalCents / 100).toFixed(2)} CAD</p>
                        </>
                    )}
                </div>

                <p className="text-sm text-neutral-600 mt-4">
                    Pay safely with card / Apple Pay / Google Pay.
                </p>

                {/* Stripe Payment */}
                <div className="mt-6">
                    <Elements options={elementsOptions} stripe={stripePromise}>
                        <CheckoutForm paymentId={paymentId} />
                    </Elements>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-neutral-500">OR</span>
                    </div>
                </div>

                {/* PayPal Payment */}
                <div>
                    <p className="text-sm text-neutral-600 mb-3">Pay with PayPal:</p>
                    <PayPalScriptProvider options={paypalOptions}>
                        <PayPalCheckout paymentId={paymentId} totalCents={totalCents} />
                    </PayPalScriptProvider>
                </div>
            </Card>
        </div>
    );
}
