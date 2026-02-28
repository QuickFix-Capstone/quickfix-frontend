import { useEffect, useState } from "react";
import { fetchAdminAnalytics } from "../../api/adminAnalytics";
import HealthCard from "../../components/Admin/HealthCard";

export default function AdminAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const silentRefresh = () => setRefreshKey((prev) => prev + 1);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const res = await fetchAdminAnalytics();
            setData(res);
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [refreshKey]);

    // ================= LOADING =================
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <p className="text-sm text-gray-500">Loading analytics…</p>
            </div>
        );
    }

    // ================= ERROR =================
    if (error) {
        return (
            <div className="py-12">
                <div className="border border-gray-200 rounded-lg p-4 max-w-lg">
                    <p className="font-medium text-gray-900">Analytics Unavailable</p>
                    <p className="text-sm text-gray-600 mt-1">{error}</p>
                    <button
                        onClick={silentRefresh}
                        className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-md hover:opacity-90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // ================= DATA =================
    const { metrics } = data;
    const { commitment } = metrics;

    const formatMinutes = (val) =>
        val === null || val === undefined ? "N/A" : `${val.toFixed(1)} min`;

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Platform Analytics
                    </h2>
                    <p className="text-sm text-gray-500">
                        Overview of key platform metrics
                    </p>
                </div>
                <button
                    onClick={silentRefresh}
                    className="px-4 py-2 bg-black text-white text-sm rounded-md hover:opacity-90 w-fit"
                >
                    Refresh
                </button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <HealthCard title="Customers">
                    <p className="text-3xl font-semibold text-gray-900">
                        {metrics.customers_total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Registered customers</p>
                </HealthCard>

                <HealthCard title="Providers">
                    <p className="text-3xl font-semibold text-gray-900">
                        {metrics.providers_total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Registered service providers</p>
                </HealthCard>

                <HealthCard title="Jobs">
                    <p className="text-3xl font-semibold text-gray-900">
                        {metrics.jobs_total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total jobs posted</p>
                </HealthCard>

                <HealthCard title="Bookings">
                    <p className="text-3xl font-semibold text-gray-900">
                        {metrics.bookings_total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total bookings created</p>
                </HealthCard>

                <HealthCard title="Reviews">
                    <p className="text-3xl font-semibold text-gray-900">
                        {metrics.reviews_total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total reviews submitted</p>
                </HealthCard>
            </div>

            {/* COMMITMENT STATS */}
            <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Commitment Metrics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Committed Jobs
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {commitment.committed_jobs}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Avg Time to Commit
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {formatMinutes(commitment.avg_minutes_to_commitment)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Direct Jobs
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {commitment.direct_jobs_committed}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Avg: {formatMinutes(commitment.avg_minutes_direct)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Booking Jobs
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {commitment.booking_jobs_committed}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Avg: {formatMinutes(commitment.avg_minutes_booking)}
                        </p>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="text-xs text-gray-400 text-right">
                Generated at: {new Date(data.generated_at).toLocaleString()}
            </div>
        </div>
    );
}
