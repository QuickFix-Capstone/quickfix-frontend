import React, { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export default function StripeCheckoutForm({ paymentId, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setMsg("");

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // after payment, Stripe may redirect here
                return_url: `${window.location.origin}/stripe-return?paymentId=${paymentId}`,
            },
            redirect: "if_required",
        });

        if (error) {
            setMsg(error.message || "Payment failed");
            setLoading(false);
            return;
        }

        // If it succeeds without redirect:
        if (paymentIntent?.status === "succeeded") {
            onSuccess(paymentId);
            return;
        }

        setMsg("Payment processing…");
        setLoading(false);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <h3 className="text-xl font-semibold">Pay with Card</h3>
            <PaymentElement />
            {msg && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                    {msg}
                </div>
            )}
            <button
                disabled={!stripe || loading}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="submit"
            >
                {loading ? "Processing..." : "Pay now"}
            </button>
        </form>
    );
}
