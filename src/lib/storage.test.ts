import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  calculateDuration,
  createExport,
  loadRecords,
  parseBackup,
  saveRecords,
  STORAGE_KEY,
} from "./storage";
import type { AdventureRecord } from "../types";

const record: AdventureRecord = {
  hikeId: 1,
  completed: true,
  completedDate: "2026-12-01",
  actualDistanceMiles: 2.2,
  weather: ["sunny"],
  discoveries: ["beautiful_view"],
  passportStampCollected: true,
  juniorRangerBadgeEarned: false,
  completedEntireHike: true,
  createdAt: "2026-12-01T17:00:00.000Z",
  updatedAt: "2026-12-01T17:00:00.000Z",
};

beforeEach(() => localStorage.clear());

describe("local adventure storage", () => {
  it("round-trips a valid completed hike", () => {
    saveRecords([record]);
    expect(loadRecords().records).toEqual([record]);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"challengeYear":2026');
  });

  it("rejects invalid and duplicate backup records", () => {
    const valid = JSON.parse(createExport([record]));
    expect(() => parseBackup({ ...valid, records: [{ ...record, rating: 9 }] })).toThrow(
      /invalid/i,
    );
    expect(() => parseBackup({ ...valid, records: [record, record] })).toThrow(/duplicate/i);
  });

  it("does not trust malformed stored data", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const result = loadRecords();
    expect(result.records).toEqual([]);
    expect(result.warning).toBeTruthy();
  });
});

describe("duration calculation", () => {
  it("calculates same-day and overnight durations", () => {
    expect(calculateDuration("09:30", "12:00")).toBe(150);
    expect(calculateDuration("23:45", "00:15")).toBe(30);
    expect(calculateDuration(undefined, "12:00")).toBeUndefined();
  });
});
