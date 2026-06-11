"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Session } from "@/types";

export type ChartMetricKey =
  | "total"
  | "f0"
  | "formant"
  | "spectralCentroid"
  | "hnr"
  | "intonation"
  | "all";

const METRIC_KEYS: ChartMetricKey[] = [
  "total",
  "f0",
  "formant",
  "spectralCentroid",
  "hnr",
  "intonation",
  "all",
];

const METRIC_LINES: {
  key: Exclude<ChartMetricKey, "all">;
  color: string;
  strokeWidth: number;
}[] = [
  { key: "total", color: "#ec4899", strokeWidth: 3 },
  { key: "f0", color: "#a855f7", strokeWidth: 2 },
  { key: "formant", color: "#6366f1", strokeWidth: 2 },
  { key: "spectralCentroid", color: "#0ea5e9", strokeWidth: 2 },
  { key: "hnr", color: "#10b981", strokeWidth: 2 },
  { key: "intonation", color: "#f59e0b", strokeWidth: 2 },
];

type HistoryChartProps = {
  sessions: Session[];
};

export function HistoryChart({ sessions }: HistoryChartProps) {
  const t = useTranslations("history");
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricKey>("total");

  const data = [...sessions].reverse().map((session) => ({
    date: new Date(session.createdAt).toLocaleDateString(),
    total: session.scores.total,
    f0: session.scores.F0,
    formant: session.scores.formant,
    spectralCentroid: session.scores.spectralCentroid,
    hnr: session.scores.HNR,
    intonation: session.scores.intonation,
  }));

  const visibleLines =
    selectedMetric === "all"
      ? METRIC_LINES
      : METRIC_LINES.filter((line) => line.key === selectedMetric);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-600">
          {t("chartMetric")}
        </p>
        <div className="flex flex-wrap gap-2">
          {METRIC_KEYS.map((key) => {
            const isActive = selectedMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMetric(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-pink-500 text-white shadow-sm"
                    : "border border-pink-200 bg-white text-slate-600 hover:bg-pink-50"
                }`}
              >
                {t(`metrics.${key}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-72 w-full rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, name) => [
                `${value ?? 0}${t("scoreUnit")}`,
                t(`metrics.${String(name)}`),
              ]}
            />
            {selectedMetric === "all" ? (
              <Legend
                formatter={(value) => t(`metrics.${value}`)}
                wrapperStyle={{ fontSize: 12 }}
              />
            ) : null}
            {visibleLines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.key}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                dot={{ fill: line.color, r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
