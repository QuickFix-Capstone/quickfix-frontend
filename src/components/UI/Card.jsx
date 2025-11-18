export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
