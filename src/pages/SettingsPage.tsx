import {
  ArrowLeft,
  Download,
  FileJson,
  HardDrive,
  Printer,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { useRecords } from "../context/RecordsContext";
import { createExport, parseBackup } from "../lib/storage";

export function SettingsPage() {
  const { records, replaceRecords, resetRecords } = useRecords();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([createExport(records)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `six-hikes-of-christmas-2026-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
    setError("");
  };

  const importData = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("That backup is too large.");
      const parsed: unknown = JSON.parse(await file.text());
      const backup = parseBackup(parsed);
      if (!replaceRecords(backup.records))
        throw new Error("The backup could not be saved on this device.");
      setMessage(
        `Imported ${backup.records.length} adventure record${backup.records.length === 1 ? "" : "s"}.`,
      );
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That backup could not be imported.");
      setMessage("");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const printJournal = () => {
    window.location.hash = "journal";
    window.setTimeout(() => window.print(), 250);
  };

  const reset = () => {
    if (resetRecords()) {
      setConfirmingReset(false);
      setMessage("All local progress has been reset.");
      setError("");
    }
  };

  return (
    <div className="page settings-page">
      <a href="#adventures" className="back-link">
        <ArrowLeft size={19} /> Back to adventures
      </a>
      <header className="page-heading">
        <span className="eyebrow">Your trail kit</span>
        <h1>Settings & Backups</h1>
        <p>Keep your local adventure journal safe.</p>
      </header>
      <section className="privacy-banner">
        <ShieldCheck />
        <div>
          <h2>Private by design</h2>
          <p>
            Dates, journal entries and achievements stay in this browser’s local storage. They are
            never sent to a server.
          </p>
        </div>
      </section>
      {(message || error) && (
        <div className={`settings-message ${error ? "is-error" : ""}`} role="status">
          {error || message}
        </div>
      )}
      <div className="settings-list">
        <section>
          <div className="settings-icon">
            <Download />
          </div>
          <div>
            <h2>Export a backup</h2>
            <p>Download all 2026 adventure records as a JSON file.</p>
          </div>
          <button className="button button--secondary" onClick={exportData}>
            <FileJson /> Export JSON
          </button>
        </section>
        <section>
          <div className="settings-icon">
            <Upload />
          </div>
          <div>
            <h2>Import a backup</h2>
            <p>Validate and replace this device’s records with a previous export.</p>
          </div>
          <input
            ref={inputRef}
            className="visually-hidden"
            id="backup-file"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importData(event.target.files?.[0])}
          />
          <label className="button button--secondary" htmlFor="backup-file">
            <Upload /> Choose file
          </label>
        </section>
        <section>
          <div className="settings-icon">
            <Printer />
          </div>
          <div>
            <h2>Print your journal</h2>
            <p>Use the browser print dialog to print or save a PDF keepsake.</p>
          </div>
          <button className="button button--secondary" onClick={printJournal}>
            <Printer /> Print journal
          </button>
        </section>
      </div>
      <section className="storage-note">
        <HardDrive />
        <p>
          <strong>
            {records.length} local record{records.length === 1 ? "" : "s"}
          </strong>
          <br />
          Removing browser data or using a different device will not carry your records over. Export
          a backup first.
        </p>
      </section>
      <section className="danger-zone">
        <div>
          <h2>Reset local progress</h2>
          <p>Erase every plan, completed hike and journal entry from this browser.</p>
        </div>
        {confirmingReset ? (
          <div className="confirm-reset">
            <span>Are you absolutely sure?</span>
            <button className="button button--danger" onClick={reset}>
              Yes, erase everything
            </button>
            <button className="button button--quiet" onClick={() => setConfirmingReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="button button--danger-outline"
            onClick={() => setConfirmingReset(true)}
          >
            <RotateCcw /> Reset progress
          </button>
        )}
      </section>
    </div>
  );
}
