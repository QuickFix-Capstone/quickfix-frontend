import { Star } from "lucide-react";
import { useState } from "react";

export default function StarRating({ value = 0, onChange, readOnly = false, size = "md" }) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const iconSize = sizes[size] || sizes.md;

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
          className={`transition-all ${
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
        >
          <Star
            className={`${iconSize} transition-all ${
              star <= displayValue
                ? "fill-yellow-400 stroke-yellow-400"
                : "fill-neutral-200 stroke-neutral-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
