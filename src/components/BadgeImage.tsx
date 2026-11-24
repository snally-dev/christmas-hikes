import { Check, LockKeyhole } from "lucide-react";
import { badgeUrl } from "../data/hikes";
import type { AdventureDefinition } from "../types";

interface BadgeImageProps {
  hike: AdventureDefinition;
  earned: boolean;
  size?: "small" | "medium" | "large";
  showStatus?: boolean;
  priority?: boolean;
}

export function BadgeImage({
  hike,
  earned,
  size = "medium",
  showStatus = true,
  priority = false,
}: BadgeImageProps) {
  return (
    <div className={`badge-image badge-image--${size} ${earned ? "is-earned" : "is-locked"}`}>
      <img
        src={badgeUrl(earned ? hike.badge.unlockedImage : hike.badge.lockedImage)}
        alt={`${hike.badge.name} badge${earned ? "" : ", not yet earned"}`}
        width="1254"
        height="1254"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
      {showStatus && (
        <span className="badge-status" aria-hidden="true">
          {earned ? <Check size={19} strokeWidth={3} /> : <LockKeyhole size={17} />}
        </span>
      )}
    </div>
  );
}
