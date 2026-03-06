import { useEffect, useState } from "react";
import { fetchAdminAnalytics } from "../../api/adminAnalytics";
import HealthCard from "../../components/Admin/HealthCard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
} from "recharts";

const CHART_COLORS = [
    "#0f766e",
    "#0ea5e9",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#22c55e",
    "#64748b",
];

const asNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

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
        val === null || val === undefined || Number.isNaN(Number(val))
            ? "N/A"
            : `${Number(val).toFixed(1)} min`;

    const entityOverviewData = [
        { entity: "Customers", total: asNumber(metrics.customers_total) },
        { entity: "Providers", total: asNumber(metrics.providers_total) },
        { entity: "Jobs", total: asNumber(metrics.jobs_total) },
        { entity: "Bookings", total: asNumber(metrics.bookings_total) },
        { entity: "Reviews", total: asNumber(metrics.reviews_total) },
    ];

    const commitmentSplitData = [
        {
            name: "Direct Jobs",
            value: asNumber(commitment.direct_jobs_committed),
        },
        {
            name: "Booking Jobs",
            value: asNumber(commitment.booking_jobs_committed),
        },
    ];

    const commitmentTimeData = [
        {
            name: "Avg Minutes",
            direct: asNumber(commitment.avg_minutes_direct),
            booking: asNumber(commitment.avg_minutes_booking),
        },
    ];

    const jobStatusData = (metrics.job_status_distribution || []).map((item) => ({
        status: item.status || "unknown",
        count: asNumber(item.count),
    }));

    const bookingStatusData = (metrics.booking_status_distribution || []).map(
        (item) => ({
            status: item.status || "unknown",
            count: asNumber(item.count),
        }),
    );

    const monthlyGrowth = metrics.monthly_growth || {};
    const monthMap = new Map();

    ["jobs", "customers", "bookings", "providers"].forEach((key) => {
        (monthlyGrowth[key] || []).forEach((entry) => {
            if (!entry.month) return;
            if (!monthMap.has(entry.month)) {
                monthMap.set(entry.month, {
                    month: entry.month,
                    jobs: 0,
                    customers: 0,
                    bookings: 0,
                    providers: 0,
                });
            }
            monthMap.get(entry.month)[key] = asNumber(entry.count);
        });
    });

    const monthlyGrowthData = Array.from(monthMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
    );

    const compactKpis = [
        { label: "Customers", value: metrics.customers_total },
        { label: "Providers", value: metrics.providers_total },
        { label: "Jobs", value: metrics.jobs_total },
        { label: "Bookings", value: metrics.bookings_total },
        { label: "Reviews", value: metrics.reviews_total },
        { label: "Committed Jobs", value: commitment.committed_jobs },
        {
            label: "Avg Time to Commit",
            value: formatMinutes(commitment.avg_minutes_to_commitment),
        },
    ];

    const hasV2Charts =
        jobStatusData.length > 0 ||
        bookingStatusData.length > 0 ||
        monthlyGrowthData.length > 0;

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

            {/* COMPACT KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {compactKpis.map((item) => (
                    <div
                        key={item.label}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                            {item.label}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* PHASE 1: CHARTS WITH V1 DATA */}
            <HealthCard title="Entity Overview">
                <p className="text-xs text-gray-500 mb-3">
                    Side-by-side comparison of core platform entities
                </p>
                <ResponsiveContainer width="100%" height={290}>
                    <BarChart data={entityOverviewData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="entity" width={90} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#111827" radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </HealthCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <HealthCard title="Commitment Split">
                    <p className="text-xs text-gray-500 mb-3">
                        Direct jobs versus booking-based jobs
                    </p>
                    <ResponsiveContainer width="100%" height={290}>
                        <PieChart>
                            <Pie
                                data={commitmentSplitData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                            >
                                {commitmentSplitData.map((slice, index) => (
                                    <Cell
                                        key={slice.name}
                                        fill={index === 0 ? "#0f766e" : "#0ea5e9"}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </HealthCard>

                <HealthCard title="Commitment Time Comparison">
                    <p className="text-xs text-gray-500 mb-3">
                        Average minutes to commitment by commitment type
                    </p>
                    <ResponsiveContainer width="100%" height={290}>
                        <BarChart data={commitmentTimeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="direct"
                                name="Direct Jobs"
                                fill="#0f766e"
                                radius={[6, 6, 0, 0]}
                            />
                            <Bar
                                dataKey="booking"
                                name="Booking Jobs"
                                fill="#0ea5e9"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </HealthCard>
            </div>

            {/* PHASE 2: CHARTS WITH V2 DATA */}
            {hasV2Charts && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Advanced Trends
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {jobStatusData.length > 0 && (
                            <HealthCard title="Job Status Distribution">
                                <ResponsiveContainer width="100%" height={290}>
                                    <PieChart>
                                        <Pie
                                            data={jobStatusData}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={105}
                                        >
                                            {jobStatusData.map((entry, index) => (
                                                <Cell
                                                    key={`${entry.status}-${index}`}
                                                    fill={
                                                        CHART_COLORS[
                                                            index % CHART_COLORS.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </HealthCard>
                        )}

                        {bookingStatusData.length > 0 && (
                            <HealthCard title="Booking Status Distribution">
                                <ResponsiveContainer width="100%" height={290}>
                                    <PieChart>
                                        <Pie
                                            data={bookingStatusData}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={105}
                                        >
                                            {bookingStatusData.map((entry, index) => (
                                                <Cell
                                                    key={`${entry.status}-${index}`}
                                                    fill={
                                                        CHART_COLORS[
                                                            index % CHART_COLORS.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </HealthCard>
                        )}
                    </div>

                    {monthlyGrowthData.length > 0 && (
                        <HealthCard title="Monthly Growth (Last 6 Months)">
                            <ResponsiveContainer width="100%" height={310}>
                                <LineChart data={monthlyGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="jobs"
                                        name="Jobs"
                                        stroke="#0f766e"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="customers"
                                        name="Customers"
                                        stroke="#0ea5e9"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="bookings"
                                        name="Bookings"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="providers"
                                        name="Providers"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </HealthCard>
                    )}
                </div>
            )}

            {/* FOOTER */}
            <div className="text-xs text-gray-400 text-right">
                Generated at: {new Date(data.generated_at).toLocaleString()}
            </div>
        </div>
    );
}
