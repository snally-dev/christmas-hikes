import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { BadgeImage } from "./BadgeImage";
import { useRecords } from "../context/RecordsContext";

export function Celebration() {
  const { celebrationHikeId, clearCelebration, edition } = useRecords();
  const finishRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hike = edition.hikes.find((item) => item.id === celebrationHikeId);

  useEffect(() => {
    if (hike) closeRef.current?.focus();
  }, [hike]);

  if (!hike) return null;

  const dismiss = () => {
    clearCelebration();
    document.getElementById("main-content")?.focus();
  };
  return (
    <div
      className="celebration-backdrop"
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && dismiss()}
    >
      <section
        className="celebration"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            dismiss();
          }
          if (event.key !== "Tab") return;
          const first = closeRef.current;
          const last = finishRef.current;
          if (event.shiftKey && event.target === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && event.target === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <button
          ref={closeRef}
          className="icon-button celebration-close"
          onClick={dismiss}
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
        <button ref={finishRef} className="button button--primary" onClick={dismiss}>
          Add it to my collection
        </button>
      </section>
    </div>
  );
}
