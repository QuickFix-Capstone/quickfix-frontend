import {
  BadgeCheck,
  Flame,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const BADGE_META = {
  verified: { label: "Verified", icon: ShieldCheck },
  top_rated: { label: "Top Rated", icon: TrendingUp },
  popular: { label: "Popular", icon: Flame },
  new_provider: { label: "New Provider", icon: Sparkles },
};

function normalizeBadge(badge) {
  if (typeof badge === "string") return badge.toLowerCase();
  if (badge && typeof badge === "object") {
    const raw = badge.key || badge.code || badge.type || badge.name;
    return String(raw || "").toLowerCase();
  }
  return "";
}

export default function BadgeChips({ badges = [] }) {
  const uniqueBadges = [...new Set(badges.map(normalizeBadge).filter(Boolean))];

  if (!uniqueBadges.length) {
    return <p className="text-sm text-neutral-500">No badges yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {uniqueBadges.map((badgeKey) => {
        const badgeInfo = BADGE_META[badgeKey] || {
          label: badgeKey.replace(/_/g, " "),
          icon: BadgeCheck,
        };
        const Icon = badgeInfo.icon;

        return (
          <span
            key={badgeKey}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 capitalize"
          >
            <Icon className="h-3.5 w-3.5" />
            {badgeInfo.label}
          </span>
        );
      })}
    </div>
  );
}
