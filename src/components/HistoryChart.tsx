"use client";

import { useMemo, useState } from "react";
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
  | "f0"
  | "formantF1"
  | "formantF2"
  | "spectralCentroid"
  | "hnr"
  | "intonation";

type ChartDataPoint = {
  label: string;
  f0: number;
  f0Target: number;
  formantF1: number;
  formantF1Target: number;
  formantF2: number;
  formantF2Target: number;
  spectralCentroid: number;
  spectralCentroidTarget: number;
  hnr: number;
  hnrTarget: number;
  intonation: number;
  intonationTarget: number;
};

const METRIC_KEYS: ChartMetricKey[] = [
  "f0",
  "formantF1",
  "formantF2",
  "spectralCentroid",
  "hnr",
  "intonation",
];

const METRIC_CONFIG: Record<
  ChartMetricKey,
  { color: string; unitKey: "hz" | "db" | "oct"; targetKey: keyof ChartDataPoint }
> = {
  f0: { color: "#a855f7", unitKey: "hz", targetKey: "f0Target" },
  formantF1: { color: "#6366f1", unitKey: "hz", targetKey: "formantF1Target" },
  formantF2: { color: "#818cf8", unitKey: "hz", targetKey: "formantF2Target" },
  spectralCentroid: {
    color: "#0ea5e9",
    unitKey: "hz",
    targetKey: "spectralCentroidTarget",
  },
  hnr: { color: "#10b981", unitKey: "db", targetKey: "hnrTarget" },
  intonation: { color: "#f59e0b", unitKey: "oct", targetKey: "intonationTarget" },
};

type HistoryChartProps = {
  sessions: Session[];
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: number;
    payload?: ChartDataPoint;
  }>;
  label?: string;
  selectedMetric: ChartMetricKey;
  formatValue: (value: number) => string;
  formatDiff: (diff: number) => string;
  measuredLabel: string;
  targetLabel: string;
  diffLabel: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  selectedMetric,
  formatValue,
  formatDiff,
  measuredLabel,
  targetLabel,
  diffLabel,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const config = METRIC_CONFIG[selectedMetric];
  const measuredEntry = payload.find(
    (entry) => entry.dataKey === selectedMetric,
  );
  const targetEntry = payload.find(
    (entry) => entry.dataKey === config.targetKey,
  );
  const point = measuredEntry?.payload ?? payload[0]?.payload;
  if (!point) return null;

  const measured =
    typeof measuredEntry?.value === "number"
      ? measuredEntry.value
      : point[selectedMetric];
  const target =
    typeof targetEntry?.value === "number"
      ? targetEntry.value
      : (point[config.targetKey] as number);
  const diff = measured - target;

  return (
    <div className="rounded-xl border border-pink-100 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-slate-600">
        {measuredLabel}: {formatValue(measured)}
      </p>
      <p className="text-slate-600">
        {targetLabel}: {formatValue(target)}
      </p>
      <p className="font-medium text-pink-600">
        {diffLabel}: {formatDiff(diff)}
      </p>
    </div>
  );
}

function computeYDomain(
  data: ChartDataPoint[],
  selectedMetric: ChartMetricKey,
): [number, number] {
  const config = METRIC_CONFIG[selectedMetric];
  const values = data.flatMap((point) => [
    point[selectedMetric],
    point[config.targetKey] as number,
  ]);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.1, 1);

  return [min - padding, max + padding];
}

export function HistoryChart({ sessions }: HistoryChartProps) {
  const t = useTranslations("history");
  const resultT = useTranslations("result");
  const common = useTranslations("common");
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricKey>("f0");

  const data = useMemo<ChartDataPoint[]>(
    () =>
      [...sessions].reverse().map((session) => ({
        label: new Date(session.createdAt).toLocaleString(undefined, {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        f0: session.measured.F0,
        f0Target: session.targets.F0,
        formantF1: session.measured.F1,
        formantF1Target: session.targets.formant.F1,
        formantF2: session.measured.F2,
        formantF2Target: session.targets.formant.F2,
        spectralCentroid: session.measured.spectralCentroid,
        spectralCentroidTarget: session.targets.spectralCentroid,
        hnr: session.measured.HNR,
        hnrTarget: session.targets.HNR,
        intonation: session.measured.intonation,
        intonationTarget: session.targets.intonation,
      })),
    [sessions],
  );

  const config = METRIC_CONFIG[selectedMetric];
  const unit = common(config.unitKey);
  const yDomain = useMemo(
    () => computeYDomain(data, selectedMetric),
    [data, selectedMetric],
  );

  const formatValue = (value: number) => `${value.toFixed(1)}${unit}`;
  const formatDiff = (diff: number) => {
    const signed = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    return `${signed}${unit}`;
  };

  const isFormantMetric =
    selectedMetric === "formantF1" || selectedMetric === "formantF2";
  const isQualityMetric =
    selectedMetric === "spectralCentroid" || selectedMetric === "hnr";

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
        {isFormantMetric ? (
          <p className="text-xs leading-5 text-amber-700">{t("formantChartNotice")}</p>
        ) : null}
        {isQualityMetric ? (
          <p className="text-xs leading-5 text-sky-700">{t("qualityChartNotice")}</p>
        ) : null}
      </div>

      <div className="h-72 w-full rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `${Number(value).toFixed(0)}`}
            />
            <Tooltip
              shared={false}
              content={
                <ChartTooltip
                  selectedMetric={selectedMetric}
                  formatValue={formatValue}
                  formatDiff={formatDiff}
                  measuredLabel={resultT("measured")}
                  targetLabel={t("chartTarget")}
                  diffLabel={t("targetDiff")}
                />
              }
            />
            <Legend
              formatter={(value) =>
                value === "measured"
                  ? t("chartMeasured")
                  : t("chartTarget")
              }
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              name="measured"
              stroke={config.color}
              strokeWidth={2.5}
              dot={{ fill: config.color, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey={config.targetKey}
              name="target"
              stroke={config.color}
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeOpacity={0.65}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
