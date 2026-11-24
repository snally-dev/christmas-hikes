import {
  Award,
  BookOpenText,
  CalendarDays,
  Clock3,
  Footprints,
  MapPin,
  Star,
  Stamp,
} from "lucide-react";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { getHikeById } from "../data/hikes";
import { discoveryOptions, feelingOptions, labelFor, weatherOptions } from "../lib/labels";
import { formatDate, formatDuration } from "../lib/storage";

export function JournalPage() {
  const { records } = useRecords();
  const completed = records
    .filter((record) => record.completed)
    .sort((a, b) => (b.completedDate ?? "").localeCompare(a.completedDate ?? ""));

  return (
    <div className="page journal-page">
      <header className="page-heading">
        <span className="eyebrow">Stories from the trail</span>
        <h1>Adventure Journal</h1>
        <p>A keepsake of the paths you walked and the things you found.</p>
      </header>
      {!completed.length ? (
        <section className="empty-state">
          <div className="empty-icon">
            <BookOpenText />
          </div>
          <h2>Your trail stories start here</h2>
          <p>After your first hike, its badge and memories will appear in this journal.</p>
          <a className="button button--primary" href="#adventures">
            Choose an adventure
          </a>
        </section>
      ) : (
        <div className="timeline">
          {completed.map((record, index) => {
            const hike = getHikeById(record.hikeId);
            if (!hike) return null;
            const feeling = feelingOptions.find((option) => option.value === record.feeling);
            return (
              <article className="timeline-entry" key={record.hikeId}>
                <div className="timeline-marker">
                  <span>{completed.length - index}</span>
                </div>
                <div className="journal-card">
                  <header>
                    <div className="journal-badge">
                      <BadgeImage hike={hike} earned size="small" showStatus={false} />
                    </div>
                    <div>
                      <span className="journal-date">
                        <CalendarDays size={15} />
                        {formatDate(record.completedDate)}
                      </span>
                      <h2>{hike.name}</h2>
                      <p>
                        <MapPin size={14} />
                        {hike.park}
                      </p>
                    </div>
                    <a href={`#record/${hike.slug}`}>Edit</a>
                  </header>
                  <div className="journal-stats">
                    <span>
                      <Footprints />{" "}
                      <strong>{record.actualDistanceMiles?.toFixed(1) ?? "—"}</strong> miles
                    </span>
                    {record.durationMinutes !== undefined && (
                      <span>
                        <Clock3 /> <strong>{formatDuration(record.durationMinutes)}</strong>
                      </span>
                    )}
                    {feeling && (
                      <span className="feeling-stat">
                        <b>{feeling.emoji}</b> <strong>{feeling.label}</strong>
                      </span>
                    )}
                    {record.rating && (
                      <span className="stars" aria-label={`${record.rating} out of 5 stars`}>
                        {Array.from({ length: record.rating }, (_, i) => (
                          <Star key={i} fill="currentColor" />
                        ))}
                      </span>
                    )}
                  </div>
                  {(record.weather.length > 0 || record.discoveries.length > 0) && (
                    <div className="journal-tags">
                      {record.weather.map((value) => (
                        <span key={value}>
                          {weatherOptions.find((option) => option.value === value)?.emoji}{" "}
                          {labelFor(weatherOptions, value)}
                        </span>
                      ))}
                      {record.discoveries.map((value) => (
                        <span key={value}>
                          {discoveryOptions.find((option) => option.value === value)?.emoji}{" "}
                          {labelFor(discoveryOptions, value)}
                        </span>
                      ))}
                    </div>
                  )}
                  {(record.favoritePart || record.biggestSurprise || record.notes) && (
                    <div className="journal-memories">
                      {record.favoritePart && (
                        <blockquote>
                          <span>Favorite part</span>“{record.favoritePart}”
                        </blockquote>
                      )}
                      {record.biggestSurprise && (
                        <p>
                          <strong>What surprised me</strong>
                          {record.biggestSurprise}
                        </p>
                      )}
                      {record.notes && (
                        <p>
                          <strong>Adventure notes</strong>
                          {record.notes}
                        </p>
                      )}
                    </div>
                  )}
                  {(record.passportStampCollected ||
                    record.juniorRangerBadgeEarned ||
                    record.completedEntireHike) && (
                    <footer>
                      {record.passportStampCollected && (
                        <span>
                          <Stamp /> Passport stamp
                        </span>
                      )}
                      {record.juniorRangerBadgeEarned && (
                        <span>
                          <Award /> Junior Ranger
                        </span>
                      )}
                      {record.completedEntireHike && <span>✓ Entire hike</span>}
                    </footer>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
