import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { challenge, editions, type Challenge } from "../data/hikes";
import { challengeDate } from "../lib/season";
import { loadRecords, saveRecords } from "../lib/storage";
import type { AdventureRecord } from "../types";

interface RecordsContextValue {
  records: AdventureRecord[];
  edition: Challenge;
  today: string;
  selectYear: (year: number) => void;
  warning?: string;
  error?: string;
  celebrationHikeId?: number;
  getRecord: (hikeId: number) => AdventureRecord | undefined;
  upsertRecord: (record: AdventureRecord, celebrate?: boolean) => boolean;
  replaceRecords: (records: AdventureRecord[]) => boolean;
  resetRecords: () => boolean;
  clearCelebration: () => void;
  clearMessage: () => void;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [edition, setEdition] = useState(() => {
    try {
      const year = Number(localStorage.getItem("snally.christmas-hikes.edition"));
      return editions.find((item) => item.year === year) ?? challenge;
    } catch {
      return challenge;
    }
  });

  const selectYear = (year: number) => {
    const selected = editions.find((item) => item.year === year);
    if (!selected) return;
    setEdition(selected);
    try {
      localStorage.setItem("snally.christmas-hikes.edition", String(year));
    } catch {
      // The current selection remains usable when preferences cannot be persisted.
    }
  };

  return (
    <EditionRecords key={edition.year} edition={edition} selectYear={selectYear}>
      {children}
    </EditionRecords>
  );
}

function EditionRecords({
  children,
  edition,
  selectYear,
}: {
  children: ReactNode;
  edition: Challenge;
  selectYear: RecordsContextValue["selectYear"];
}) {
  const [initial] = useState(() => loadRecords(edition));
  const [today, setToday] = useState(() => challengeDate(edition.timeZone));

  useEffect(() => {
    const refresh = () => setToday(challengeDate(edition.timeZone));
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [edition.timeZone]);
  const [records, setRecords] = useState(initial.records);
  const [warning, setWarning] = useState(initial.warning);
  const [error, setError] = useState<string>();
  const [celebrationHikeId, setCelebrationHikeId] = useState<number>();

  const commit = (next: AdventureRecord[]) => {
    try {
      saveRecords(next, edition);
      setRecords(next);
      setError(undefined);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your adventure could not be saved.");
      return false;
    }
  };

  const value: RecordsContextValue = {
    records,
    edition,
    today,
    selectYear,
    warning,
    error,
    celebrationHikeId,
    getRecord: (hikeId) => records.find((record) => record.hikeId === hikeId),
    upsertRecord: (record, celebrate = false) => {
      const next = [...records.filter((item) => item.hikeId !== record.hikeId), record].sort(
        (a, b) => a.hikeId - b.hikeId,
      );
      const saved = commit(next);
      if (saved && celebrate) setCelebrationHikeId(record.hikeId);
      return saved;
    },
    replaceRecords: commit,
    resetRecords: () => commit([]),
    clearCelebration: () => setCelebrationHikeId(undefined),
    clearMessage: () => {
      setWarning(undefined);
      setError(undefined);
    },
  };

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const context = useContext(RecordsContext);
  if (!context) throw new Error("useRecords must be used inside RecordsProvider");
  return context;
}
