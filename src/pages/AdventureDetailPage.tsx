import {
  ArrowLeft,
  CalendarDays,
  Check,
  ExternalLink,
  MapPin,
  Pencil,
  Route,
  Stamp,
} from "lucide-react";
import { useState } from "react";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { directionsUrl, getHikeBySlug } from "../data/hikes";
import { formatDate } from "../lib/storage";

export function AdventureDetailPage({ slug }: { slug: string }) {
  const hike = getHikeBySlug(slug);
  const { getRecord, upsertRecord } = useRecords();
  const record = hike ? getRecord(hike.id) : undefined;
  const [plannedDate, setPlannedDate] = useState(record?.plannedDate ?? "");
  const [plannerMessage, setPlannerMessage] = useState("");

  if (!hike) return <NotFound />;

  const savePlannedDate = () => {
    const now = new Date().toISOString();
    const base = record ?? {
      hikeId: hike.id,
      completed: false,
      weather: [],
      discoveries: [],
      passportStampCollected: false,
      juniorRangerBadgeEarned: false,
      completedEntireHike: false,
      createdAt: now,
      updatedAt: now,
    };
    const saved = upsertRecord({ ...base, plannedDate: plannedDate || undefined, updatedAt: now });
    if (saved)
      setPlannerMessage(
        plannedDate ? "Adventure date saved on this device." : "Planned date removed.",
      );
  };

  return (
    <div className="page detail-page">
      <a href="#adventures" className="back-link">
        <ArrowLeft size={19} /> All adventures
      </a>
      <section className="detail-hero">
        <div className="detail-badge">
          <BadgeImage hike={hike} earned={Boolean(record?.completed)} size="large" priority />
        </div>
        <div className="detail-heading">
          <span className="eyebrow">Adventure {hike.id} of 6</span>
          <h1>{hike.name}</h1>
          <a className="park-link" href={hike.parkUrl} target="_blank" rel="noreferrer">
            {hike.park} <ExternalLink size={14} />
          </a>
          <p>{hike.description}</p>
          <div className="detail-facts">
            <div>
              <Route />
              <span>
                <small>Distance</small>
                <strong>
                  {hike.distanceEstimated ? "About " : ""}
                  {hike.distanceMiles} miles
                </strong>
              </span>
            </div>
            <div>
              <span className="fact-symbol">▲</span>
              <span>
                <small>Difficulty</small>
                <strong>{hike.difficulty}</strong>
              </span>
            </div>
          </div>
          {record?.completed ? (
            <div className="completed-panel">
              <div>
                <Check />
                <span>
                  <small>Adventure completed</small>
                  <strong>{formatDate(record.completedDate)}</strong>
                </span>
              </div>
              <a className="button button--secondary" href={`#record/${hike.slug}`}>
                <Pencil size={18} /> Edit journal
              </a>
            </div>
          ) : (
            <a className="button button--primary button--large" href={`#record/${hike.slug}`}>
              Record My Adventure
            </a>
          )}
        </div>
      </section>

      <div className="detail-columns">
        <section className="paper-card">
          <span className="eyebrow">Trail notes</span>
          <h2>What you’ll discover</h2>
          <ul className="highlight-list">
            {hike.highlights.map((item) => (
              <li key={item}>
                <Check size={17} />
                {item}
              </li>
            ))}
          </ul>
          <p className="route-notes">{hike.routeNotes}</p>
          <a className="text-link" href={hike.trailUrl} target="_blank" rel="noreferrer">
            Official trail guide <ExternalLink size={16} />
          </a>
        </section>
        <section className="paper-card">
          <span className="eyebrow">Find your way</span>
          <h2>Trailhead</h2>
          <div className="location-block">
            <MapPin />
            <div>
              <strong>{hike.trailhead.name}</strong>
              <p>{hike.address}</p>
            </div>
          </div>
          <a
            className="button button--secondary"
            href={directionsUrl(hike)}
            target="_blank"
            rel="noreferrer"
          >
            Open directions <ExternalLink size={16} />
          </a>
        </section>
        <section className="paper-card passport-card">
          <Stamp aria-hidden="true" />
          <div>
            <span className="eyebrow">Passport stamp</span>
            <h2>{hike.passportStamp.name}</h2>
            <p>{hike.passportStamp.address}</p>
            <a className="text-link" href={hike.passportStamp.url} target="_blank" rel="noreferrer">
              Visitor information <ExternalLink size={16} />
            </a>
          </div>
        </section>
        <section className="paper-card planner-card">
          <CalendarDays aria-hidden="true" />
          <div>
            <span className="eyebrow">Local-only planner</span>
            <h2>Pick an adventure day</h2>
            <p>This date stays only in this browser.</p>
            <div className="planner-controls">
              <input
                aria-label="Planned adventure date"
                type="date"
                value={plannedDate}
                onChange={(event) => setPlannedDate(event.target.value)}
              />
              <button className="button button--secondary" onClick={savePlannedDate}>
                Save date
              </button>
            </div>
            {plannerMessage && (
              <p className="field-message" role="status">
                {plannerMessage}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page empty-state">
      <MapPin size={42} />
      <h1>Trail not found</h1>
      <p>This adventure is not in the 2026 guide.</p>
      <a className="button button--primary" href="#adventures">
        Back to adventures
      </a>
    </div>
  );
}
