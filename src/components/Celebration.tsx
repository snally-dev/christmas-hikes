import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { BadgeImage } from "./BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { getHikeById } from "../data/hikes";

export function Celebration() {
  const { celebrationHikeId, clearCelebration } = useRecords();
  const closeRef = useRef<HTMLButtonElement>(null);
  const hike = celebrationHikeId ? getHikeById(celebrationHikeId) : undefined;

  useEffect(() => {
    if (hike) closeRef.current?.focus();
  }, [hike]);

  if (!hike) return null;
  return (
    <div
      className="celebration-backdrop"
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && clearCelebration()}
    >
      <section
        className="celebration"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
      >
        <button
          ref={closeRef}
          className="icon-button celebration-close"
          onClick={clearCelebration}
          aria-label="Close celebration"
        >
          <X />
        </button>
        <span className="eyebrow">Adventure complete</span>
        <h2 id="celebration-title">You earned a badge!</h2>
        <div className="badge-reveal">
          <BadgeImage hike={hike} earned size="large" showStatus={false} priority />
        </div>
        <h3>{hike.badge.name}</h3>
        <p>{hike.name} is now part of your adventure story.</p>
        <button className="button button--primary" onClick={clearCelebration}>
          Add it to my collection
        </button>
      </section>
    </div>
  );
}
