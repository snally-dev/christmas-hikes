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
import { lazy, Suspense, useState } from "react";
import { AllTrailsMap } from "../components/AllTrailsMap";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { directionsUrl } from "../data/hikes";
import { allTrailsUrl, useRouteSettings, useTrailRoute } from "../data/privateRoutes";
import { formatDate } from "../lib/storage";

const TrailExplorer =
  import.meta.env.MODE === "private"
    ? lazy(() => import("../components/TrailExplorer"))
    : () => null;

const routeLabels = { loop: "Loop", out_and_back: "Out and back", combined: "Combined route" };

export function AdventureDetailPage({ slug }: { slug: string }) {
  const { edition, getRecord, upsertRecord } = useRecords();
  const hike = edition.hikes.find((item) => item.slug === slug);
  const record = hike ? getRecord(hike.id) : undefined;
  const [plannedDate, setPlannedDate] = useState(record?.plannedDate ?? "");
  const [plannerMessage, setPlannerMessage] = useState("");

  const { data: route, failed } = useTrailRoute(hike);
  const settings = useRouteSettings();

  if (!hike) return <NotFound />;
  const allTrails = allTrailsUrl(hike.allTrails?.url);
  const directions = route
    ? `https://maps.apple.com/?dirflg=d&daddr=${route.start[1]},${route.start[0]}`
    : directionsUrl(hike);

  const savePlannedDate = () => {
    const now = new Date().toISOString();
    const base = record ?? {
      hikeId: hike.id,
      completed: false,
      weather: [],
      discoveries: [],
      passportStampCollected: false,
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
          <span className="eyebrow">
            Adventure {hike.id} of {edition.hikes.length}
          </span>
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
                  {hike.distanceMiles.toFixed(2)} miles
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
            <div>
              <span>
                <small>Estimated climb</small>
                <strong>{Math.round(hike.elevationGainFeet)} ft</strong>
              </span>
            </div>
            <div>
              <span>
                <small>Family hike estimate</small>
                <strong>{hike.durationMinutes} min</strong>
              </span>
            </div>
            <div>
              <span>
                <small>Route type</small>
                <strong>
                  {hike.id === 3 ? "Combined out and back" : routeLabels[hike.routeType]}
                </strong>
              </span>
            </div>
          </div>
          <div className="detail-actions">
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
            {allTrails && (
              <a
                className="button button--secondary button--large"
                href={allTrails}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in AllTrails <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      </section>

      {import.meta.env.MODE === "private" ? (
        route ? (
          <Suspense fallback={<p role="status">Loading trail map…</p>}>
            <TrailExplorer
              hike={hike}
              route={route}
              download={settings?.allowGpxDownload === true}
            />
          </Suspense>
        ) : (
          <p role="status">{failed ? "The trail map is unavailable." : "Loading trail map…"}</p>
        )
      ) : (
        <AllTrailsMap hike={hike} />
      )}

      <section className="paper-card trail-mission">
        <h2>Trail missions</h2>
        <ol>
          <li>
            {hike.mission}
            {record?.missionCompleted && (
              <>
                <span className="mission-check" aria-hidden="true">
                  ✓
                </span>
                <span className="visually-hidden"> Completed</span>
              </>
            )}
          </li>
          <li>
            {hike.secondMission}
            {record?.secondMissionCompleted && (
              <>
                <span className="mission-check" aria-hidden="true">
                  ✓
                </span>
                <span className="visually-hidden"> Completed</span>
              </>
            )}
          </li>
        </ol>
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
            href={directions}
            target="_blank"
            rel="noreferrer"
          >
            Get Directions <ExternalLink size={16} />
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
      <p>This adventure is not in this edition.</p>
      <a className="button button--primary" href="#adventures">
        Back to adventures
      </a>
    </div>
  );
}
