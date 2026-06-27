"use client";

import { motion } from "framer-motion";
import { scoreStars } from "@/lib/scoring";
import { useTranslations } from "next-intl";
import { staggerContainer, staggerItem } from "@/components/motion";

type MetricRow = {
  label: string;
  measured: number;
  target: number;
  score: number;
  unit: string;
  note?: string;
  description?: string;
  improvement?: string;
  feedback?: string;
};

type ScoreCardProps = {
  metrics: MetricRow[];
  totalScore: number;
};

export function ScoreCard({ metrics, totalScore }: ScoreCardProps) {
  const t = useTranslations("result");
  const common = useTranslations("common");

  return (
    <div className="space-y-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {metrics.map((metric) => (
          <motion.div
            key={metric.label}
            variants={staggerItem}
            className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-700">{metric.label}</h3>
                {metric.note ? (
                  <p className="text-xs text-amber-600">{metric.note}</p>
                ) : null}
              </div>
              <span className="text-lg font-bold text-pink-600">
                {metric.score}
                {common("points")} {scoreStars(metric.score)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {t("measured")}: {metric.measured.toFixed(1)}
              {metric.unit} / {t("target")}: {metric.target.toFixed(1)}
              {metric.unit}
            </p>
            {metric.description ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {metric.description}
              </p>
            ) : null}
            {metric.feedback ? (
              <p className="mt-2 rounded-xl bg-purple-50 px-3 py-2 text-sm leading-6 text-purple-700">
                {t("feedbackLabel")}: {metric.feedback}
              </p>
            ) : null}
            {metric.improvement ? (
              <p className="mt-2 rounded-xl bg-pink-50 px-3 py-2 text-sm leading-6 text-pink-700">
                {t("improvementLabel")}: {metric.improvement}
              </p>
            ) : null}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: metrics.length * 0.08 + 0.1,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="rounded-3xl bg-gradient-to-r from-pink-400 to-purple-400 p-6 text-center text-white shadow-lg"
      >
        <p className="text-sm uppercase tracking-wide opacity-90">
          {t("totalScore")}
        </p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: metrics.length * 0.08 + 0.25 }}
          className="mt-2 text-5xl font-bold"
        >
          {totalScore}
          <span className="ml-1 text-2xl">{common("points")}</span>
        </motion.p>
        <p className="mt-2 text-2xl">{scoreStars(totalScore)}</p>
      </motion.div>
    </div>
  );
}
