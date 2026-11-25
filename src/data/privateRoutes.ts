import { useEffect, useState } from "react";
import { assetUrl } from "./hikes";
import type { AdventureDefinition } from "../types";

const privateMode = import.meta.env.MODE === "private";
export const routeAsset = (filename: string) => assetUrl(`routes/${filename}`);
export type ProfilePoint = [miles: number, feet: number, longitude: number, latitude: number];

export interface TrailRoute {
  start: [number, number, number];
  end: [number, number, number];
  closureMeters: number;
  bbox: [number, number, number, number];
  gpx: string;
  geoJson: string;
  waypoints: string;
  profile: ProfilePoint[][];
}

interface RouteSettings {
  collectionUrl?: string;
  allowGpxDownload?: boolean;
}

export function usePrivateRouteData<T>(filename: string) {
  const [result, setResult] = useState<{ data?: T; failed?: boolean }>({});
  useEffect(() => {
    if (!privateMode) return;
    const controller = new AbortController();
    fetch(routeAsset(filename), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Route asset unavailable");
        return response.json() as Promise<T>;
      })
      .then((data) => setResult({ data }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ failed: true });
      });
    return () => controller.abort();
  }, [filename]);
  return result;
}

export const useRouteSettings = () => usePrivateRouteData<RouteSettings>("settings.json").data;
export const useTrailRoute = (hike: AdventureDefinition | undefined) =>
  usePrivateRouteData<TrailRoute>(`${String(hike?.id).padStart(2, "0")}-${hike?.slug}.json`);

export function allTrailsUrl(value?: string) {
  return value &&
    /^https:\/\/www\.alltrails\.com\/explore\/(trail|custom-routes|list)\//.test(value)
    ? value
    : undefined;
}
