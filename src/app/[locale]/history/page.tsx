"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  AnimatedPage,
  MotionButton,
  staggerContainer,
  staggerItem,
} from "@/components/motion";
import { HistoryChart } from "@/components/HistoryChart";
import { PageShell } from "@/components/Header";
import { clearSessions, getAllSessions } from "@/lib/db";
import {
  getMetricFeedback,
  type FeedbackMetricKey,
} from "@/lib/metric-feedback";
import { scoreMetric } from "@/lib/scoring";
import type { Session } from "@/types";

const METRIC_GUIDE_KEYS = [
  "total",
  "f0",
  "formant",
  "spectralCentroid",
  "hnr",
  "intonation",
] as const;

export default function HistoryPage() {
  const t = useTranslations("history");
  const resultT = useTranslations("result");
  const common = useTranslations("common");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  useEffect(() => {
    let cancelled = false;

    void getAllSessions().then((data) => {
      if (cancelled) return;
      setSessions(data);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClear = async () => {
    if (!window.confirm(t("confirmClear"))) return;
    await clearSessions();
    setSessions([]);
    setSelectedSessionId(null);
  };

  const buildFeedbackComment = (
    metricKey: FeedbackMetricKey,
    measured: number,
    target: number,
    score: number,
  ) => {
    const feedback = getMetricFeedback(measured, target, score);

    if (feedback.isOnTarget) {
      return resultT("feedback.onTarget");
    }

    return resultT("feedback.comment", {
      technical: resultT(`feedback.technical.${feedback.direction}`, {
        severity: resultT(`feedback.severity.${feedback.band}`),
      }),
      image: resultT(`feedback.image.${metricKey}.${feedback.direction}`),
    });
  };

  const buildSessionMetrics = (session: Session) => {
    const formantF1Score = scoreMetric(
      session.measured.F1,
      session.targets.formant.F1,
    );
    const formantF2Score = scoreMetric(
      session.measured.F2,
      session.targets.formant.F2,
    );

    return [
      {
        key: "f0" as const,
        label: resultT("f0"),
        measured: session.measured.F0,
        target: session.targets.F0,
        score: session.scores.F0,
        unit: common("hz"),
      },
      {
        key: "formantF1" as const,
        label: resultT("formantF1"),
        measured: session.measured.F1,
        target: session.targets.formant.F1,
        score: formantF1Score,
        unit: common("hz"),
      },
      {
        key: "formantF2" as const,
        label: resultT("formantF2"),
        measured: session.measured.F2,
        target: session.targets.formant.F2,
        score: formantF2Score,
        unit: common("hz"),
      },
      {
        key: "spectralCentroid" as const,
        label: resultT("spectralCentroid"),
        measured: session.measured.spectralCentroid,
        target: session.targets.spectralCentroid,
        score: session.scores.spectralCentroid,
        unit: common("hz"),
      },
      {
        key: "hnr" as const,
        label: resultT("hnr"),
        measured: session.measured.HNR,
        target: session.targets.HNR,
        score: session.scores.HNR,
        unit: common("db"),
      },
      {
        key: "intonation" as const,
        label: resultT("intonation"),
        measured: session.measured.intonation,
        target: session.targets.intonation,
        score: session.scores.intonation,
        unit: common("oct"),
      },
    ].map((metric) => ({
      ...metric,
      targetDiff: metric.measured - metric.target,
      scoreGap: Math.max(0, 100 - metric.score),
      feedback: buildFeedbackComment(
        metric.key,
        metric.measured,
        metric.target,
        metric.score,
      ),
    }));
  };

  return (
    <PageShell title={t("title")}>
      {loaded && sessions.length === 0 ? (
        <p className="text-center text-slate-500">{t("empty")}</p>
      ) : (
        <AnimatedPage className="space-y-6">
          {sessions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="mb-3 text-lg font-semibold text-slate-700">
                {t("scoreChart")}
              </h2>
              <HistoryChart sessions={sessions} />
            </motion.div>
          ) : null}

          {sessions.length > 0 ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-700">
                {t("metricGuideTitle")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("metricGuideIntro")}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {METRIC_GUIDE_KEYS.map((key) => (
                  <div key={key} className="rounded-xl bg-pink-50 p-3">
                    <h3 className="font-semibold text-pink-700">
                      {t(`metrics.${key}`)}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {t(`metricGuide.${key}`)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          ) : null}

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {sessions.map((session) => {
              const isSelected = selectedSessionId === session.id;
              return (
                <motion.li key={session.id} variants={staggerItem}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSessionId(isSelected ? null : session.id)
                    }
                    className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                      isSelected
                        ? "border-pink-300 ring-2 ring-pink-100"
                        : "border-pink-100 hover:border-pink-200 hover:bg-pink-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-sm text-slate-500">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                        <p className="mt-1 text-xs text-slate-400">
                          {isSelected ? t("selected") : t("viewDetails")}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-pink-600">
                        {session.scores.total}
                      </span>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>

          {selectedSession ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-700">
                    {t("detailTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(selectedSession.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-pink-100 px-4 py-2 text-lg font-bold text-pink-600">
                  {selectedSession.scores.total}
                  {common("points")}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {buildSessionMetrics(selectedSession).map((metric) => {
                  const signedTargetDiff =
                    metric.targetDiff > 0
                      ? `+${metric.targetDiff.toFixed(1)}`
                      : metric.targetDiff.toFixed(1);

                  return (
                    <div
                      key={metric.key}
                      className="rounded-xl border border-purple-50 bg-purple-50/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-purple-800">
                          {metric.label}
                        </h3>
                        <span className="font-bold text-pink-600">
                          {metric.score}
                          {common("points")}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm text-slate-600 md:grid-cols-3">
                        <p>
                          {t("scoreGap")}: {metric.scoreGap}
                          {common("points")}
                        </p>
                        <p>
                          {resultT("measured")}: {metric.measured.toFixed(1)}
                          {metric.unit}
                        </p>
                        <p>
                          {t("targetDiff")}: {signedTargetDiff}
                          {metric.unit}
                        </p>
                      </div>
                      <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-purple-700">
                        {resultT("feedbackLabel")}: {metric.feedback}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ) : null}

          {sessions.length > 0 ? (
            <div className="text-center">
              <MotionButton
                type="button"
                onClick={() => void handleClear()}
                className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                {t("clearAll")}
              </MotionButton>
            </div>
          ) : null}
        </AnimatedPage>
      )}
    </PageShell>
  );
}
