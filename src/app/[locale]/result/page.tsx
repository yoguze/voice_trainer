"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedPage, MotionButton } from "@/components/motion";
import { PageShell } from "@/components/Header";
import { ScoreCard } from "@/components/ScoreCard";
import {
  getMetricFeedback,
  type FeedbackMetricKey,
} from "@/lib/metric-feedback";
import { scoreMetric } from "@/lib/scoring";
import { getProfileReferenceId } from "@/lib/targets";
import {
  useLatestResult,
  useStoreHydrated,
} from "@/stores/voice-trainer-store";

export default function ResultPage() {
  const t = useTranslations("result");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const result = useLatestResult();
  const hasHydrated = useStoreHydrated();

  useEffect(() => {
    if (hasHydrated && !result) {
      router.replace(`/${locale}/settings`);
    }
  }, [hasHydrated, result, locale, router]);

  if (!hasHydrated || !result) {
    return null;
  }

  const profileReferenceId = getProfileReferenceId(result.voiceType);
  const formantReferenceNote = `${t("formantNote")} · ${t(`formantReferences.${profileReferenceId}`)}`;
  const spectralReferenceNote = `${t("spectralCentroidNote")} · ${t(`qualityReferences.${profileReferenceId}`)}`;
  const hnrReferenceNote = `${t("hnrNote")} · ${t(`qualityReferences.${profileReferenceId}`)}`;

  const buildFeedbackComment = (
    metricKey: FeedbackMetricKey,
    measured: number,
    target: number,
    score: number,
  ) => {
    const feedback = getMetricFeedback(measured, target, score);

    if (feedback.isOnTarget) {
      return t("feedback.onTarget");
    }

    return t("feedback.comment", {
      technical: t(`feedback.technical.${feedback.direction}`, {
        severity: t(`feedback.severity.${feedback.band}`),
      }),
      image: t(`feedback.image.${metricKey}.${feedback.direction}`),
    });
  };

  const metrics = [
    {
      label: t("f0"),
      measured: result.measured.F0,
      target: result.targets.F0,
      score: result.scores.F0,
      unit: common("hz"),
      description: t("metricDescriptions.f0"),
      improvement: t("metricTips.f0"),
      feedback: buildFeedbackComment(
        "f0",
        result.measured.F0,
        result.targets.F0,
        result.scores.F0,
      ),
    },
    {
      label: t("formantF1"),
      measured: result.measured.F1,
      target: result.targets.formant.F1,
      score: scoreMetric(result.measured.F1, result.targets.formant.F1),
      unit: common("hz"),
      note: formantReferenceNote,
      description: t("metricDescriptions.formantF1"),
      improvement: t("metricTips.formant"),
      feedback: buildFeedbackComment(
        "formantF1",
        result.measured.F1,
        result.targets.formant.F1,
        scoreMetric(result.measured.F1, result.targets.formant.F1),
      ),
    },
    {
      label: t("formantF2"),
      measured: result.measured.F2,
      target: result.targets.formant.F2,
      score: scoreMetric(result.measured.F2, result.targets.formant.F2),
      unit: common("hz"),
      note: formantReferenceNote,
      description: t("metricDescriptions.formantF2"),
      improvement: t("metricTips.formant"),
      feedback: buildFeedbackComment(
        "formantF2",
        result.measured.F2,
        result.targets.formant.F2,
        scoreMetric(result.measured.F2, result.targets.formant.F2),
      ),
    },
    {
      label: t("spectralCentroid"),
      measured: result.measured.spectralCentroid,
      target: result.targets.spectralCentroid,
      score: result.scores.spectralCentroid,
      unit: common("hz"),
      note: spectralReferenceNote,
      description: t("metricDescriptions.spectralCentroid"),
      improvement: t("metricTips.spectralCentroid"),
      feedback: buildFeedbackComment(
        "spectralCentroid",
        result.measured.spectralCentroid,
        result.targets.spectralCentroid,
        result.scores.spectralCentroid,
      ),
    },
    {
      label: t("hnr"),
      measured: result.measured.HNR,
      target: result.targets.HNR,
      score: result.scores.HNR,
      unit: common("db"),
      note: hnrReferenceNote,
      description: t("metricDescriptions.hnr"),
      improvement: t("metricTips.hnr"),
      feedback: buildFeedbackComment(
        "hnr",
        result.measured.HNR,
        result.targets.HNR,
        result.scores.HNR,
      ),
    },
    {
      label: t("intonation"),
      measured: result.measured.intonation,
      target: result.targets.intonation,
      score: result.scores.intonation,
      unit: common("oct"),
      description: t("metricDescriptions.intonation"),
      improvement: t("metricTips.intonation"),
      feedback: buildFeedbackComment(
        "intonation",
        result.measured.intonation,
        result.targets.intonation,
        result.scores.intonation,
      ),
    },
  ];

  return (
    <PageShell title={t("title")}>
      <AnimatedPage>
        <ScoreCard metrics={metrics} totalScore={result.scores.total} />

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={`/${locale}/practice`}
              className="inline-block rounded-full border border-pink-300 px-6 py-3 font-medium text-pink-600 hover:bg-pink-50"
            >
              {t("retry")}
            </Link>
          </motion.div>
          <MotionButton
            onClick={() => router.push(`/${locale}/history`)}
            className="rounded-full bg-gradient-to-r from-pink-400 to-purple-400 px-6 py-3 font-semibold text-white shadow-md disabled:opacity-60"
          >
            {t("viewHistory")}
          </MotionButton>
        </div>
      </AnimatedPage>
    </PageShell>
  );
}
