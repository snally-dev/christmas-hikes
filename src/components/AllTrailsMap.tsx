import { useState } from "react";
import type { AdventureDefinition } from "../types";

function widgetSource(value?: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (
      url.origin === "https://www.alltrails.com" &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith("/widget/")
    ) {
      return url.href;
    }
  } catch {
    // An invalid configuration leaves the external route link available.
  }
}

export function AllTrailsMap({ hike }: { hike: AdventureDefinition }) {
  const [showMap, setShowMap] = useState(false);
  const source = widgetSource(hike.allTrails?.embedUrl);

  return (
    <section className="paper-card trail-explorer">
      <h2>{source ? "Trail map" : "Trail elevations"}</h2>
      {source && (
        <button
          className="button button--secondary"
          aria-expanded={showMap}
          onClick={() => setShowMap((visible) => !visible)}
        >
          {showMap ? "Hide AllTrails map" : "Load AllTrails map"}
        </button>
      )}
      {source && showMap && (
        <iframe
          className="alltrails-map"
          title={`AllTrails map of ${hike.name}`}
          src={source}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          allow="geolocation 'none'"
        />
      )}
      <p>
        {source
          ? "If the map is unavailable, open the route in AllTrails."
          : "Open in AllTrails to explore the route map."}
      </p>
      <dl className="trail-profile-facts">
        <div>
          <dt>Highest point</dt>
          <dd>{Math.round(hike.maxElevationFeet)} ft</dd>
        </div>
        <div>
          <dt>Lowest point</dt>
          <dd>{Math.round(hike.minElevationFeet)} ft</dd>
        </div>
      </dl>
    </section>
  );
}
