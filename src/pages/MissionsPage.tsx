import { ArrowLeft } from "lucide-react";
import { useRecords } from "../context/RecordsContext";

export function MissionsPage() {
  const { edition } = useRecords();

  return (
    <div className="page missions-page">
      <a className="back-link" href="#adventures">
        <ArrowLeft size={19} aria-hidden="true" /> All adventures
      </a>
      <header className="page-heading">
        <h1>Trail missions</h1>
        <p>
          <span aria-hidden="true">🐿️ </span>Every hike has a squirrel game. Spot four squirrels!
        </p>
      </header>
      <div className="mission-grid">
        {edition.hikes.map((hike) => (
          <section className="paper-card trail-mission" key={hike.id}>
            <h2>{hike.name}</h2>
            <ol>
              <li>{hike.mission}</li>
              <li>{hike.secondMission}</li>
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
