// import { useEffect, useState } from "react";
// import { fetchSystemHealth } from "../../api/systemHealth";
// import HealthCard from "../../components/Admin/HealthCard";
// import StatusBadge from "../../components/Admin/StatusBadge";

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
//   ReferenceLine,
//   Cell,
// } from "recharts";

// export default function SystemHealth() {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const loadHealth = async () => {
//     try {
//       setLoading(true);
//       const res = await fetchSystemHealth();
//       setData(res);
//       setError(null);
//     } catch (err) {
//       setError(err.message || "Failed to load system health");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadHealth();
//     const interval = setInterval(loadHealth, 1000000);
//     return () => clearInterval(interval);
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <p className="text-gray-500">Loading system health metrics…</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <p className="font-semibold text-red-700">System Health Error</p>
//           <p className="text-sm text-red-600 mt-1">{error}</p>
//           <button
//             onClick={loadHealth}
//             className="mt-3 px-4 py-2 bg-red-600 text-white rounded"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ===============================
//   // DERIVED DATA
//   // ===============================
//   const problemFunctions = data.lambda.functions.filter(
//     (fn) => fn.status === "degraded" || fn.status === "warning",
//   );

//   const errorFunctions = data.lambda.functions.filter((fn) => fn.errors > 0);
//   const slowFunctions = data.lambda.functions.filter(
//     (fn) => fn.avg_latency_ms > 3000,
//   );

//   const unhealthyTables = data.dynamodb.tables.filter(
//     (t) => t.status !== "healthy",
//   );

//   // ===============================
//   // COLOR HELPERS
//   // ===============================
//   const latencyColor = (v) =>
//     v < 1000 ? "#10b981" : v < 3000 ? "#f59e0b" : "#ef4444";
//   const errorColor = (v) =>
//     v === 0 ? "#10b981" : v < 5 ? "#f59e0b" : "#ef4444";

//   // ===============================
//   // TOOLTIP
//   // ===============================
//   const CustomTooltip = ({ active, payload, label }) => {
//     if (!active || !payload?.length) return null;
//     return (
//       <div className="bg-white p-3 border rounded shadow">
//         <p className="font-semibold text-sm">{label}</p>
//         {payload.map((p, i) => (
//           <p key={i} className="text-sm">
//             {p.name}: {p.value}
//           </p>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//       {/* HEADER */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">System Health</h1>
//           <p className="text-sm text-gray-500">
//             Live AWS monitoring • Updated every 50 seconds
//           </p>
//         </div>
//         <button
//           onClick={loadHealth}
//           className="px-4 py-2 bg-black text-white rounded"
//         >
//           Refresh
//         </button>
//       </div>

//       {/* OVERALL STATUS */}
//       <div
//         className={`p-6 rounded-xl border-2 ${
//           data.status === "healthy"
//             ? "bg-green-50 border-green-200"
//             : data.status === "warning"
//               ? "bg-yellow-50 border-yellow-200"
//               : "bg-red-50 border-red-200"
//         }`}
//       >
//         <div className="flex items-center gap-3">
//           <StatusBadge status={data.status} />
//           <h2 className="text-xl font-bold">
//             {data.status === "healthy"
//               ? "All Systems Operational"
//               : data.status === "warning"
//                 ? "System Under Stress"
//                 : "Critical Issues Detected"}
//           </h2>
//         </div>
//         <p className="text-sm text-gray-600 mt-2">
//           This summarizes the health of Lambdas, DynamoDB, and RDS.
//         </p>
//       </div>

