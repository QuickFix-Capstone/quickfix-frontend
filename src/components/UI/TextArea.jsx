export default function TextArea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none
                  focus:ring-2 focus:ring-black/20 min-h-[120px] ${className}`}
      {...props}
    />
  );
}
