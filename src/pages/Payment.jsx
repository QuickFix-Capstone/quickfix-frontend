import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    useStripe,
    useElements,
    PaymentElement,
} from "@stripe/react-stripe-js";
import { useAuth } from "react-oidc-context";
import Card from "../components/UI/Card";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ orderId }) {
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
                return_url: `${window.location.origin}/receipt/${orderId}`,
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

export default function Payment() {
    const navigate = useNavigate();
    const auth = useAuth();

    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    const [clientSecret, setClientSecret] = useState("");
    const [orderId, setOrderId] = useState(null);
    const [error, setError] = useState("");

    // optional: show order details on the page
    const [order, setOrder] = useState(null);

    // Stripe Elements options should be stable object
    const elementsOptions = useMemo(() => {
        if (!clientSecret) return null;
        return {
            clientSecret,
            appearance: { theme: "stripe" },
        };
    }, [clientSecret]);

    useEffect(() => {
        const run = async () => {
            try {
                setError("");

                if (auth.isLoading) return;
                // ✅ Fix: always prefer access token
                const token = auth.user?.access_token || auth.user?.id_token;

                if (!auth.isAuthenticated || !token) {
                    navigate("/login");
                    return;
                }

                // ✅ Correct flow: Read local storage first
                const serviceOfferingId = localStorage.getItem("selected_service_offering_id");
                const amountCents = Number(localStorage.getItem("quote_amount_cents"));

                if (!serviceOfferingId) throw new Error("Missing serviceOfferingId. Please create a booking first.");
                if (!amountCents) throw new Error("Missing amount. Please create a booking first.");

                // Create PaymentIntent directly
                const payload = {
                    serviceOfferingId,
                    amountCents,
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
                setOrderId(piData.orderId); // ✅ real orders.id from DB
            } catch (e) {
                setError(e?.message || "Payment setup failed.");
            }
        };

        run();
    }, [API_BASE, auth.isLoading, auth.isAuthenticated, auth.user, navigate]);

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
                        <b>Order ID:</b> {orderId}
                    </p>

                    {/* Optional: display total from backend if available */}
                    {order?.total && (
                        <p>
                            <b>Total:</b> ${Number(order.total).toFixed(2)} CAD
                        </p>
                    )}
                </div>

                <p className="text-sm text-neutral-600 mt-4">
                    Pay safely with card / Apple Pay / Google Pay.
                </p>

                <div className="mt-6">
                    <Elements options={elementsOptions} stripe={stripePromise}>
                        <CheckoutForm orderId={orderId} />
                    </Elements>
                </div>
            </Card>
        </div>
    );
}
