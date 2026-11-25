export type Difficulty = "easy" | "moderate" | "hard";
export type RouteType = "loop" | "out_and_back" | "combined";
export type Feeling = "amazing" | "happy" | "proud" | "tired" | "challenged";
export type Weather = "sunny" | "cloudy" | "windy" | "rainy" | "snowy" | "cold";
export type Discovery =
  | "wildlife"
  | "animal_tracks"
  | "beautiful_view"
  | "history"
  | "water"
  | "rocks"
  | "mysterious"
  | "unexpected";

export interface AdventureDefinition {
  id: number;
  slug: string;
  name: string;
  park: string;
  parkCode: string;
  parkUrl: string;
  address: string;
  trailhead: {
    name: string;
    coordinates: { latitude: number; longitude: number };
    coordinateAccuracy: "approximate" | "exact";
  };
  description: string;
  distanceMiles: number;
  distanceEstimated: boolean;
  elevationGainFeet: number;
  elevationLossFeet: number;
  minElevationFeet: number;
  maxElevationFeet: number;
  durationMinutes: number;
  allTrailsRouteType: "verified" | "custom";
  difficulty: Difficulty;
  routeType: RouteType;
  returnsToStart: boolean;
  mission: string;
  secondMission: string;
  highlights: string[];
  routeNotes: string;
  trailUrl: string;
  allTrails?: { url: string; embedUrl?: string };
  passportStamp: { name: string; address: string; url: string };
  badge: { name: string; unlockedImage: string; lockedImage: string };
}

export interface AdventureRecord {
  hikeId: number;
  plannedDate?: string;
  completed: boolean;
  completedDate?: string;
  startTime?: string;
  endTime?: string;
  actualDistanceMiles?: number;
  durationMinutes?: number;
  temperatureF?: number;
  feeling?: Feeling;
  rating?: number;
  weather: Weather[];
  discoveries: Discovery[];
  passportStampCollected: boolean;
  juniorRangerBadgeEarned?: boolean;
  missionCompleted?: boolean;
  secondMissionCompleted?: boolean;
  spottedFourSquirrels?: boolean;
  completedEntireHike: boolean;
  favoritePart?: string;
  biggestSurprise?: string;
  wouldHikeAgain?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageEnvelope {
  schemaVersion: 1;
  challengeYear: number;
  exportedAt?: string;
  records: AdventureRecord[];
}
