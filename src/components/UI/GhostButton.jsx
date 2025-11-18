export default function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 
                  border border-neutral-300 hover:bg-neutral-50 transition 
                  ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