//       {/* ATTENTION REQUIRED */}
//       {(problemFunctions.length > 0 || unhealthyTables.length > 0) && (
//         <div className="bg-white border border-red-200 rounded-xl p-4">
//           <h3 className="font-semibold text-red-700 mb-2">
//             🚨 Attention Required
//           </h3>
//           <ul className="text-sm space-y-1">
//             {errorFunctions.map((fn) => (
//               <li key={fn.function} className="text-red-600">
//                 • {fn.function} has {fn.errors} errors
//               </li>
//             ))}
//             {slowFunctions.map((fn) => (
//               <li key={fn.function} className="text-yellow-600">
//                 • {fn.function} latency is {fn.avg_latency_ms}ms
//               </li>
//             ))}
//             {unhealthyTables.map((t) => (
//               <li key={t.table} className="text-orange-600">
//                 • DynamoDB table {t.table} is {t.status}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* KPI CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <HealthCard title="⚡ Current Load">
//           <p className="text-4xl font-bold">
//             {data.lambda.summary.current_invocations}
//           </p>
//           <p className="text-sm text-gray-600 mt-1">
//             Number of Lambda executions running right now
//           </p>
//         </HealthCard>

//         <HealthCard title="🚀 Average Latency">
//           <p className="text-4xl font-bold">
//             {data.lambda.summary.avg_latency_ms} ms
//           </p>
//           <p className="text-sm text-gray-600 mt-1">
//             How long requests take to complete
//           </p>
//         </HealthCard>

//         <HealthCard title="⚠️ Error Rate">
//           <p className="text-4xl font-bold text-red-600">
//             {data.lambda.summary.error_rate_percent}%
//           </p>
//           <p className="text-sm text-gray-600 mt-1">
//             Percentage of failed requests
//           </p>
//         </HealthCard>
//       </div>

//       {/* LAMBDA LATENCY CHART */}
//       <HealthCard title="📊 Lambda Response Time">
//         <p className="text-sm text-gray-600 mb-4">
//           Average execution latency per function
//         </p>
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart data={data.lambda.functions}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="function" hide />
//             <YAxis />
//             <Tooltip content={<CustomTooltip />} />
//             <ReferenceLine y={1000} stroke="#10b981" />
//             <ReferenceLine y={3000} stroke="#f59e0b" />
//             <Bar dataKey="avg_latency_ms" name="Latency">
//               {data.lambda.functions.map((f, i) => (
//                 <Cell key={i} fill={latencyColor(f.avg_latency_ms)} />
//               ))}
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       </HealthCard>

