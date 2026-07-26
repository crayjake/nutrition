"use client";

import dynamic from "next/dynamic";
import { Mountain } from "lucide-react";
import {
  formatClimbingTime,
  getClimbingSummary,
  selectClimbingSessionsInRange
} from "@/features/climbing/climbing-stats";
import { gradeLabel } from "@/features/climbing/grading";
import { formatDate } from "@/lib/dates";
import type { RangeId } from "@/features/tracking/progress";
import type { ClimbingSession } from "@/types/tracking";

const ClimbingCharts = dynamic(() => import("./climbing-charts"), {
  ssr: false,
  loading: () => <div className="chart-loading" aria-label="Loading charts" />
});

export function ClimbingProgress({
  sessions: allSessions,
  range,
  today
}: {
  sessions: ClimbingSession[];
  range: RangeId;
  today: string;
}) {
  const sessions = selectClimbingSessionsInRange(allSessions, range, today);
  const summary = getClimbingSummary(sessions, range);

  return (
    <>
      <dl className="stat-grid climbing-stat-grid" aria-label="Climbing summary">
        <div>
          <dt>Sessions</dt>
          <dd>{summary.sessionCount || "—"}</dd>
        </div>
        <div>
          <dt>Time on wall</dt>
          <dd>
            {summary.totalMinutes
              ? formatClimbingTime(summary.totalMinutes)
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Avg. session</dt>
          <dd>
            {summary.averageDuration
              ? formatClimbingTime(summary.averageDuration)
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Avg. difficulty</dt>
          <dd>
            {summary.sessionCount ? `${summary.averageDifficulty}/10` : "—"}
          </dd>
        </div>
        <div>
          <dt>Rhythm</dt>
          <dd>
            {summary.sessionCount ? `${summary.sessionsPerWeek}/wk` : "—"}
          </dd>
        </div>
        <div>
          <dt>Typical logged</dt>
          <dd>
            {summary.typicalGrade ? gradeLabel(summary.typicalGrade) : "—"}
          </dd>
        </div>
        <div>
          <dt>Hardest sent</dt>
          <dd>
            {summary.hardestSent ? gradeLabel(summary.hardestSent) : "—"}
          </dd>
        </div>
      </dl>

      <h2 className="section-title">Training trends</h2>
      <ClimbingCharts sessions={sessions} />

      <h2 className="section-title">Recent sessions</h2>
      {sessions.length === 0 ? (
        <div className="empty-state">
          <Mountain aria-hidden="true" size={26} />
          <strong>No sessions in this range</strong>
          <p>Log a session from the Climb tab to start seeing patterns.</p>
        </div>
      ) : (
        <div className="history-list">
          {[...sessions].reverse().slice(0, 14).map((session) => (
            <article className="history-row climbing-progress-row" key={session.id}>
              <div>
                <h3>
                  {formatDate(session.date, {
                    weekday: "short",
                    day: "numeric",
                    month: "short"
                  })}
                </h3>
                <p>{session.notes || "Climbing session"}</p>
              </div>
              <dl>
                <div>
                  <dt>Length</dt>
                  <dd>{formatClimbingTime(session.durationMinutes)}</dd>
                </div>
                <div>
                  <dt>Difficulty</dt>
                  <dd>{session.difficulty}/10</dd>
                </div>
                <div>
                  <dt>Best logged</dt>
                  <dd>
                    {(() => {
                      const sent = session.climbs.filter((climb) => climb.sent);
                      if (!sent.length) return "—";
                      const summary = getClimbingSummary([session], "all");
                      return summary.hardestSent
                        ? gradeLabel(summary.hardestSent)
                        : "—";
                    })()}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
