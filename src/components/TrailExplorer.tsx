import L from "leaflet";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { routeAsset, type ProfilePoint, type TrailRoute } from "../data/privateRoutes";
import type { AdventureDefinition } from "../types";
import "leaflet/dist/leaflet.css";

async function readGeoJson<T>(filename: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(routeAsset(filename), { signal });
  if (!response.ok) throw new Error("Map data unavailable");
  return response.json() as Promise<T>;
}

type TrailGeometry = Parameters<typeof L.geoJSON>[0];
type Trailhead = [longitude: number, latitude: number, elevation: number];
const latLng = ([longitude, latitude]: Trailhead): L.LatLngTuple => [latitude, longitude];

export default function TrailExplorer({
  hike,
  route,
  download,
}: {
  hike: AdventureDefinition;
  route: TrailRoute;
  download: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<L.Map | null>(null);
  const pointer = useRef<L.CircleMarker | null>(null);
  const [interactive, setInteractive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tilesMissing, setTilesMissing] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<number>();
  const trace = route.profile.flat();
  const endMiles = trace[trace.length - 1][0];
  const selected =
    selectedDistance === undefined
      ? undefined
      : trace.reduce((nearest, point) =>
          Math.abs(point[0] - selectedDistance) < Math.abs(nearest[0] - selectedDistance)
            ? point
            : nearest,
        );
  const [west, south, east, north] = route.bbox;
  const bounds: L.LatLngBoundsLiteral = [
    [south, west],
    [north, east],
  ];

  useEffect(() => {
    if (!container.current) return;
    const controller = new AbortController();
    const map = L.map(container.current, {
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      maxZoom: 19,
      attributionControl: true,
    });
    leaflet.current = map;
    map.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      { padding: [34, 34], maxZoom: 17 },
    );
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });
    tiles.on("tileerror", () => setTilesMissing(true)).addTo(map);
    const endpoints = (point: Trailhead, label: string, color: string) =>
      L.marker(latLng(point), {
        icon: L.divIcon({
          className: "trail-pin",
          html: `<span style="background:${color}"></span>`,
          iconSize: [24, 24],
        }),
        alt: label,
        title: label,
      })
        .bindPopup(label)
        .addTo(map);
    const combined = route.closureMeters <= 15;
    endpoints(route.start, combined ? "Start & finish" : "Start", "#17604d");
    if (!combined) endpoints(route.end, "Finish", "#96374a");
    // Draw directly from the ordered profile until (or if) the GeoJSON loads.
    const fallback = L.polyline(
      route.profile.map((segment) => segment.map(([, , lon, lat]) => [lat, lon] as L.LatLngTuple)),
      { color: "#96374a", weight: 5 },
    ).addTo(map);
    readGeoJson<TrailGeometry>(route.geoJson, controller.signal)
      .then((geometry) => {
        map.removeLayer(fallback);
        L.geoJSON(geometry, { style: { color: "#96374a", weight: 5, opacity: 1 } }).addTo(map);
        pointer.current?.bringToFront();
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapFailed(true);
      });
    readGeoJson<TrailGeometry>(route.waypoints, controller.signal)
      .then((waypoints) =>
        L.geoJSON(waypoints, {
          pointToLayer(feature, position) {
            const name = String(feature.properties.name);
            const label = document.createElement("span");
            label.textContent = name;
            return L.marker(position, {
              icon: L.divIcon({
                className: "trail-pin trail-pin--waypoint",
                html: "<span>★</span>",
                iconSize: [26, 26],
              }),
              alt: name,
              title: name,
            }).bindPopup(label);
          },
        }).addTo(map),
      )
      .catch(() => {
        if (!controller.signal.aborted) setMapFailed(true);
      });

    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(container.current);
    return () => {
      controller.abort();
      resize.disconnect();
      map.remove();
      leaflet.current = null;
      pointer.current = null;
    };
  }, [east, north, route, south, west]);

  useEffect(() => {
    const map = leaflet.current;
    if (!map) return;
    for (const handler of [map.dragging, map.touchZoom, map.doubleClickZoom]) {
      if (interactive) handler.enable();
      else handler.disable();
    }
  }, [interactive]);

  useEffect(() => {
    const map = leaflet.current;
    if (!map || !selected) return;
    const [, , lon, lat] = selected;
    if (pointer.current) pointer.current.setLatLng([lat, lon]);
    else
      pointer.current = L.circleMarker([lat, lon], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#17604d",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
  }, [selected]);

  return (
    <section className={`paper-card trail-explorer ${expanded ? "trail-explorer--expanded" : ""}`}>
      <h2>Trail map</h2>
      <p>Explore the planned route before your hike.</p>
      <div className="trail-map-controls">
        <button className="button button--secondary" onClick={() => setInteractive(!interactive)}>
          {interactive ? "Done moving map" : "Move map"}
        </button>
        <button
          className="button button--secondary"
          onClick={() => leaflet.current?.fitBounds(bounds, { padding: [34, 34], maxZoom: 17 })}
        >
          Show whole trail
        </button>
        <button
          className="button button--secondary"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Shrink map" : "Expand map"}
        </button>
      </div>
      <div ref={container} className="trail-map" aria-label={`Planned route for ${hike.name}`} />
      {(tilesMissing || mapFailed) && (
        <p role="status">
          {tilesMissing
            ? "Background map unavailable. You can still explore the trail."
            : "Some trail map details could not load."}
        </p>
      )}
      <p className="trail-map-credit">Planned route from an AllTrails GPX export.</p>
      {download && (
        <a className="text-link" href={routeAsset(route.gpx)} download>
          Download GPX
        </a>
      )}
      <ElevationProfile
        hike={hike}
        segments={route.profile}
        selected={selected}
        selectedDistance={selectedDistance}
        miles={endMiles}
        onSelect={setSelectedDistance}
      />
    </section>
  );
}

