import { ArrowLeft, Award, Check, Clock3, Save, Star } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { BadgeImage } from "../components/BadgeImage";
import { useRecords } from "../context/RecordsContext";
import { discoveryOptions, feelingOptions, weatherOptions } from "../lib/labels";
import { calculateDuration, formatDuration } from "../lib/storage";
import { isCalendarDate } from "../lib/season";
import type { AdventureRecord, Discovery, Feeling, Weather } from "../types";

interface FormState {
  completedDate: string;
  startTime: string;
  endTime: string;
  actualDistanceMiles: string;
  temperatureF: string;
  feeling?: Feeling;
  rating?: number;
  weather: Weather[];
  discoveries: Discovery[];
  passportStampCollected: boolean;
  completedEntireHike: boolean;
  missionCompleted: boolean;
  secondMissionCompleted: boolean;
  spottedFourSquirrels: boolean;
  favoritePart: string;
  biggestSurprise: string;
  wouldHikeAgain?: boolean;
  notes: string;
}

export function RecordPage({ slug }: { slug: string }) {
  const { edition, today, getRecord, upsertRecord } = useRecords();
  const hike = edition.hikes.find((item) => item.slug === slug);
  const existing = hike ? getRecord(hike.id) : undefined;
  const [validationError, setValidationError] = useState("");
  const [state, setState] = useState<FormState>(() => ({
    completedDate: existing?.completedDate ?? today,
    startTime: existing?.startTime ?? "",
    endTime: existing?.endTime ?? "",
    actualDistanceMiles: String(existing?.actualDistanceMiles ?? ""),
    temperatureF: existing?.temperatureF === undefined ? "" : String(existing.temperatureF),
    feeling: existing?.feeling,
    rating: existing?.rating,
    weather: existing?.weather ?? [],
    discoveries: existing?.discoveries ?? [],
    passportStampCollected: existing?.passportStampCollected ?? false,
    completedEntireHike: existing?.completedEntireHike ?? false,
    missionCompleted: existing?.missionCompleted ?? false,
    secondMissionCompleted: existing?.secondMissionCompleted ?? false,
    spottedFourSquirrels: existing?.spottedFourSquirrels ?? false,
    favoritePart: existing?.favoritePart ?? "",
    biggestSurprise: existing?.biggestSurprise ?? "",
    wouldHikeAgain: existing?.wouldHikeAgain,
    notes: existing?.notes ?? "",
  }));
  const duration = useMemo(
    () => calculateDuration(state.startTime || undefined, state.endTime || undefined),
    [state.startTime, state.endTime],
  );

  if (!hike)
    return (
      <div className="page empty-state">
        <h1>Adventure not found</h1>
        <a href="#adventures">Return to adventures</a>
      </div>
    );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((current) => ({ ...current, [key]: value }));
  const toggleArray = <T,>(key: "weather" | "discoveries", value: T) => {
    const current = state[key] as T[];
    setField(
      key,
      (current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]) as FormState[typeof key],
    );
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const distance = state.actualDistanceMiles.trim()
      ? Number(state.actualDistanceMiles)
      : undefined;
    const temperature = state.temperatureF === "" ? undefined : Number(state.temperatureF);
    if (!isCalendarDate(state.completedDate) || state.completedDate > today)
      return setValidationError("Choose the date you completed this adventure.");
    if (distance !== undefined && (!Number.isFinite(distance) || distance < 0 || distance > 100))
      return setValidationError("Enter an actual distance between 0 and 100 miles.");
    if (
      temperature !== undefined &&
      (!Number.isFinite(temperature) || temperature < -100 || temperature > 150)
    )
      return setValidationError("Enter a temperature between −100 and 150 °F.");

    const now = new Date().toISOString();
    const record: AdventureRecord = {
      ...existing,
      hikeId: hike.id,
      plannedDate: existing?.plannedDate,
      completed: true,
      completedDate: state.completedDate,
      startTime: state.startTime || undefined,
      endTime: state.endTime || undefined,
      actualDistanceMiles: distance,
      durationMinutes: duration,
      temperatureF: temperature,
      feeling: state.feeling,
      rating: state.rating,
      weather: state.weather,
      discoveries: state.discoveries,
      passportStampCollected: state.passportStampCollected,
      completedEntireHike: state.completedEntireHike,
      missionCompleted: state.missionCompleted,
      secondMissionCompleted: state.secondMissionCompleted,
      spottedFourSquirrels: state.spottedFourSquirrels,
      favoritePart: state.favoritePart.trim() || undefined,
      biggestSurprise: state.biggestSurprise.trim() || undefined,
      wouldHikeAgain: state.wouldHikeAgain,
      notes: state.notes.trim() || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const saved = upsertRecord(record, !existing?.completed);
    if (saved) window.location.hash = `adventure/${hike.slug}`;
  };

  return (
    <div className="page record-page">
      <a href={`#adventure/${hike.slug}`} className="back-link">
        <ArrowLeft size={19} /> Back to adventure
      </a>
      <header className="record-heading">
        <BadgeImage
          hike={hike}
          earned={Boolean(existing?.completed)}
          size="small"
          showStatus={false}
          priority
        />
        <div>
          <span className="eyebrow">
            {existing?.completed ? "Edit your keepsake" : "Trail journal"}
          </span>
          <h1>{hike.name}</h1>
          <p>Capture as much—or as little—as you like.</p>
        </div>
      </header>

      <form onSubmit={save}>
        <JournalSection
          number="01"
          title="Adventure details"
          subtitle="The essentials for your trail story."
        >
          <div className="field-grid field-grid--three">
            <label>
              <span>
                Date completed <em>required</em>
              </span>
              <input
                type="date"
                required
                max={today}
                value={state.completedDate}
                onChange={(e) => setField("completedDate", e.target.value)}
              />
            </label>
            <label>
              <span>
                Start time <small>optional</small>
              </span>
              <input
                type="time"
                value={state.startTime}
                onChange={(e) => setField("startTime", e.target.value)}
              />
            </label>
            <label>
              <span>
                End time <small>optional</small>
              </span>
              <input
                type="time"
                value={state.endTime}
                onChange={(e) => setField("endTime", e.target.value)}
              />
            </label>
            <label>
              <span>
                Actual distance <small>miles · optional</small>
              </span>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                inputMode="decimal"
                placeholder={`Planned: ${hike.distanceMiles.toFixed(2)} mi`}
                value={state.actualDistanceMiles}
                onChange={(e) => setField("actualDistanceMiles", e.target.value)}
              />
            </label>
            <label>
              <span>
                Temperature <small>°F · optional</small>
              </span>
              <input
                type="number"
                min="-100"
                max="150"
                inputMode="numeric"
                value={state.temperatureF}
                onChange={(e) => setField("temperatureF", e.target.value)}
              />
            </label>
            <div className="calculated-field">
              <span>
                <Clock3 size={17} /> Duration
              </span>
              <strong>
                {duration === undefined ? "Add both times" : formatDuration(duration)}
              </strong>
            </div>
          </div>
        </JournalSection>

        <JournalSection
          number="02"
          title="How was your adventure?"
          subtitle="Pick the feeling that fits best."
        >
          <div className="choice-grid choice-grid--five" role="group" aria-label="Overall feeling">
            {feelingOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={state.feeling === option.value}
                emoji={option.emoji}
                label={option.label}
                onClick={() =>
                  setField("feeling", state.feeling === option.value ? undefined : option.value)
                }
              />
            ))}
          </div>
          <fieldset className="rating-field">
            <legend>
              Adventure rating <small>optional</small>
            </legend>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={state.rating && rating <= state.rating ? "is-selected" : ""}
                  onClick={() => setField("rating", state.rating === rating ? undefined : rating)}
                  aria-pressed={state.rating === rating}
                  aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                >
                  <Star aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>
        </JournalSection>

        <JournalSection
          number="03"
          title="What was the weather like?"
          subtitle="Choose every kind of weather you met."
        >
          <div className="choice-grid choice-grid--six">
            {weatherOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={state.weather.includes(option.value)}
                emoji={option.emoji}
                label={option.label}
                onClick={() => toggleArray("weather", option.value)}
              />
            ))}
          </div>
        </JournalSection>

        <JournalSection
          number="04"
          title="What did you discover?"
          subtitle="Every trail has a few secrets."
        >
          <div className="choice-grid choice-grid--four">
            {discoveryOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={state.discoveries.includes(option.value)}
                emoji={option.emoji}
                label={option.label}
                onClick={() => toggleArray("discoveries", option.value)}
              />
            ))}
          </div>
        </JournalSection>

        <JournalSection
          number="05"
          title="Trail achievements"
          subtitle="Mark the moments worth celebrating."
        >
          <div className="toggle-list">
            <Toggle
              checked={state.missionCompleted}
              onChange={(value) => setField("missionCompleted", value)}
              icon="✓"
              label={`Trail mission · ${hike.mission}`}
            />
            <Toggle
              checked={state.secondMissionCompleted}
              onChange={(value) => setField("secondMissionCompleted", value)}
              icon="✓"
              label={`Trail mission · ${hike.secondMission}`}
            />
            <Toggle
              checked={state.spottedFourSquirrels}
              onChange={(value) => setField("spottedFourSquirrels", value)}
              icon="🐿️"
              label="Spot four squirrels"
            />
            <Toggle
              checked={state.passportStampCollected}
              onChange={(value) => setField("passportStampCollected", value)}
              icon="▣"
              label="I collected a passport stamp (optional)"
            />
            <Toggle
              checked={state.completedEntireHike}
              onChange={(value) => setField("completedEntireHike", value)}
              icon="✓"
              label="Completed the entire hike"
            />
          </div>
        </JournalSection>

        <JournalSection
          number="06"
          title="Adventure memories"
          subtitle="A few words can bring the whole day back."
        >
          <div className="memory-fields">
            <label>
              <span>
                What was your favorite part? <small>optional</small>
              </span>
              <input
                maxLength={300}
                value={state.favoritePart}
                onChange={(e) => setField("favoritePart", e.target.value)}
                placeholder="The view, a discovery, a funny moment…"
              />
            </label>
            <label>
              <span>
                What surprised you? <small>optional</small>
              </span>
              <input
                maxLength={300}
                value={state.biggestSurprise}
                onChange={(e) => setField("biggestSurprise", e.target.value)}
                placeholder="Something you didn’t expect…"
              />
            </label>
            <fieldset className="yes-no">
              <legend>
                Would you hike this trail again? <small>optional</small>
              </legend>
              <div>
                <button
                  type="button"
                  className={state.wouldHikeAgain === true ? "is-selected" : ""}
                  onClick={() =>
                    setField("wouldHikeAgain", state.wouldHikeAgain === true ? undefined : true)
                  }
                >
                  Yes!
                </button>
                <button
                  type="button"
                  className={state.wouldHikeAgain === false ? "is-selected" : ""}
                  onClick={() =>
                    setField("wouldHikeAgain", state.wouldHikeAgain === false ? undefined : false)
                  }
                >
                  Maybe not
                </button>
              </div>
            </fieldset>
            <label>
              <span>
                Adventure notes <small>optional</small>
              </span>
              <textarea
                maxLength={2000}
                rows={5}
                value={state.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Anything else you want to remember…"
              />
            </label>
          </div>
        </JournalSection>

        <section className="earn-panel">
          <div className="earn-badge">
            <BadgeImage hike={hike} earned size="medium" showStatus={false} />
          </div>
          <div>
            <span className="eyebrow">
              {existing?.completed ? "Keep your story fresh" : "Your patch awaits"}
            </span>
            <h2>{existing?.completed ? "Save your adventure" : "Unlock your badge"}</h2>
            <p>Your journal stays private on this device.</p>
            {validationError && (
              <p className="form-error" role="alert">
                {validationError}
              </p>
            )}
            <button className="button button--gold button--large" type="submit">
              {existing?.completed ? (
                <>
                  <Save /> Save Changes
                </>
              ) : (
                <>
                  <Award /> Earn My Badge
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function JournalSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="journal-section">
      <header>
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  emoji,
  label,
  onClick,
}: {
  selected: boolean;
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`choice-button ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
    >
      <span aria-hidden="true">{emoji}</span>
      <strong>{label}</strong>
      {selected && <Check className="choice-check" size={16} />}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  icon,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: string;
  label: string;
}) {
  return (
    <label className={`achievement-toggle ${checked ? "is-selected" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="achievement-icon" aria-hidden="true">
        {icon}
      </span>
      <strong>{label}</strong>
      <span className="switch" aria-hidden="true">
        <i />
      </span>
    </label>
  );
}
