import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import Card from "../components/UI/Card";

export default function Receipt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();

    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");

    // Use id_token if available, matching Payment.jsx/BookingForm.jsx
    const token = auth.user?.id_token || auth.user?.access_token;

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                setError("");

                // Wait for auth to load
                if (auth.isLoading) return;

                // Require login (because GET /orders/:id is JWT protected)
                if (!auth.isAuthenticated || !token) {
                    navigate("/login");
                    return;
                }

                const res = await fetch(`${API_BASE}/orders/${id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json().catch(() => ({}));
                console.log("Receipt fetch status:", res.status, "Data:", data);

                if (!res.ok) {
                    throw new Error(data?.message || data?.error || "Failed to load receipt.");
                }

                // Handle wrapped response (e.g. { order: {...} }) from API Gateway/Lambda
                const orderInfo = data.order || data;
                setOrder(orderInfo);

                // Optional: poll a few times because webhook may update status after redirect
                const status = (orderInfo?.status || "").toLowerCase();
                const isFinal =
                    status.includes("paid") ||
                    status.includes("succeeded") ||
                    status.includes("complete");

                if (!isFinal) {
                    timer = setTimeout(load, 3000); // poll every 3s until final
                }
            } catch (e) {
                setError(e?.message || "Error loading receipt.");
            }
        };

        load();

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [API_BASE, id, auth.isLoading, auth.isAuthenticated, token, navigate]);

    return (
        <div className="mx-auto max-w-xl p-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold text-blue-700">Payment Receipt</h2>

                {error && <p className="mt-4 text-red-600">{error}</p>}

                {!order && !error ? (
                    <p className="mt-4 text-neutral-600">Loading receipt...</p>
                ) : order ? (
                    <div className="mt-4 space-y-2 text-neutral-700">
                        <p>
                            <b>Order:</b> #{order.id ?? id}
                        </p>
                        <p>
                            <b>Status:</b> {order.status ?? "unknown"}
                        </p>

                        {/* Handle either cents format OR decimal total */}
                        {typeof order.amount_cents === "number" ? (
                            <p>
                                <b>Amount:</b> ${(order.amount_cents / 100).toFixed(2)}{" "}
                                {(order.currency || "cad").toUpperCase()}
                            </p>
                        ) : order.total ? (
                            <p>
                                <b>Amount:</b> ${Number(order.total).toFixed(2)} CAD
                            </p>
                        ) : null}

                        {order.created_at && (
                            <p>
                                <b>Date:</b> {order.created_at}
                            </p>
                        )}
                    </div>
                ) : null}

                <div className="mt-6 flex gap-3">
                    <Link
                        to="/"
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white"
                    >
                        Back Home
                    </Link>
                    <Link to="/profile" className="px-4 py-2 rounded-xl border">
                        Profile
                    </Link>
                </div>
            </Card>
        </div>
    );
}
