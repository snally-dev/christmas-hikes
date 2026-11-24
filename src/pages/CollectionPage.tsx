import { Award, CalendarDays, LockKeyhole, X } from "lucide-react";
import { useState } from "react";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { getHikeById, hikes } from "../data/hikes";
import { formatDate } from "../lib/storage";

export function CollectionPage() {
  const { records } = useRecords();
  const completed = records.filter((record) => record.completed);
  const [openId, setOpenId] = useState<number>();
  const openHike = openId ? getHikeById(openId) : undefined;
  const openRecord = openId
    ? records.find((record) => record.hikeId === openId && record.completed)
    : undefined;
  const percent = Math.round((completed.length / hikes.length) * 100);

  return (
    <div className="page collection-page">
      <header className="page-heading page-heading--center">
        <span className="eyebrow">The patch cabinet</span>
        <h1>Badge Collection</h1>
        <p>Each trail adds another story to the collection.</p>
        <div className="collection-progress">
          <strong>
            {completed.length}
            <span>/6</span>
          </strong>
          <div>
            <span>{percent}% complete</span>
            <div className="progress-track">
              <i style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </header>
      {completed.length === hikes.length && (
        <section className="master-banner">
          <Award size={38} />
          <div>
            <span className="eyebrow">Complete collection</span>
            <h2>Christmas Trail Master</h2>
          </div>
        </section>
      )}
      <div className="collection-case">
        <div className="case-plaque">
          <span>Six Hikes of Christmas</span>
          <small>2026 National Park Collection</small>
        </div>
        <div className="collection-grid">
          {hikes.map((hike) => {
            const record = records.find((item) => item.hikeId === hike.id && item.completed);
            return (
              <button
                key={hike.id}
                type="button"
                className={`collection-item ${record ? "is-earned" : ""}`}
                onClick={() => record && setOpenId(hike.id)}
                disabled={!record}
              >
                <div className="collection-shelf">
                  <BadgeImage
                    hike={hike}
                    earned={Boolean(record)}
                    size="medium"
                    showStatus={false}
                  />
                </div>
                <strong>{hike.badge.name}</strong>
                <span>{hike.park}</span>
                {record ? (
                  <small>
                    <CalendarDays size={13} /> Earned {formatDate(record.completedDate)}
                  </small>
                ) : (
                  <small>
                    <LockKeyhole size={13} /> Not yet collected
                  </small>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {openHike && openRecord && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setOpenId(undefined)}
        >
          <section
            className="badge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-modal-title"
          >
            <button
              className="icon-button modal-close"
              onClick={() => setOpenId(undefined)}
              aria-label="Close badge details"
            >
              <X />
            </button>
            <BadgeImage hike={openHike} earned size="large" showStatus={false} priority />
            <span className="eyebrow">Earned {formatDate(openRecord.completedDate)}</span>
            <h2 id="badge-modal-title">{openHike.badge.name}</h2>
            <p className="modal-park">
              {openHike.name} · {openHike.park}
            </p>
            {(openRecord.favoritePart || openRecord.biggestSurprise || openRecord.notes) && (
              <div className="memory-note">
                {openRecord.favoritePart && (
                  <p>
                    <strong>Favorite part</strong>
                    {openRecord.favoritePart}
                  </p>
                )}
                {openRecord.biggestSurprise && (
                  <p>
                    <strong>Biggest surprise</strong>
                    {openRecord.biggestSurprise}
                  </p>
                )}
                {openRecord.notes && (
                  <p>
                    <strong>Trail notes</strong>
                    {openRecord.notes}
                  </p>
                )}
              </div>
            )}
            <a className="button button--secondary" href={`#adventure/${openHike.slug}`}>
              Open adventure
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
