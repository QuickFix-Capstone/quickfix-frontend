const variants = {
  primary: "bg-black text-white hover:bg-neutral-800 border border-transparent",
  outline: "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50",
  ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100 border border-transparent",
  link: "bg-transparent text-neutral-900 underline-offset-4 hover:underline p-0 h-auto shadow-none active:scale-100",
};

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const variantStyles = variants[variant] || variants.primary;

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