//       {/* LAMBDA TABLE */}
//       <HealthCard title="🔍 Lambda Details">
//         <div className="overflow-x-auto">
//           <table className="min-w-full text-sm">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-3 py-2 text-left">Function</th>
//                 <th className="px-3 py-2">Status</th>
//                 <th className="px-3 py-2 text-right">Latency</th>
//                 <th className="hidden md:table-cell px-3 py-2 text-right">
//                   Errors
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.lambda.functions.map((fn) => (
//                 <tr key={fn.function} className="border-t">
//                   <td className="px-3 py-2 font-medium">{fn.function}</td>
//                   <td className="px-3 py-2">
//                     <StatusBadge status={fn.status} />
//                   </td>
//                   <td className="px-3 py-2 text-right">
//                     {fn.avg_latency_ms} ms
//                   </td>
//                   <td className="hidden md:table-cell px-3 py-2 text-right">
//                     {fn.errors}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </HealthCard>

//       {/* FOOTER */}
//       <div className="text-center text-xs text-gray-400 pt-4">
//         QuickFix Capstone • AWS CloudWatch • React + Tailwind
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { fetchSystemHealth } from "../../api/systemHealth";
import HealthCard from "../../components/Admin/HealthCard";
import StatusBadge from "../../components/Admin/StatusBadge";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const silentRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const loadHealth = async () => {
    try {
      setLoading(true);
      const res = await fetchSystemHealth();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load system health");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 50000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-sm text-gray-500">Loading system health…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="border border-gray-200 rounded-lg p-4 max-w-lg">
          <p className="font-medium text-gray-900">System Health Unavailable</p>
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

  // ===============================
  // DERIVED DATA
  // ===============================
  const problemFunctions = data.lambda.functions.filter(
    (fn) => fn.status !== "healthy",
  );

  const errorFunctions = data.lambda.functions.filter((fn) => fn.errors > 0);
  const slowFunctions = data.lambda.functions.filter(
    (fn) => fn.avg_latency_ms > 3000,
  );

  const unhealthyTables = data.dynamodb.tables.filter(
    (t) => t.status !== "healthy",
  );

  // ===============================
  // COLOR HELPERS
  // ===============================
  const latencyColor = (v) =>
    v < 1000 ? "#16a34a" : v < 3000 ? "#f59e0b" : "#dc2626";

  // ===============================
  // TOOLTIP
  // ===============================
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
        <p className="text-xs font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-gray-600">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            System Health
          </h1>
          <p className="text-sm text-gray-500">Platform performance overview</p>
        </div>
        <button
          onClick={silentRefresh}
          className="px-4 py-2 bg-black text-white text-sm rounded-md hover:opacity-90 w-fit"
        >
          Refresh
        </button>
      </div>

      {/* OVERALL STATUS */}
      <div className="border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <StatusBadge status={data.status} />
          <h2 className="text-lg font-medium text-gray-900">
            {data.status === "healthy"
              ? "All systems operational"
              : data.status === "warning"
                ? "Some systems under load"
                : "Critical issues detected"}
          </h2>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Monitoring Lambdas, DynamoDB, and RDS health signals.
        </p>
      </div>

      {/* ATTENTION */}
      {(problemFunctions.length > 0 || unhealthyTables.length > 0) && (
        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Attention required
          </h3>
          <ul className="text-sm space-y-1 text-gray-600">
            {errorFunctions.map((fn) => (
              <li key={fn.function}>
                • {fn.function} has {fn.errors} errors
              </li>
            ))}
            {slowFunctions.map((fn) => (
              <li key={fn.function}>
                • {fn.function} latency is {fn.avg_latency_ms} ms
              </li>
            ))}
            {unhealthyTables.map((t) => (
              <li key={t.table}>
                • DynamoDB table {t.table} is {t.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthCard title="Current Load">
          <p className="text-3xl font-semibold text-gray-900">
            {data.lambda.summary.current_invocations}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active Lambda executions</p>
        </HealthCard>

        <HealthCard title="Average Latency">
          <p className="text-3xl font-semibold text-gray-900">
            {data.lambda.summary.avg_latency_ms} ms
          </p>
          <p className="text-xs text-gray-500 mt-1">Request processing time</p>
        </HealthCard>

        <HealthCard title="Error Rate">
          <p className="text-3xl font-semibold text-gray-900">
            {data.lambda.summary.error_rate_percent}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Failed requests</p>
        </HealthCard>
      </div>

      {/* CHART */}
      <HealthCard title="Lambda Response Time">
        <p className="text-xs text-gray-500 mb-3">
          Average execution time per function
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.lambda.functions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="function" hide />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={1000} stroke="#16a34a" />
            <ReferenceLine y={3000} stroke="#f59e0b" />
            <Bar dataKey="avg_latency_ms" name="Latency">
              {data.lambda.functions.map((f, i) => (
                <Cell key={i} fill={latencyColor(f.avg_latency_ms)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </HealthCard>

      {/* TABLE */}
      <HealthCard title="Lambda Details">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Function
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">Status</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Latency
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-right font-medium text-gray-600">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lambda.functions.map((fn) => (
                <tr key={fn.function} className="border-b last:border-0">
                  <td className="px-3 py-2 text-gray-900">{fn.function}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={fn.status} />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {fn.avg_latency_ms} ms
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 text-right text-gray-700">
                    {fn.errors}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HealthCard>

      {/* FOOTER */}
      <div className="text-center text-xs text-gray-400 pt-6">
        QuickFix • Admin • System Monitoring
      </div>
    </div>
  );
}
