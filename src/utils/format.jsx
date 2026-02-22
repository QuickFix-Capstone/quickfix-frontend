export function safeText(text, fallback = "") {
  if (typeof text !== "string") return fallback;
  const trimmed = text.trim();
  return trimmed.length ? trimmed : fallback;
}

export function formatCurrency(amount, pricingType) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Price unavailable";

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  const type = String(pricingType || "").toLowerCase();
  if (type.includes("hour")) return `${formatted} / hour`;
  if (type.includes("fixed")) return `${formatted} fixed`;
  if (type.includes("day")) return `${formatted} / day`;
  if (type.includes("visit")) return `${formatted} / visit`;
  return formatted;
}

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(String(dateString));
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.0";
  return numeric.toFixed(1);
}
