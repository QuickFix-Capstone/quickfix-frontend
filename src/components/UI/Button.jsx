export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm 
                  hover:shadow transition active:scale-[.99] bg-black text-white 
                  ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
