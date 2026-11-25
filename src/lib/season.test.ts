import { describe, expect, it } from "vite-plus/test";
import { challenge } from "../data/hikes";
import type { AdventureRecord } from "../types";
import { challengeDate, seasonStatus } from "./season";

const records = challenge.hikes.map<AdventureRecord>((hike, index) => ({
  hikeId: hike.id,
  completed: true,
  completedDate: index === 0 ? "2026-11-26" : "2026-12-31",
  actualDistanceMiles: 2,
  weather: [],
  discoveries: [],
  passportStampCollected: index === 0,
  juniorRangerBadgeEarned: false,
  completedEntireHike: true,
  createdAt: "2027-01-08T23:00:00Z",
  updatedAt: "2027-01-08T23:00:00Z",
}));

describe("winter challenge calendar", () => {
  it.each([
    ["2026-11-25", "before", 1, 0],
    ["2026-11-26", "open", 0, 36],
    ["2026-12-01", "open", 0, 31],
    ["2026-12-31", "final", 0, 1],
    ["2027-01-01", "after", 0, 0],
  ])("reports %s as %s", (day, phase, daysUntil, daysRemaining) => {
    expect(seasonStatus(challenge, [], day)).toMatchObject({ phase, daysUntil, daysRemaining });
  });

  it("uses the Eastern calendar across UTC midnight and New Year’s", () => {
    expect(challengeDate(challenge.timeZone, new Date("2026-11-26T04:59:59Z"))).toBe("2026-11-25");
    expect(challengeDate(challenge.timeZone, new Date("2026-11-26T05:00:00Z"))).toBe("2026-11-26");
    expect(challengeDate(challenge.timeZone, new Date("2027-01-01T04:59:59Z"))).toBe("2026-12-31");
    expect(challengeDate(challenge.timeZone, new Date("2027-01-01T05:00:00Z"))).toBe("2027-01-01");
  });

  it("works across calendar years and accepts the dates and goal of another edition", () => {
    const future = {
      ...challenge,
      year: 2027,
      startDate: "2027-12-30",
      endDate: "2028-01-02",
      goal: 2,
    };
    expect(seasonStatus(future, [], "2027-12-31")).toMatchObject({
      phase: "open",
      daysRemaining: 3,
    });
  });

  it("awards retrospective on-time hikes using the most recent hike date", () => {
    expect(seasonStatus(challenge, records, "2027-01-08")).toMatchObject({
      phase: "master",
      master: { date: "2026-12-31", stats: { adventures: 6, miles: 12, stamps: 1 } },
    });
  });

  it("uses planned miles for completed hikes with no journal distance", () => {
    const first = { ...records[0], actualDistanceMiles: undefined };
    const second = { ...records[1], actualDistanceMiles: 0 };
    const { stats, remainingMiles } = seasonStatus(challenge, [first, second], "2026-12-31");
    expect(stats.miles).toBe(challenge.hikes[0].distanceMiles);
    expect(stats.plannedMiles).toBe(stats.miles);
    expect(stats.actualMiles).toBe(0);
    expect(remainingMiles).toBe(
      challenge.hikes.slice(2).reduce((sum, hike) => sum + hike.distanceMiles, 0),
    );
  });

  it.each(["2026-11-25", "2027-01-01", "2026-11-31", undefined])(
    "keeps the individual patches when one date is %s and withholds the master",
    (date) => {
      const changed = [{ ...records[0], completedDate: date }, ...records.slice(1)];
      const summary = seasonStatus(challenge, changed, "2027-01-08");
      expect(summary.master).toBeUndefined();
      expect(summary.stats.adventures).toBe(6);
    },
  );

  it("requires distinct hikes and dates that have already occurred", () => {
    expect(
      seasonStatus(challenge, [records[0], ...records.slice(0, 5)], "2027-01-08").master,
    ).toBeUndefined();
    expect(seasonStatus(challenge, records, "2026-12-30").master).toBeUndefined();
  });
});
