import React, { useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "react-oidc-context";
import { paypalCreateOrder, paypalCapture, getAuthHeaders } from "../../api/payments";

export default function PayPalCheckout({ jobId, onPaid }) {
    const auth = useAuth();
    const [err, setErr] = useState("");
    const [paymentId, setPaymentId] = useState(null); // Store payment_id from createOrder

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
                        console.log("✅ PayPal createOrder response:", res);

                        // Lambda returns order_id (snake_case), not orderId (camelCase)
                        const orderId = res.order_id || res.orderId;
                        const pId = res.payment_id || res.paymentId;
                        console.log("📦 Extracted orderId:", orderId, "payment_id:", pId);

                        if (!orderId) {
                            throw new Error("No order_id in response: " + JSON.stringify(res));
                        }

                        // Store payment_id for later use in capture
                        setPaymentId(pId);

                        return orderId;
                    } catch (e) {
                        console.error("❌ PayPal createOrder error:", e);
                        setErr(e.message);
                        throw e;
                    }
                }}
                onApprove={async (data) => {
                    try {
                        setErr("");
                        console.log("🎯 PayPal onApprove data:", data);
                        console.log("💾 Stored payment_id:", paymentId);

                        if (!paymentId) {
                            throw new Error("payment_id not found - createOrder may have failed");
                        }

                        const authHeaders = getAuthHeaders(auth.user);
                        console.log("📤 Calling paypalCapture with payment_id:", paymentId, "order_id:", data.orderID);

                        const res = await paypalCapture(paymentId, data.orderID, authHeaders);
                        console.log("✅ PayPal capture response:", res);

                        // Expected: { payment_id, status: "COMPLETED" } (or paid)
                        const finalPaymentId = res.payment_id ?? res.paymentId;
                        onPaid(finalPaymentId);
                    } catch (e) {
                        console.error("❌ PayPal capture error:", e);
                        setErr(e.message);
                    }
                }}
                onError={(e) => setErr(e?.message || "PayPal error")}
            />
        </div>
    );
}
