import type { Challenge } from "../data/hikes";
import type { AdventureRecord } from "../types";

const DAY_MS = 86_400_000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS;

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function challengeDate(timeZone: string, instant = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function summarize(records: readonly AdventureRecord[], hikes: Challenge["hikes"]) {
  const actualMiles = records.reduce((sum, record) => sum + (record.actualDistanceMiles ?? 0), 0);
  const plannedMiles = records.reduce(
    (sum, record) =>
      sum +
      (record.actualDistanceMiles === undefined
        ? (hikes.find((hike) => hike.id === record.hikeId)?.distanceMiles ?? 0)
        : 0),
    0,
  );
  return {
    adventures: records.length,
    miles: actualMiles + plannedMiles,
    actualMiles,
    plannedMiles,
    stamps: records.filter((record) => record.passportStampCollected).length,
  };
}

export function seasonStatus(
  edition: Challenge,
  records: readonly AdventureRecord[],
  today: string,
) {
  const { startDate, endDate, goal, hikes } = edition;
  const completed = hikes.flatMap((hike) => {
    const record = records.find((item) => item.hikeId === hike.id && item.completed);
    return record ? [record] : [];
  });
  const eligible = completed.filter(
    ({ completedDate }) =>
      isCalendarDate(completedDate) &&
      completedDate >= startDate &&
      completedDate <= endDate &&
      completedDate <= today,
  );
  const master =
    eligible.length >= goal
      ? {
          date: eligible.map((record) => record.completedDate!).sort()[goal - 1],
          stats: summarize(eligible, hikes),
        }
      : undefined;

  return {
    phase: master
      ? "master"
      : today < startDate
        ? "before"
        : today > endDate
          ? "after"
          : today === endDate
            ? "final"
            : "open",
    daysUntil: Math.max(0, dayNumber(startDate) - dayNumber(today)),
    daysRemaining: today < startDate ? 0 : Math.max(0, dayNumber(endDate) - dayNumber(today) + 1),
    stats: summarize(completed, hikes),
    remainingMiles: hikes.reduce(
      (sum, hike) =>
        sum + (completed.some((record) => record.hikeId === hike.id) ? 0 : hike.distanceMiles),
      0,
    ),
    master,
  } as const;
}
