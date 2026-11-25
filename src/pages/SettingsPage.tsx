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
import type { StorageEnvelope } from "../types";
import { createExport, parseBackup } from "../lib/storage";

export function SettingsPage() {
  const { records, edition, replaceRecords, resetRecords } = useRecords();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [readingBackup, setReadingBackup] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<StorageEnvelope>();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([createExport(records, edition)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `six-hikes-of-christmas-${edition.year}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setMessage("Backup downloaded.");
    setError("");
  };

  const importData = async (file?: File) => {
    if (!file) return;
    setReadingBackup(true);
    setPendingBackup(undefined);
    try {
      if (file.size > 2_000_000) throw new Error("That backup is too large.");
      const parsed: unknown = JSON.parse(await file.text());
      setPendingBackup(parseBackup(parsed, edition));
      setMessage("");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That backup could not be imported.");
      setMessage("");
    } finally {
      setReadingBackup(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const restoreBackup = () => {
    if (!pendingBackup || !replaceRecords(pendingBackup.records)) return;
    const count = pendingBackup.records.length;
    setPendingBackup(undefined);
    setMessage(`Imported ${count} adventure record${count === 1 ? "" : "s"}.`);
    setError("");
  };

  const reset = () => {
    if (resetRecords()) {
      setConfirmingReset(false);
      setMessage("This edition’s local progress has been reset.");
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
            <p>Download all {edition.year} adventure records as a JSON file.</p>
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
            <p>Restore the {edition.year} journal from a previous export.</p>
          </div>
          <input
            ref={inputRef}
            className="visually-hidden"
            id="backup-file"
            tabIndex={-1}
            aria-label="Backup JSON file"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importData(event.target.files?.[0])}
          />
          <button
            className="button button--secondary"
            disabled={readingBackup}
            onClick={() => inputRef.current?.click()}
          >
            <Upload /> Choose file
          </button>
        </section>
        {pendingBackup && (
          <section aria-labelledby="restore-title">
            <div className="settings-icon">
              <FileJson />
            </div>
            <div>
              <h2 id="restore-title">Restore {edition.year} records?</h2>
              <p>
                Replace this edition’s local journal with {pendingBackup.records.length} record
                {pendingBackup.records.length === 1 ? "" : "s"} from the backup.
              </p>
            </div>
            <div className="settings-actions">
              <button className="button button--primary" onClick={restoreBackup}>
                Restore backup
              </button>
              <button className="button button--quiet" onClick={() => setPendingBackup(undefined)}>
                Cancel
              </button>
            </div>
          </section>
        )}
        <section>
          <div className="settings-icon">
            <Printer />
          </div>
          <div>
            <h2>Print your journal</h2>
            <p>Use the browser print dialog to print or save a PDF keepsake.</p>
          </div>
          <a className="button button--secondary" href="#journal">
            <Printer /> Open journal
          </a>
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
          <p>
            Erase every plan, completed hike and journal entry for {edition.year} from this browser.
          </p>
        </div>
        {confirmingReset ? (
          <div className="confirm-reset">
            <span>Are you absolutely sure?</span>
            <button className="button button--danger" onClick={reset}>
              Yes, erase this edition
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
