"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Session } from "@/types";

type HistoryChartProps = {
  sessions: Session[];
  scoreLabel: string;
};

export function HistoryChart({ sessions, scoreLabel }: HistoryChartProps) {
  const data = [...sessions]
    .reverse()
    .map((session) => ({
      date: new Date(session.createdAt).toLocaleDateString(),
      score: session.scores.total,
    }));

  return (
    <div className="h-64 w-full rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="score"
            name={scoreLabel}
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ fill: "#a855f7" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
