"use client";

import {
  CalendarDays,
  Check,
  Clock3,
  Gauge,
  Mountain,
  Plus,
  Trash2,
  X
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatDate, toLocalDateKey } from "@/lib/dates";
import { useTracking } from "@/features/tracking/tracking-provider";
import {
  CLIMB_BANDS,
  GYM_GRADES,
  gradeLabel,
  gradeRangeLabel
} from "./grading";
import type {
  ClimbBand,
  GymGradeColour,
  LoggedClimb
} from "@/types/tracking";

function uniqueDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `climb-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newClimb(): LoggedClimb {
  return {
    id: uniqueDraftId(),
    gradeColour: GYM_GRADES[0].id,
    band: "medium",
    sent: false
  };
}

function difficultyLabel(value: number) {
  if (value <= 2) return "Recovery";
  if (value <= 4) return "Comfortable";
  if (value <= 6) return "Solid";
  if (value <= 8) return "Hard";
  return "Limit";
}

export function ClimbingPage() {
  const {
    state,
    hydrated,
    storageAvailable,
    addClimbingSession,
    removeClimbingSession
  } = useTracking();
  const today = toLocalDateKey();
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState("90");
  const [difficulty, setDifficulty] = useState(6);
  const [climbs, setClimbs] = useState<LoggedClimb[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const recentSessions = useMemo(
    () =>
      [...state.climbingSessions]
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            b.createdAt.localeCompare(a.createdAt)
        )
        .slice(0, 8),
    [state.climbingSessions]
  );

  if (!hydrated) {
    return <div className="loading-card" aria-label="Loading climbing log" />;
  }

  function updateClimb(id: string, patch: Partial<LoggedClimb>) {
    setClimbs((current) =>
      current.map((climb) =>
        climb.id === id ? { ...climb, ...patch } : climb
      )
    );
  }

  function saveSession(event: FormEvent) {
    event.preventDefault();
    const durationMinutes = Number(duration);
    if (
      !date ||
      !Number.isFinite(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 1440
    ) {
      setError("Enter a session length between 1 and 1,440 minutes.");
      return;
    }
    addClimbingSession({
      date,
      durationMinutes: Math.round(durationMinutes),
      difficulty,
      climbs,
      ...(notes.trim() ? { notes: notes.trim() } : {})
    });
    setDuration("90");
    setDifficulty(6);
    setClimbs([]);
    setNotes("");
    setError("");
    setStatus("Climbing session saved.");
  }

  function deleteSession(id: string) {
    if (!window.confirm("Delete this climbing session?")) return;
    removeClimbingSession(id);
    setStatus("Climbing session deleted.");
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Training log</p>
          <h1>Climbing</h1>
          <p>Capture the session. Add individual climbs only when useful.</p>
        </div>
      </header>

      {!storageAvailable && (
        <div className="notice warning" role="status">
          Browser storage is unavailable. Changes will work for this session only.
        </div>
      )}

      <form className="climbing-form" onSubmit={saveSession}>
        <section className="surface-card climbing-session-card">
          <div className="climbing-card-heading">
            <span className="tracker-icon climbing-icon">
              <Mountain aria-hidden="true" size={21} />
            </span>
            <div>
              <p className="eyebrow">New entry</p>
              <h2>Log a session</h2>
            </div>
          </div>

          <div className="session-field-grid">
            <label>
              <span className="input-label">
                <CalendarDays aria-hidden="true" size={14} />
                Date
              </span>
              <input
                className="input"
                type="date"
                max={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label>
              <span className="input-label">
                <Clock3 aria-hidden="true" size={14} />
                Length (minutes)
              </span>
              <input
                className="input"
                type="number"
                min="1"
                max="1440"
                step="1"
                inputMode="numeric"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </label>
          </div>

          <div className="difficulty-field">
            <div className="difficulty-heading">
              <label className="input-label" htmlFor="session-difficulty">
                <Gauge aria-hidden="true" size={14} />
                Session difficulty
              </label>
              <output htmlFor="session-difficulty">
                <strong>{difficulty}</strong>
                <span>/10 · {difficultyLabel(difficulty)}</span>
              </output>
            </div>
            <input
              className="difficulty-slider"
              id="session-difficulty"
              type="range"
              min="0"
              max="10"
              step="1"
              value={difficulty}
              style={
                {
                  "--range-progress": `${difficulty * 10}%`
                } as React.CSSProperties
              }
              onChange={(event) => setDifficulty(Number(event.target.value))}
            />
            <div className="slider-scale" aria-hidden="true">
              <span>Easy</span>
              <span>Max effort</span>
            </div>
          </div>
        </section>

        <section className="surface-card individual-climbs-card">
          <div className="optional-heading">
            <div>
              <p className="eyebrow">Optional detail</p>
              <h2>Individual climbs</h2>
              <p>Use your gym’s hold colour, band and whether it went.</p>
            </div>
            <button
              className="button button-subtle add-climb-button"
              type="button"
              onClick={() => setClimbs((current) => [...current, newClimb()])}
            >
              <Plus aria-hidden="true" size={17} />
              Add
            </button>
          </div>

          {climbs.length === 0 ? (
            <div className="climbs-empty">
              <Mountain aria-hidden="true" size={22} />
              <span>No individual climbs added</span>
            </div>
          ) : (
            <div className="logged-climb-list">
              {climbs.map((climb, index) => {
                const grade = GYM_GRADES.find(
                  (item) => item.id === climb.gradeColour
                )!;
                return (
                  <article className="logged-climb-card" key={climb.id}>
                    <div className="logged-climb-heading">
                      <span
                        className="grade-dot"
                        style={{ backgroundColor: grade.colour }}
                        aria-hidden="true"
                      />
                      <strong>Climb {index + 1}</strong>
                      <span>{gradeLabel(climb)}</span>
                      <button
                        type="button"
                        aria-label={`Remove climb ${index + 1}`}
                        onClick={() =>
                          setClimbs((current) =>
                            current.filter((item) => item.id !== climb.id)
                          )
                        }
                      >
                        <X aria-hidden="true" size={17} />
                      </button>
                    </div>
                    <label className="grade-select-label">
                      <span className="input-label">Hold colour</span>
                      <select
                        className="input"
                        value={climb.gradeColour}
                        onChange={(event) =>
                          updateClimb(climb.id, {
                            gradeColour: event.target.value as GymGradeColour
                          })
                        }
                      >
                        {GYM_GRADES.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label} · {gradeRangeLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <SegmentedControl
                      label={`Difficulty for climb ${index + 1}`}
                      value={climb.band}
                      onChange={(band: ClimbBand) =>
                        updateClimb(climb.id, { band })
                      }
                      options={CLIMB_BANDS.map((band) => ({
                        value: band.id,
                        label: band.label
                      }))}
                    />
                    <label className="sent-toggle">
                      <input
                        type="checkbox"
                        checked={climb.sent}
                        onChange={(event) =>
                          updateClimb(climb.id, {
                            sent: event.target.checked
                          })
                        }
                      />
                      <span className="sent-check" aria-hidden="true">
                        <Check size={15} />
                      </span>
                      <span>
                        <strong>Sent</strong>
                        <small>Tick if you completed it</small>
                      </span>
                    </label>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="surface-card session-notes-card">
          <label htmlFor="session-notes">
            <span className="input-label">Session notes (optional)</span>
            <textarea
              className="input textarea"
              id="session-notes"
              maxLength={1000}
              placeholder="Project, energy, skin, tweaks…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </section>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-primary save-session-button" type="submit">
          <Check aria-hidden="true" size={18} />
          Save session
        </button>
        <p className="save-status" aria-live="polite">
          {status}
        </p>
      </form>

      <h2 className="section-title">Recent sessions</h2>
      {recentSessions.length === 0 ? (
        <div className="empty-state">
          <Mountain aria-hidden="true" size={26} />
          <strong>No climbing logged yet</strong>
          <p>Your saved sessions will appear here.</p>
        </div>
      ) : (
        <div className="climbing-history">
          {recentSessions.map((session) => (
            <article className="climbing-history-row" key={session.id}>
              <div className="climbing-history-date">
                <h3>
                  {formatDate(session.date, {
                    weekday: "short",
                    day: "numeric",
                    month: "short"
                  })}
                </h3>
                <p>
                  {session.durationMinutes} min · {session.difficulty}/10{" "}
                  {difficultyLabel(session.difficulty).toLowerCase()}
                </p>
              </div>
              <div className="climbing-history-detail">
                {session.climbs.length > 0 ? (
                  <div className="grade-chip-list">
                    {session.climbs.slice(0, 4).map((climb) => {
                      const grade = GYM_GRADES.find(
                        (item) => item.id === climb.gradeColour
                      )!;
                      return (
                        <span
                          className="grade-chip"
                          data-sent={climb.sent}
                          key={climb.id}
                        >
                          <i
                            style={{ backgroundColor: grade.colour }}
                            aria-hidden="true"
                          />
                          {gradeLabel(climb)}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="session-only-label">Session only</span>
                )}
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Delete session on ${formatDate(session.date)}`}
                  onClick={() => deleteSession(session.id)}
                >
                  <Trash2 aria-hidden="true" size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
