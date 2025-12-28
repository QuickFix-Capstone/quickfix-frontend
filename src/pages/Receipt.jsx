import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Card from "../components/UI/Card";

export default function Receipt() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`)
            .then((r) => r.json())
            .then(setOrder);
    }, [id]);

    return (
        <div className="mx-auto max-w-xl p-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold text-blue-700">Payment Receipt</h2>

                {!order ? (
                    <p className="mt-4 text-neutral-600">Loading receipt...</p>
                ) : (
                    <div className="mt-4 space-y-2 text-neutral-700">
                        <p><b>Order:</b> #{order.id}</p>
                        <p><b>Status:</b> {order.status}</p>
                        <p><b>Amount:</b> ${(order.amount_cents / 100).toFixed(2)} {order.currency.toUpperCase()}</p>
                        <p><b>Date:</b> {order.created_at}</p>
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <Link to="/" className="px-4 py-2 rounded-xl bg-blue-600 text-white">Back Home</Link>
                    <Link to="/profile" className="px-4 py-2 rounded-xl border">Profile</Link>
                </div>
            </Card>
        </div>
    );
}
