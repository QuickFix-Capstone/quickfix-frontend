export default function StatusBadge({ status }) {
  const styles = {
    healthy: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    degraded: "bg-red-100 text-red-700",
    idle: "bg-blue-100 text-blue-700",
    no_data: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}
