import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import Card from "../components/UI/Card";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ orderId }) {
    const navigate = useNavigate();
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
                // after success show receipt
                return_url: `${window.location.origin}/receipt/${orderId}`,
            },
        });

        if (error) setMsg(error.message);
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
    const [clientSecret, setClientSecret] = useState("");
    const [orderId, setOrderId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const run = async () => {
            try {
                // Example: you will pass these from quote page
                const customer = JSON.parse(localStorage.getItem("quickfix_currentUser"));
                const providerId = Number(localStorage.getItem("selected_provider_id") || 2);
                const amountCents = Number(localStorage.getItem("quote_amount_cents") || 2500);

                const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-intent`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customerId: customer?.id,
                        providerId,
                        amountCents,
                        currency: "cad",
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to create payment.");

                setClientSecret(data.clientSecret);
                setOrderId(data.orderId);
            } catch (e) {
                setError(e.message);
            }
        };

        run();
    }, []);

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

    if (!clientSecret) {
        return <div className="p-6 text-center text-neutral-600">Preparing secure checkout…</div>;
    }

    return (
        <div className="mx-auto max-w-xl p-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold text-blue-700">Secure Payment</h2>
                <p className="text-sm text-neutral-600 mt-1">Pay safely with card / Apple Pay / Google Pay.</p>

                <div className="mt-6">
                    <Elements options={{ clientSecret }} stripe={stripePromise}>
                        <CheckoutForm orderId={orderId} />
                    </Elements>
                </div>
            </Card>
        </div>
    );
}
