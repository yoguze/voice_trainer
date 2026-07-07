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
import { clearSessions, getAllSessions, getRecording } from "@/lib/db";
import {
  getMetricFeedback,
  type FeedbackMetricKey,
} from "@/lib/metric-feedback";
import {
  RECOMMENDED_PROFILE_IDS,
  getRecommendedProfileIdForSelection,
  isRecommendedVoiceProfileId,
} from "@/lib/targets";
import { scoreMetric } from "@/lib/scoring";
import { useVoiceTrainerStore } from "@/stores/voice-trainer-store";
import type {
  RecommendedVoiceProfileId,
  Session,
  VoiceProfileId,
} from "@/types";

const METRIC_GUIDE_KEYS = [
  "total",
  "f0",
  "formantF1",
  "formantF2",
  "spectralCentroid",
  "hnr",
  "intonation",
] as const;

type RecordingStatus = "idle" | "loading" | "ready" | "missing";

export default function HistoryPage() {
  const t = useTranslations("history");
  const resultT = useTranslations("result");
  const common = useTranslations("common");
  const profileT = useTranslations("voiceProfiles");
  const phraseT = useTranslations("practicePhrases");
  const currentProfileId = useVoiceTrainerStore(
    (state) => state.voiceType.profileId,
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedChartProfileId, setSelectedChartProfileId] =
    useState<RecommendedVoiceProfileId>(
      isRecommendedVoiceProfileId(currentProfileId)
        ? currentProfileId
        : "natural",
    );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("idle");

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;
  const chartSessions = sessions.filter(
    (session) =>
      getRecommendedProfileIdForSelection(session.voiceType) ===
      selectedChartProfileId,
  );

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

  useEffect(() => {
    if (isRecommendedVoiceProfileId(currentProfileId)) {
      setSelectedChartProfileId(currentProfileId);
    }
  }, [currentProfileId]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setRecordingUrl(null);

    if (!selectedSession) {
      setRecordingStatus("idle");
      return;
    }

    if (!selectedSession.audioRecordingId) {
      setRecordingStatus("missing");
      return;
    }

    setRecordingStatus("loading");

    void getRecording(selectedSession.audioRecordingId)
      .then((recording) => {
        if (cancelled) return;

        if (!recording) {
          setRecordingStatus("missing");
          return;
        }

        objectUrl = URL.createObjectURL(recording.blob);
        setRecordingUrl(objectUrl);
        setRecordingStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setRecordingStatus("missing");
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedSession]);

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

  const getSessionProfileId = (session: Session): VoiceProfileId => {
    return getRecommendedProfileIdForSelection(session.voiceType) ?? "custom";
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
              <div className="mb-4 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-600">
                  {t("chartProfile")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RECOMMENDED_PROFILE_IDS.map((profileId) => {
                    const isSelected = selectedChartProfileId === profileId;
                    return (
                      <button
                        key={profileId}
                        type="button"
                        onClick={() => setSelectedChartProfileId(profileId)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? "bg-pink-500 text-white shadow-sm"
                            : "border border-pink-200 bg-white text-slate-600 hover:bg-pink-50"
                        }`}
                      >
                        {profileT(`${profileId}.name`)}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {t("customChartNotice")}
                </p>
              </div>
              {chartSessions.length > 0 ? (
                <HistoryChart sessions={chartSessions} />
              ) : (
                <p className="rounded-2xl border border-pink-100 bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
                  {t("emptyChartProfile", {
                    profile: profileT(`${selectedChartProfileId}.name`),
                  })}
                </p>
              )}
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
              const sessionProfileId = getSessionProfileId(session);
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
                      <div className="text-right">
                        <span className="text-xl font-bold text-pink-600">
                          {session.scores.total}
                        </span>
                        <p className="mt-1 text-xs text-slate-400">
                          {profileT(`${sessionProfileId}.name`)}
                        </p>
                      </div>
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
                  <p className="mt-1 text-sm text-purple-600">
                    {profileT(`${getSessionProfileId(selectedSession)}.name`)}
                  </p>
                  {selectedSession.promptPhraseId ? (
                    <p className="mt-2 rounded-xl bg-purple-50 px-3 py-2 text-sm leading-6 text-purple-700">
                      {t("promptPhrase")}:{" "}
                      {phraseT(selectedSession.promptPhraseId)}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-pink-100 px-4 py-2 text-lg font-bold text-pink-600">
                  {selectedSession.scores.total}
                  {common("points")}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-pink-100 bg-pink-50/60 p-3">
                <h3 className="font-semibold text-pink-700">
                  {t("recordingTitle")}
                </h3>
                {recordingStatus === "loading" ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {t("recordingLoading")}
                  </p>
                ) : recordingUrl ? (
                  <audio
                    controls
                    src={recordingUrl}
                    className="mt-3 w-full"
                  >
                    {t("audioUnsupported")}
                  </audio>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    {t("recordingUnavailable")}
                  </p>
                )}
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
