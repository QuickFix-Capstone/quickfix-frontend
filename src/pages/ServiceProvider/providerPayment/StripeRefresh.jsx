import { useState } from "react";

export default function StripeRefresh() {
    const [loading, setLoading] = useState(false);

    const startStripeConnect = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/providers/stripe/connect/start`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();
            window.location.href = data.url;
        } catch (err) {
            alert("Error restarting Stripe setup.");
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
