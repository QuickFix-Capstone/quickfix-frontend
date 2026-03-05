import { useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "../../../api/config";

export default function StripeRefresh() {
    const [loading, setLoading] = useState(false);

    const startStripeConnect = async () => {
        try {
            setLoading(true);
            const session = await fetchAuthSession();
            const idToken = session?.tokens?.idToken?.toString();

            const res = await fetch(
                `${API_BASE}/providers/stripe/connect/start`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            const data = await res.json();
            const url = data?.onboarding_url || data?.url;
            if (!url) throw new Error("No onboarding URL received.");
            window.location.href = url;
        } catch (err) {
            alert("Error restarting Stripe setup: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="p-8 bg-white rounded shadow text-center">
                <h2 className="text-xl font-semibold mb-4">
                    Stripe Setup Incomplete
                </h2>
                <button
                    onClick={startStripeConnect}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {loading ? "Redirecting..." : "Restart Stripe Setup"}
                </button>
            </div>
        </div>
    );
}
