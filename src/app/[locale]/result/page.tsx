"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedPage, MotionButton } from "@/components/motion";
import { PageShell } from "@/components/Header";
import { ScoreCard } from "@/components/ScoreCard";
import { saveSession } from "@/lib/db";
import { scoreMetric } from "@/lib/scoring";
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hasHydrated && !result) {
      router.replace(`/${locale}/settings`);
    }
  }, [hasHydrated, result, locale, router]);

  if (!hasHydrated || !result) {
    return null;
  }

  const metrics = [
    {
      label: t("f0"),
      measured: result.measured.F0,
      target: result.targets.F0,
      score: result.scores.F0,
      unit: common("hz"),
    },
    {
      label: t("formantF1"),
      measured: result.measured.F1,
      target: result.targets.formant.F1,
      score: scoreMetric(result.measured.F1, result.targets.formant.F1),
      unit: common("hz"),
      note: t("formantNote"),
    },
    {
      label: t("formantF2"),
      measured: result.measured.F2,
      target: result.targets.formant.F2,
      score: scoreMetric(result.measured.F2, result.targets.formant.F2),
      unit: common("hz"),
      note: t("formantNote"),
    },
    {
      label: t("spectralCentroid"),
      measured: result.measured.spectralCentroid,
      target: result.targets.spectralCentroid,
      score: result.scores.spectralCentroid,
      unit: common("hz"),
    },
    {
      label: t("hnr"),
      measured: result.measured.HNR,
      target: result.targets.HNR,
      score: result.scores.HNR,
      unit: common("db"),
    },
    {
      label: t("intonation"),
      measured: result.measured.intonation,
      target: result.targets.intonation,
      score: result.scores.intonation,
      unit: common("oct"),
    },
  ];

  const handleSave = async () => {
    await saveSession({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      voiceType: result.voiceType,
      targets: result.targets,
      measured: result.measured,
      scores: result.scores,
    });
    setSaved(true);
    router.push(`/${locale}/history`);
  };

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
            onClick={() => void handleSave()}
            disabled={saved}
            className="rounded-full bg-gradient-to-r from-pink-400 to-purple-400 px-6 py-3 font-semibold text-white shadow-md disabled:opacity-60"
          >
            {saved ? "✓" : t("saveAndHistory")}
          </MotionButton>
        </div>
      </AnimatedPage>
    </PageShell>
  );
}
