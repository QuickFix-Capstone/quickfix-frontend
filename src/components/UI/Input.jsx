export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none 
                  focus:ring-2 focus:ring-black/20 ${className}`}
      {...props}
    />
  );
}
