import React, { useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "react-oidc-context";
import { paypalCreateOrder, paypalCapture, getAuthHeaders } from "../../api/payments";

export default function PayPalCheckout({ jobId, onPaid }) {
    const auth = useAuth();
    const [err, setErr] = useState("");

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Pay with PayPal</h3>
            {err && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {err}
                </div>
            )}

            <PayPalButtons
                style={{ layout: "vertical" }}
                createOrder={async () => {
                    try {
                        setErr("");
                        const authHeaders = getAuthHeaders(auth.user);
                        const res = await paypalCreateOrder(jobId, authHeaders);
                        // Expected: { orderId, payment_id }
                        return res.orderId;
                    } catch (e) {
                        setErr(e.message);
                        throw e;
                    }
                }}
                onApprove={async (data) => {
                    try {
                        setErr("");
                        const authHeaders = getAuthHeaders(auth.user);
                        const res = await paypalCapture(data.orderID, authHeaders);
                        // Expected: { payment_id, status: "COMPLETED" } (or paid)
                        const paymentId = res.payment_id ?? res.paymentId;
                        onPaid(paymentId);
                    } catch (e) {
                        setErr(e.message);
                    }
                }}
                onError={(e) => setErr(e?.message || "PayPal error")}
            />
        </div>
    );
}
