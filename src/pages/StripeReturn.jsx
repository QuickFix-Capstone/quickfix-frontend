import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function StripeReturn() {
    const [params] = useSearchParams();
    const nav = useNavigate();
    const [msg, setMsg] = useState("Finalizing your payment...");

    useEffect(() => {
        const paymentId = params.get("paymentId");
        if (!paymentId) {
            setMsg("Missing payment id.");
            return;
        }
        // Give webhook a moment if needed:
        setTimeout(() => nav(`/receipt/${paymentId}`), 800);
    }, [params, nav]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
            <div className="rounded-xl bg-white p-8 shadow-lg">
                <div className="text-center text-neutral-700">{msg}</div>
            </div>
        </div>
    );
}
