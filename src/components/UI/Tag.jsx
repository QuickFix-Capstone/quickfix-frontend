export default function Tag({ children, className = "", ...props }) {
  return (
    <span
      className={`px-3 py-1 rounded-full bg-neutral-200 text-sm cursor-pointer ${className}`}
      {...props}   // <-- THIS is what makes the click work!
    >
      {children}
    </span>
  );
}
