import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { getPaymentHistory, getAuthHeaders } from "../../api/payments";
import Card from "../../components/UI/Card";
import { Receipt, Calendar, MapPin, CreditCard, DollarSign, TrendingUp, CheckCircle } from "lucide-react";

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const StatusBadge = ({ status }) => {
    const styles = {
        paid: "bg-green-100 text-green-800 border-green-200",
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        failed: "bg-red-100 text-red-800 border-red-200",
        refunded: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const style = styles[status?.toLowerCase()] || styles.pending;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${style}`}>
            {status === "paid" && <CheckCircle className="h-3 w-3" />}
            {status?.toUpperCase() || "UNKNOWN"}
        </span>
    );
};

const PaymentMethodBadge = ({ method }) => {
    const isStripe = method?.toLowerCase()?.includes("stripe") || method?.toLowerCase()?.includes("card");
    const isPayPal = method?.toLowerCase()?.includes("paypal");

    if (isStripe) {
        return (
            <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-neutral-700">Card</span>
            </div>
        );
    }

    if (isPayPal) {
        return (
            <div className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#003087">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852a.932.932 0 0 1 .924-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.722-4.461z" />
                </svg>
                <span className="text-sm text-neutral-700">PayPal</span>
            </div>
        );
    }

    return <span className="text-sm text-neutral-500">{method || "Unknown"}</span>;
};

export default function PaymentHistory() {
    const navigate = useNavigate();
    const auth = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);
    const [limit] = useState(20);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        fetchHistory();
    }, [offset]);

    async function fetchHistory() {
        try {
            setLoading(true);
            setError("");

            if (auth.isLoading) return;

            if (!auth.isAuthenticated) {
                navigate("/login");
                return;
            }

            const authHeaders = getAuthHeaders(auth.user);
            const result = await getPaymentHistory(limit, offset, authHeaders);
            setData(result);
        } catch (err) {
            setError(err.message || "Failed to load payment history");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-center">
                    <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-neutral-600">Loading payment history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-7xl">
                    <Card className="border-red-200 bg-red-50 p-6">
                        <h2 className="text-xl font-bold text-red-700">Error Loading Payment History</h2>
                        <p className="mt-2 text-red-600">{error}</p>
                        <button
                            onClick={fetchHistory}
                            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </Card>
                </div>
            </div>
        );
    }

    const summary = data?.summary || {};
    const items = data?.items || [];
    const hasMore = items.length === limit;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-neutral-50 p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900">Payment History</h1>
                    <p className="mt-2 text-neutral-600">View all your payment transactions and receipts</p>
                </div>

                {/* Summary Cards */}
                <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-3">
                                <Receipt className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Payments</p>
                                <p className="text-2xl font-bold text-neutral-900">{summary.total_payments || 0}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Paid</p>
                                <p className="text-2xl font-bold text-neutral-900">{summary.total_paid_count || 0}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-purple-100 p-3">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Paid</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {money(summary.total_paid_cents)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-indigo-100 p-3">
                                <TrendingUp className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Jobs Completed</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {summary.jobs_completed_and_paid || 0}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Payment List */}
                {items.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Receipt className="mx-auto h-16 w-16 text-neutral-300" />
                        <h3 className="mt-4 text-xl font-semibold text-neutral-700">No Payment History</h3>
                        <p className="mt-2 text-neutral-500">You haven't made any payments yet.</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {items.map((payment) => (
                            <Card
                                key={payment.payment_id}
                                className="border-neutral-200 bg-white p-6 shadow-md transition-all hover:shadow-lg"
                            >
                                <div className="grid gap-6 lg:grid-cols-12">
                                    {/* Left: Job Info */}
                                    <div className="lg:col-span-5">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-neutral-900">
                                                    {payment.title || "Untitled Job"}
                                                </h3>
                                                <p className="text-sm text-neutral-500">
                                                    {payment.category || "General"}
                                                </p>
                                            </div>
                                            <StatusBadge status={payment.status} />
                                        </div>

                                        <div className="space-y-2 text-sm text-neutral-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-neutral-400" />
                                                <span>
                                                    {payment.location_city}, {payment.location_state}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-neutral-400" />
                                                <span>Paid: {formatDate(payment.paid_at || payment.created_at)}</span>
                                            </div>
                                            {payment.provider_business_name && (
                                                <div className="text-sm">
                                                    <span className="text-neutral-500">Provider: </span>
                                                    <span className="font-medium text-neutral-700">
                                                        {payment.provider_business_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Payment Details */}
                                    <div className="lg:col-span-4">
                                        <div className="space-y-2">
                                            <div className="mb-3">
                                                <PaymentMethodBadge method={payment.payment_method} />
                                            </div>

                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-600">Base Amount:</span>
                                                    <span className="font-medium text-neutral-900">
                                                        {money(payment.base_amount_cents)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-600">Tax:</span>
                                                    <span className="font-medium text-neutral-900">
                                                        {money(payment.tax_cents)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-600">App Fee:</span>
                                                    <span className="font-medium text-neutral-900">
                                                        {money(payment.app_fee_cents)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2">
                                                    <span className="font-semibold text-neutral-900">Total:</span>
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {money(payment.final_amount_cents)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center lg:col-span-3">
                                        <button
                                            onClick={() => navigate(`/receipt-new/${payment.payment_id}`)}
                                            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <Receipt className="h-4 w-4" />
                                                View Receipt
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {items.length > 0 && (
                    <div className="mt-8 flex items-center justify-between">
                        <button
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-neutral-600">
                            Showing {offset + 1} - {offset + items.length}
                        </span>

                        <button
                            onClick={() => setOffset(offset + limit)}
                            disabled={!hasMore}
                            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
