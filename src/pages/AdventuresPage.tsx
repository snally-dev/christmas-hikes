import { Award, CalendarDays, Check, Map, Stamp } from "lucide-react";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { challenge, hikes } from "../data/hikes";
import { formatDate } from "../lib/storage";

export function AdventuresPage() {
  const { records } = useRecords();
  const completed = records.filter((record) => record.completed);
  const completedIds = new Set(completed.map((record) => record.hikeId));
  const totalMiles = completed.reduce((sum, record) => sum + (record.actualDistanceMiles ?? 0), 0);
  const stamps = completed.filter((record) => record.passportStampCollected).length;
  const allComplete = completed.length === hikes.length;

  return (
    <div className="page adventures-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">
            {challenge.year} {challenge.subtitle}
          </span>
          <h1>{challenge.title}</h1>
          <p>Six trails. Six embroidered badges. One unforgettable National Park adventure.</p>
        </div>
        <div
          className="progress-seal"
          aria-label={`${completed.length} of ${hikes.length} hikes completed`}
        >
          <strong>
            {completed.length}
            <span>/6</span>
          </strong>
          <small>hikes complete</small>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${(completed.length / hikes.length) * 100}%` }} />
        </div>
        <div className="summary-row">
          <div>
            <Map aria-hidden="true" />
            <span>
              <strong>{totalMiles.toFixed(1)}</strong> miles hiked
            </span>
          </div>
          <div>
            <Stamp aria-hidden="true" />
            <span>
              <strong>{stamps}</strong> passport {stamps === 1 ? "stamp" : "stamps"}
            </span>
          </div>
          <div>
            <Award aria-hidden="true" />
            <span>
              <strong>{completed.length}</strong> badges earned
            </span>
          </div>
        </div>
      </section>

      {allComplete && (
        <section className="master-banner">
          <Award size={38} aria-hidden="true" />
          <div>
            <span className="eyebrow">All six trails conquered</span>
            <h2>Christmas Trail Master</h2>
          </div>
        </section>
      )}

      <section className="section-heading">
        <div>
          <span className="eyebrow">Choose your trail</span>
          <h2>Adventure map</h2>
        </div>
        <p>Hike them in any order.</p>
      </section>

      <div className="adventure-grid">
        {hikes.map((hike, index) => {
          const record = records.find((item) => item.hikeId === hike.id);
          const earned = completedIds.has(hike.id);
          return (
            <a
              className={`adventure-card ${earned ? "is-complete" : ""}`}
              href={`#adventure/${hike.slug}`}
              key={hike.id}
            >
              <div className="card-number">{String(index + 1).padStart(2, "0")}</div>
              <BadgeImage hike={hike} earned={earned} priority={index < 3} />
              <div className="adventure-card__copy">
                <span className={`status-chip ${earned ? "status-chip--earned" : ""}`}>
                  {earned ? (
                    <>
                      <Check size={14} /> Completed
                    </>
                  ) : (
                    "Badge locked"
                  )}
                </span>
                <h3>{hike.name}</h3>
                <p>{hike.park}</p>
                <div className="trail-meta">
                  <span>
                    {hike.distanceEstimated ? "≈" : ""}
                    {hike.distanceMiles} mi
                  </span>
                  <span>{hike.difficulty}</span>
                </div>
                {record?.plannedDate && !earned && (
                  <div className="planned-date">
                    <CalendarDays size={15} /> Planned {formatDate(record.plannedDate)}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
