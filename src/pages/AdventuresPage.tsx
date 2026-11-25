import { CalendarDays, Check, Compass } from "lucide-react";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { assetUrl, badgeUrl } from "../data/hikes";
import { allTrailsUrl, useRouteSettings } from "../data/privateRoutes";
import { seasonStatus } from "../lib/season";
import { formatDate } from "../lib/storage";

const seasonalHeadings = {
  before: "Your winter adventure begins soon!",
  open: "Your winter adventure awaits!",
  final: "One last day of Christmas adventures!",
  master: "Christmas Trail Master!",
  after: "The season has ended, but the adventure continues.",
};

export function AdventuresPage() {
  const { records, edition, today } = useRecords();
  const { hikes, goal } = edition;
  const settings = useRouteSettings();
  const collectionUrl = allTrailsUrl(edition.allTrailsCollectionUrl ?? settings?.collectionUrl);
  const { phase, daysUntil, daysRemaining, master, stats, remainingMiles } = seasonStatus(
    edition,
    records,
    today,
  );
  const encouragement =
    stats.adventures === 0
      ? "Pick any trail to start your passport."
      : stats.adventures < goal
        ? "Every trail has a new story to bring home."
        : "Your trail patch collection is full!";

  return (
    <div className="page adventures-page">
      <section className="hero-panel" aria-labelledby="adventures-title">
        <img
          className="passport-logo"
          src={assetUrl("branding/logo.webp")}
          width={727}
          height={644}
          alt=""
          fetchPriority="high"
        />
        <div className="hero-copy">
          <h1 id="adventures-title" className="visually-hidden">
            {edition.title}
          </h1>
          <span className="eyebrow">{edition.year} Adventure Passport</span>
          <h2>{seasonalHeadings[phase]}</h2>
          {master ? (
            <div className="home-award">
              <img src={badgeUrl(edition.completionBadge.unlockedImage)} alt="" />
              <div>
                <p>Completed {formatDate(master.date)}</p>
                <a href="#certificate">View your certificate</a>
              </div>
            </div>
          ) : (
            <>
              <p>
                {phase === "after"
                  ? "Keep exploring and adding badges to your collection."
                  : encouragement}
              </p>
              <p className="season-dates">
                {phase === "before"
                  ? `${daysUntil} ${daysUntil === 1 ? "day" : "days"} until ${edition.startLabel ?? formatDate(edition.startDate)}`
                  : `${formatDate(edition.startDate)} – ${formatDate(edition.endDate)}`}
              </p>
            </>
          )}
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={`${stats.adventures} of ${goal} hikes completed`}
          aria-valuenow={stats.adventures}
          aria-valuemin={0}
          aria-valuemax={goal}
        >
          <span style={{ width: `${(stats.adventures / goal) * 100}%` }} />
        </div>
        <dl className="summary-row">
          <div>
            <dt>Badges collected</dt>
            <dd>
              {stats.adventures} / {goal}
            </dd>
          </div>
          <div>
            <dt>Miles explored</dt>
            <dd>{stats.miles.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Planned miles left</dt>
            <dd>{remainingMiles.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Passport stamps</dt>
            <dd>{stats.stamps}</dd>
          </div>
          {!master && (
            <div>
              <dt>Days remaining</dt>
              <dd>{phase === "before" ? "—" : daysRemaining}</dd>
            </div>
          )}
        </dl>
        {stats.adventures > 0 && (
          <p className="mileage-breakdown">
            {stats.plannedMiles.toFixed(2)} mi from planned routes · {stats.actualMiles.toFixed(2)}{" "}
            mi recorded in the journal
          </p>
        )}
      </section>

      <section className="section-heading">
        <div>
          <h2>Choose an adventure</h2>
          <p>
            {hikes.length} trails · {edition.targetMiles.toFixed(2)} planned miles · Any order
          </p>
        </div>
        <a className="button button--secondary" href="#missions">
          <Compass aria-hidden="true" /> Trail missions
        </a>
      </section>

      {collectionUrl && (
        <p>
          <a className="text-link" href={collectionUrl} target="_blank" rel="noreferrer">
            View AllTrails Collection
          </a>
        </p>
      )}

      <div className="adventure-grid">
        {hikes.map((hike, index) => {
          const record = records.find((item) => item.hikeId === hike.id);
          const earned = Boolean(record?.completed);
          return (
            <a
              className={`adventure-card ${earned ? "is-complete" : ""}`}
              href={`#adventure/${hike.slug}`}
              key={hike.id}
            >
              <BadgeImage hike={hike} earned={earned} priority={index < 3} showStatus={false} />
              <div className="adventure-card__copy">
                <span className={`status-chip ${earned ? "status-chip--earned" : ""}`}>
                  {earned ? (
                    <>
                      <Check size={14} /> Completed
                    </>
                  ) : (
                    "Ready to explore"
                  )}
                </span>
                <h3>{hike.name}</h3>
                <p>{hike.park}</p>
                <div className="trail-meta">
                  <span>
                    {hike.distanceEstimated ? "≈" : ""}
                    {hike.distanceMiles.toFixed(2)} mi
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
