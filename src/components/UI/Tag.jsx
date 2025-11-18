export default function Tag({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-neutral-100 
                  px-3 py-1 text-sm ${className}`}
    >
      {children}
    </span>
  );
}
