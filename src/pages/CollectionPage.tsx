import { CalendarDays, LockKeyhole, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { badgeUrl, editions } from "../data/hikes";
import { seasonStatus } from "../lib/season";
import { formatDate } from "../lib/storage";

export function CollectionPage() {
  const { records, edition, today, selectYear } = useRecords();
  const { hikes, goal, completionBadge } = edition;
  const { master } = seasonStatus(edition, records, today);
  const completed = records.filter((record) => record.completed);
  const [openId, setOpenId] = useState<number>();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openHike = openId ? edition.hikes.find((item) => item.id === openId) : undefined;
  const openRecord = openId
    ? records.find((record) => record.hikeId === openId && record.completed)
    : undefined;
  const percent = Math.round((completed.length / hikes.length) * 100);

  useEffect(() => {
    if (!openId) return;

    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenId(undefined);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [openId]);

  return (
    <div className="page collection-page">
      <header className="page-heading page-heading--center">
        <span className="eyebrow">The patch cabinet</span>
        <h1>Badge Collection</h1>
        <p>Each trail adds another story to the collection.</p>
        {editions.length > 1 && (
          <label className="edition-picker">
            Collection year
            <select
              value={edition.year}
              onChange={(event) => selectYear(Number(event.target.value))}
            >
              {editions.map(({ year }) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="collection-progress">
          <strong>
            {completed.length}
            <span>/{goal}</span>
          </strong>
          <div>
            <span>{percent}% complete</span>
            <div className="progress-track">
              <i style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </header>
      <section className="master-banner">
        <img
          className="master-patch"
          src={badgeUrl(master ? completionBadge.unlockedImage : completionBadge.lockedImage)}
          alt=""
        />
        <div>
          <h2>
            {completionBadge.name} {edition.year}
          </h2>
          {master ? (
            <>
              <p>Earned {formatDate(master.date)}</p>
              <a className="button button--secondary" href="#certificate">
                View certificate
              </a>
            </>
          ) : (
            <p>Earn this patch by hiking all {goal} trails during the challenge season.</p>
          )}
        </div>
      </section>
      <div className="collection-case">
        <div className="case-plaque">
          <span>Six Hikes of Christmas</span>
          <small>{edition.year} National Park Collection</small>
        </div>
        <div className="collection-grid">
          {hikes.map((hike) => {
            const record = records.find((item) => item.hikeId === hike.id && item.completed);
            return (
              <button
                key={hike.id}
                type="button"
                className={`collection-item ${record ? "is-earned" : ""}`}
                onClick={(event) => {
                  if (!record) return;
                  triggerRef.current = event.currentTarget;
                  setOpenId(hike.id);
                }}
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
          onClick={(event) => event.target === event.currentTarget && setOpenId(undefined)}
        >
          <section
            ref={dialogRef}
            className="badge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-modal-title"
          >
            <button
              ref={closeRef}
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
