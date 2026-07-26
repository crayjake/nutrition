"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, Droplets, Scale } from "lucide-react";
import { logCompletion, waterTotal } from "@/features/tracking/progress";
import { shortDate } from "@/lib/dates";
import type { DailyLog } from "@/types/tracking";

interface ChartDatum {
  date: string;
  label: string;
  weight?: number;
  water: number;
  completion: number;
}

function ChartEmpty({
  icon: Icon,
  children
}: {
  icon: typeof Scale;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-empty">
      <Icon aria-hidden="true" size={24} />
      <p>{children}</p>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--text)",
  fontSize: "12px",
  boxShadow: "var(--shadow-sm)"
};

export default function ProgressCharts({
  logs,
  waterGoalMl
}: {
  logs: DailyLog[];
  waterGoalMl: number;
}) {
  const data: ChartDatum[] = logs.map((log) => ({
    date: log.date,
    label: shortDate(log.date),
    ...(log.weightKg === undefined ? {} : { weight: log.weightKg }),
    water: waterTotal(log),
    completion: logCompletion(log).percentage
  }));
  const weightCount = data.filter((item) => item.weight !== undefined).length;
  const tickInterval = data.length > 14 ? Math.ceil(data.length / 6) - 1 : "preserveStartEnd";

  return (
    <div className="chart-stack">
      <section className="surface-card chart-card" aria-labelledby="weight-chart-title">
        <div className="chart-heading">
          <div>
            <p className="eyebrow">Trend</p>
            <h2 id="weight-chart-title">Weight</h2>
          </div>
          <span>kg</span>
        </div>
        {weightCount < 2 ? (
          <ChartEmpty icon={Scale}>Record weight on two days to see a trend.</ChartEmpty>
        ) : (
          <>
            <p className="sr-only">
              Weight chart with {weightCount} recorded values in the selected range.
            </p>
            <div className="chart-wrap" data-testid="weight-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
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
                    domain={["dataMin - 1", "dataMax + 1"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                    width={46}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${Number(value).toFixed(1)} kg`, "Weight"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    connectNulls
                    stroke="var(--accent)"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <section className="surface-card chart-card" aria-labelledby="water-chart-title">
        <div className="chart-heading">
          <div>
            <p className="eyebrow">Hydration</p>
            <h2 id="water-chart-title">Daily water</h2>
          </div>
          <span>litres</span>
        </div>
        {data.length === 0 ? (
          <ChartEmpty icon={Droplets}>Add water to a daily check-in to see this chart.</ChartEmpty>
        ) : (
          <>
            <p className="sr-only">
              Daily water chart. Your goal is {waterGoalMl} millilitres.
            </p>
            <div className="chart-wrap" data-testid="water-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
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
                    tickFormatter={(value) => `${Number(value) / 1000}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                    width={46}
                  />
                  <ReferenceLine
                    y={waterGoalMl}
                    stroke="var(--water)"
                    strokeDasharray="4 4"
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      `${(Number(value) / 1000).toFixed(2)} L`,
                      "Water"
                    ]}
                  />
                  <Bar
                    dataKey="water"
                    fill="var(--water)"
                    radius={[5, 5, 2, 2]}
                    maxBarSize={34}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <section className="surface-card chart-card" aria-labelledby="completion-chart-title">
        <div className="chart-heading">
          <div>
            <p className="eyebrow">Consistency</p>
            <h2 id="completion-chart-title">Meal completion</h2>
          </div>
          <span>percent</span>
        </div>
        {data.length === 0 ? (
          <ChartEmpty icon={Activity}>Complete a meal to begin your history.</ChartEmpty>
        ) : (
          <>
            <p className="sr-only">
              Daily meal-plan completion percentage for {data.length} logged days.
            </p>
            <div className="chart-wrap" data-testid="completion-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
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
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                    width={46}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${value}%`, "Complete"]}
                  />
                  <Bar
                    dataKey="completion"
                    fill="var(--success)"
                    radius={[5, 5, 2, 2]}
                    maxBarSize={34}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
