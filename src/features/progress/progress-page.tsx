"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  getProgressSummary,
  logCompletion,
  selectLogsInRange,
  waterTotal,
  type RangeId
} from "@/features/tracking/progress";
import { useTracking } from "@/features/tracking/tracking-provider";
import { formatDate, toLocalDateKey } from "@/lib/dates";

const ProgressCharts = dynamic(() => import("./progress-charts"), {
  ssr: false,
  loading: () => <div className="chart-loading" aria-label="Loading charts" />
});

export function ProgressPage() {
  const { state, hydrated } = useTracking();
  const [range, setRange] = useState<RangeId>("30");
  const today = toLocalDateKey();

  const logs = useMemo(
    () => selectLogsInRange(state.logsByDate, range, today),
    [range, state.logsByDate, today]
  );
  const summary = useMemo(() => getProgressSummary(logs), [logs]);

  if (!hydrated) {
    return <div className="loading-card" aria-label="Loading progress" />;
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your patterns</p>
          <h1>Progress</h1>
          <p>Private, on-device trends from your daily check-ins.</p>
        </div>
      </header>
      <SegmentedControl
        label="Date range"
        value={range}
        onChange={setRange}
        options={[
          { value: "7", label: "7 days" },
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
          { value: "all", label: "All" }
        ]}
      />

      <dl className="stat-grid" aria-label="Progress summary">
        <div>
          <dt>Latest weight</dt>
          <dd>{summary.latestWeight === null ? "—" : `${summary.latestWeight.toFixed(1)} kg`}</dd>
        </div>
        <div>
          <dt>Weight change</dt>
          <dd>
            {summary.weightChange === null
              ? "—"
              : `${summary.weightChange > 0 ? "+" : ""}${summary.weightChange.toFixed(1)} kg`}
          </dd>
        </div>
        <div>
          <dt>Avg. water</dt>
          <dd>{summary.averageWater === 0 ? "—" : `${(summary.averageWater / 1000).toFixed(1)} L`}</dd>
        </div>
        <div>
          <dt>Adherence</dt>
          <dd>{logs.length ? `${summary.adherence}%` : "—"}</dd>
        </div>
        <div>
          <dt>Complete days</dt>
          <dd>{summary.completeDays}</dd>
        </div>
      </dl>

      <h2 className="section-title">Trends</h2>
      <ProgressCharts logs={logs} waterGoalMl={state.settings.waterGoalMl} />

      <h2 className="section-title">Recent history</h2>
      {logs.length === 0 ? (
        <div className="empty-state">
          <Activity aria-hidden="true" size={26} />
          <strong>No check-ins yet</strong>
          <p>Your completed meals, water and weight will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {[...logs].reverse().slice(0, 14).map((log) => {
            const completion = logCompletion(log);
            return (
              <article className="history-row" key={log.date}>
                <div>
                  <h3>
                    {formatDate(log.date, {
                      weekday: "short",
                      day: "numeric",
                      month: "short"
                    })}
                  </h3>
                  <p>
                    {log.dayPlanId === "climbing" ? "Climbing" : "Rest"} ·{" "}
                    {log.variantId === "default" ? "Tofu" : "Chicken"}
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>Meals</dt>
                    <dd>{completion.completed}/{completion.total}</dd>
                  </div>
                  <div>
                    <dt>Water</dt>
                    <dd>{waterTotal(log) ? `${(waterTotal(log) / 1000).toFixed(1)} L` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Weight</dt>
                    <dd>{log.weightKg ? `${log.weightKg.toFixed(1)} kg` : "—"}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
