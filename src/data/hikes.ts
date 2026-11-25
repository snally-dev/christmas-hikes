import edition2026 from "./2026.json";
import type { AdventureDefinition } from "../types";

export interface Challenge {
  title: string;
  year: number;
  timeZone: string;
  startLabel?: string;
  startDate: string;
  endDate: string;
  goal: number;
  targetMiles: number;
  allTrailsCollectionUrl?: string;
  completionBadge: AdventureDefinition["badge"];
  hikes: AdventureDefinition[];
}

export const editions = [edition2026 as Challenge].sort((a, b) => b.year - a.year);
export const challenge = editions[0];
export const hikes = challenge.hikes;
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const badgeUrl = (filename: string) => assetUrl(`badges/${filename}`);
export const directionsUrl = (hike: AdventureDefinition) =>
  `https://maps.apple.com/?dirflg=d&daddr=${hike.trailhead.coordinates.latitude},${hike.trailhead.coordinates.longitude}`;
