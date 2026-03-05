import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "../../../api/config";

export default function StripeReturn() {
    const [message, setMessage] = useState("Verifying Stripe account...");

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const session = await fetchAuthSession();
                const idToken = session?.tokens?.idToken?.toString();
                if (!idToken) throw new Error("Not authenticated");

                const res = await fetch(
                    `${API_BASE}/providers/stripe/connect/status`,
                    {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    }
                );

                const data = await res.json();

                if (data.status === "verified") {
                    setMessage("✅ Stripe account connected successfully!");
                } else {
                    setMessage("⚠️ Stripe setup incomplete. Please try again.");
                }
            } catch (err) {
                console.error("Stripe status check failed:", err);
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
