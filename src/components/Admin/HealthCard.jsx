export default function HealthCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}
