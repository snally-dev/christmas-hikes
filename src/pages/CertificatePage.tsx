import { ArrowLeft, Printer } from "lucide-react";
import { useRecords } from "../context/RecordsContext";
import { badgeUrl } from "../data/hikes";
import { seasonStatus } from "../lib/season";
import { formatDate } from "../lib/storage";

export function CertificatePage() {
  const { edition, records, today } = useRecords();
  const { master } = seasonStatus(edition, records, today);

  return (
    <div className="page certificate-page">
      <a href="#collection" className="back-link">
        <ArrowLeft size={19} /> Back to collection
      </a>
      {master ? (
        <>
          <article className="certificate">
            <p className="eyebrow">
              {edition.title} · {edition.year}
            </p>
            <h1>Certificate of Achievement</h1>
            <img
              src={badgeUrl(edition.completionBadge.unlockedImage)}
              alt=""
              width={281}
              height={445}
            />
            <h2>{edition.completionBadge.name}</h2>
            <p>
              Celebrating an explorer who completed {edition.goal} winter adventures at{" "}
              {edition.goal} National Park Service destinations.
            </p>
            <dl>
              <div>
                <dt>Date completed</dt>
                <dd>{formatDate(master.date)}</dd>
              </div>
              <div>
                <dt>Miles explored</dt>
                <dd>{master.stats.miles.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Passport stamps</dt>
                <dd>{master.stats.stamps}</dd>
              </div>
            </dl>
          </article>
          <button className="button button--primary print-control" onClick={() => window.print()}>
            <Printer /> Print certificate
          </button>
        </>
      ) : (
        <section className="paper-card">
          <h1>Certificate of Achievement</h1>
          <p>Earn the {edition.completionBadge.name} patch to open your certificate.</p>
        </section>
      )}
    </div>
  );
}
