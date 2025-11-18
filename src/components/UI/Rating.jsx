import { Star } from "lucide-react";

export default function Rating({ value = 4.9, count = 120 }) {
  return (
    <div className="flex items-center gap-1 text-sm text-neutral-600">
      <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
      <span className="font-semibold">{value.toFixed(1)}</span>
      <span className="text-neutral-400">({count})</span>
    </div>
  );
}
