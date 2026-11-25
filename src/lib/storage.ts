import { challenge, type Challenge } from "../data/hikes";
import { isCalendarDate } from "./season";
import type { AdventureRecord, Discovery, Feeling, StorageEnvelope, Weather } from "../types";

const storageKey = (year: number) => `snally.christmas-hikes.${year}`;
export const STORAGE_KEY = storageKey(challenge.year);
export const SCHEMA_VERSION = 1 as const;

const feelings: Feeling[] = ["amazing", "happy", "proud", "tired", "challenged"];
const weatherValues: Weather[] = ["sunny", "cloudy", "windy", "rainy", "snowy", "cold"];
const discoveryValues: Discovery[] = [
  "wildlife",
  "animal_tracks",
  "beautiful_view",
  "history",
  "water",
  "rocks",
  "mysterious",
  "unexpected",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || (typeof value === "string" && value.length <= 5000);
const isTimeString = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const isIsoString = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));
const isFiniteInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

export function validateRecord(value: unknown, edition = challenge): value is AdventureRecord {
  if (!isObject(value)) return false;
  const validHikeId =
    typeof value.hikeId === "number" && edition.hikes.some((hike) => hike.id === value.hikeId);
  const validArrays =
    Array.isArray(value.weather) &&
    value.weather.every((item) => weatherValues.includes(item as Weather)) &&
    Array.isArray(value.discoveries) &&
    value.discoveries.every((item) => discoveryValues.includes(item as Discovery));
  return Boolean(
    validHikeId &&
    typeof value.completed === "boolean" &&
    validArrays &&
    typeof value.passportStampCollected === "boolean" &&
    (value.juniorRangerBadgeEarned === undefined ||
      typeof value.juniorRangerBadgeEarned === "boolean") &&
    typeof value.completedEntireHike === "boolean" &&
    (value.spottedFourSquirrels === undefined || typeof value.spottedFourSquirrels === "boolean") &&
    (value.secondMissionCompleted === undefined ||
      typeof value.secondMissionCompleted === "boolean") &&
    (value.missionCompleted === undefined || typeof value.missionCompleted === "boolean") &&
    (value.plannedDate === undefined || isCalendarDate(value.plannedDate)) &&
    (value.completedDate === undefined || isCalendarDate(value.completedDate)) &&
    (value.startTime === undefined || isTimeString(value.startTime)) &&
    (value.endTime === undefined || isTimeString(value.endTime)) &&
    (value.actualDistanceMiles === undefined ||
      isFiniteInRange(value.actualDistanceMiles, 0, 100)) &&
    (value.durationMinutes === undefined || isFiniteInRange(value.durationMinutes, 0, 1440)) &&
    (value.temperatureF === undefined || isFiniteInRange(value.temperatureF, -100, 150)) &&
    (value.feeling === undefined || feelings.includes(value.feeling as Feeling)) &&
    (value.rating === undefined ||
      (Number.isInteger(value.rating) && isFiniteInRange(value.rating, 1, 5))) &&
    isOptionalString(value.favoritePart) &&
    isOptionalString(value.biggestSurprise) &&
    (value.wouldHikeAgain === undefined || typeof value.wouldHikeAgain === "boolean") &&
    isOptionalString(value.notes) &&
    isIsoString(value.createdAt) &&
    isIsoString(value.updatedAt),
  );
}

export function parseBackup(value: unknown, edition: Challenge = challenge): StorageEnvelope {
  if (!isObject(value)) throw new Error("This file is not a Six Hikes backup.");
  if (value.schemaVersion !== SCHEMA_VERSION)
    throw new Error("This backup uses an unsupported format.");
  if (value.challengeYear !== edition.year)
    throw new Error("This backup belongs to a different challenge year.");
  if (
    !Array.isArray(value.records) ||
    !value.records.every((record) => validateRecord(record, edition))
  ) {
    throw new Error("Some adventure records are missing or invalid.");
  }
  const ids = value.records.map((record) => record.hikeId);
  if (new Set(ids).size !== ids.length)
    throw new Error("This backup contains duplicate adventures.");
  return { schemaVersion: SCHEMA_VERSION, challengeYear: edition.year, records: value.records };
}

export function loadRecords(edition = challenge): { records: AdventureRecord[]; warning?: string } {
  try {
    const raw = localStorage.getItem(storageKey(edition.year));
    if (!raw) return { records: [] };
    return { records: parseBackup(JSON.parse(raw), edition).records };
  } catch {
    return {
      records: [],
      warning: "Saved adventure data could not be read, so it was left untouched.",
    };
  }
}

export function saveRecords(records: AdventureRecord[], edition = challenge): void {
  const envelope: StorageEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    challengeYear: edition.year,
    records,
  };
  const validated = parseBackup(envelope, edition);
  try {
    localStorage.setItem(storageKey(edition.year), JSON.stringify(validated));
  } catch {
    throw new Error(
      "This device could not save your adventure. Check that browser storage is available and has space.",
    );
  }
}

export function createExport(records: AdventureRecord[], edition = challenge): string {
  const envelope: StorageEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    challengeYear: edition.year,
    exportedAt: new Date().toISOString(),
    records,
  };
  return JSON.stringify(envelope, null, 2);
}

export function calculateDuration(startTime?: string, endTime?: string): number | undefined {
  if (!startTime || !endTime || !isTimeString(startTime) || !isTimeString(endTime))
    return undefined;
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const start = startHours * 60 + startMinutes;
  const end = endHours * 60 + endMinutes;
  return end >= start ? end - start : end + 1440 - start;
}

export const formatDuration = (minutes?: number) => {
  if (minutes === undefined) return "";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

export const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(
        date,
      );
};
