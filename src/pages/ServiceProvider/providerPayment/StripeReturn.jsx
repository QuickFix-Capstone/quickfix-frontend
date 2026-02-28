import { useEffect, useState } from "react";

export default function StripeReturn() {
    const [message, setMessage] = useState("Verifying Stripe account...");

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/providers/stripe/connect/status`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();

                if (data.verified) {
                    setMessage("✅ Stripe account connected successfully!");
                } else {
                    setMessage("⚠️ Stripe setup incomplete. Please try again.");
                }
            } catch (err) {
                setMessage("❌ Error verifying Stripe connection.");
            }
        };

        checkStatus();
    }, []);

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="p-8 bg-white rounded shadow text-center">
                <h2 className="text-xl font-semibold mb-4">Stripe Setup</h2>
                <p>{message}</p>
            </div>
        </div>
    );
}
