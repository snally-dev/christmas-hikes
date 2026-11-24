import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { loadRecords, saveRecords } from "../lib/storage";
import type { AdventureRecord } from "../types";

interface RecordsContextValue {
  records: AdventureRecord[];
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
  const initial = useMemo(loadRecords, []);
  const [records, setRecords] = useState(initial.records);
  const [warning, setWarning] = useState(initial.warning);
  const [error, setError] = useState<string>();
  const [celebrationHikeId, setCelebrationHikeId] = useState<number>();

  const commit = (next: AdventureRecord[]) => {
    try {
      saveRecords(next);
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