function ElevationProfile({
  hike,
  segments,
  miles,
  selected,
  selectedDistance,
  onSelect,
}: {
  hike: AdventureDefinition;
  segments: ProfilePoint[][];
  miles: number;
  selected?: ProfilePoint;
  selectedDistance?: number;
  onSelect: (miles: number) => void;
}) {
  const min = hike.minElevationFeet;
  const max = hike.maxElevationFeet;
  const x = (distance: number) => (distance / miles) * 600;
  const y = (height: number) => 130 - ((height - min) / Math.max(1, max - min)) * 120;
  const selectAtPointer = (event: PointerEvent<SVGSVGElement>) => {
    const area = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - area.left) / area.width));
    onSelect(fraction * miles);
  };
  return (
    <div className="trail-profile">
      <h2>How the trail climbs</h2>
      <dl className="trail-profile-facts">
        <div>
          <dt>Estimated climb</dt>
          <dd>{Math.round(hike.elevationGainFeet)} ft</dd>
        </div>
        <div>
          <dt>Highest point</dt>
          <dd>{Math.round(max)} ft</dd>
        </div>
        <div>
          <dt>Lowest point</dt>
          <dd>{Math.round(min)} ft</dd>
        </div>
      </dl>
      <svg
        viewBox="0 0 600 140"
        preserveAspectRatio="none"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          selectAtPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) selectAtPointer(event);
        }}
      >
        {segments.map((points, index) => (
          <polyline
            key={index}
            vectorEffect="non-scaling-stroke"
            points={points.map(([mi, ft]) => `${x(mi)},${y(ft)}`).join(" ")}
          />
        ))}
        {selected && (
          <line
            x1={x(selected[0])}
            x2={x(selected[0])}
            y1={0}
            y2={140}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <div className="trail-profile-axis">
        <span>0 mi</span>
        <span>{miles.toFixed(2)} mi</span>
      </div>
      <label>
        Point on the trail
        <input
          type="range"
          min={0}
          max={miles}
          step="any"
          value={selectedDistance ?? 0}
          aria-valuetext={
            selected
              ? `${selected[0].toFixed(2)} miles, ${Math.round(selected[1])} feet`
              : "Trail start"
          }
          onChange={(event) => onSelect(Number(event.target.value))}
        />
      </label>
      {selected && (
        <p>
          {selected[0].toFixed(2)} mi along the trail · {Math.round(selected[1])} ft elevation
        </p>
      )}
    </div>
  );
}
