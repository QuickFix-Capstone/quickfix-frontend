import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

const variantStyles = {
  error:
    "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800",
  warning:
    "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800",
  success:
    "border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800",
  info: "border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-800",
};

const variantIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

export default function AlertBanner({
  variant = "info",
  message,
  className = "",
}) {
  if (!message) return null;

  const style = variantStyles[variant] || variantStyles.info;
  const Icon = variantIcons[variant] || variantIcons.info;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${style} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="font-medium leading-5">{message}</p>
      </div>
    </div>
  );
}
