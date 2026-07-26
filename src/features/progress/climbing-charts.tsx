"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Clock3, Gauge } from "lucide-react";
import { shortDate } from "@/lib/dates";
import type { ClimbingSession } from "@/types/tracking";

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--text)",
  fontSize: "12px",
  boxShadow: "var(--shadow-sm)"
};

function ChartEmpty({
  icon: Icon,
  children
}: {
  icon: typeof Clock3;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-empty">
      <Icon aria-hidden="true" size={24} />
      <p>{children}</p>
    </div>
  );
}

export default function ClimbingCharts({
  sessions
}: {
  sessions: ClimbingSession[];
}) {
  const data = sessions.map((session) => ({
    id: session.id,
    label: shortDate(session.date),
    duration: session.durationMinutes,
    difficulty: session.difficulty
  }));
  const tickInterval =
    data.length > 14 ? Math.ceil(data.length / 6) - 1 : "preserveStartEnd";

  return (
    <div className="chart-stack">
      <section
        className="surface-card chart-card"
        aria-labelledby="session-length-chart-title"
      >
        <div className="chart-heading">
          <div>
            <p className="eyebrow">Time on wall</p>
            <h2 id="session-length-chart-title">Session length</h2>
          </div>
          <span>minutes</span>
        </div>
        {data.length === 0 ? (
          <ChartEmpty icon={Clock3}>
            Log a climbing session to see your time on the wall.
          </ChartEmpty>
        ) : (
          <div className="chart-wrap" data-testid="session-length-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 12, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                  minTickGap={12}
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                  width={46}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value} min`, "Length"]}
                />
                <Bar
                  dataKey="duration"
                  fill="var(--accent)"
                  radius={[5, 5, 2, 2]}
                  maxBarSize={34}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section
        className="surface-card chart-card"
        aria-labelledby="session-effort-chart-title"
      >
        <div className="chart-heading">
          <div>
            <p className="eyebrow">How it felt</p>
            <h2 id="session-effort-chart-title">Session difficulty</h2>
          </div>
          <span>0–10</span>
        </div>
        {data.length < 2 ? (
          <ChartEmpty icon={Gauge}>
            Log two sessions to see how perceived difficulty changes.
          </ChartEmpty>
        ) : (
          <div className="chart-wrap" data-testid="session-effort-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 12, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                  minTickGap={12}
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                  width={46}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value}/10`, "Difficulty"]}
                />
                <Line
                  type="monotone"
                  dataKey="difficulty"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
