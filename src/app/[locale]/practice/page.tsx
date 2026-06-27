"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AnimatedPage } from "@/components/motion";
import { PageShell } from "@/components/Header";
import { Recorder } from "@/components/Recorder";
import { getPracticePhraseIds } from "@/lib/practice-phrases";
import { getRecommendedProfileIdForSelection } from "@/lib/targets";
import {
  useStoreHydrated,
  useVoiceTrainerStore,
} from "@/stores/voice-trainer-store";
import type { PracticePhraseId } from "@/types";

export default function PracticePage() {
  const t = useTranslations("practice");
  const phraseT = useTranslations("practicePhrases");
  const params = useParams<{ locale: string }>();
  const hasHydrated = useStoreHydrated();
  const voiceType = useVoiceTrainerStore((state) => state.voiceType);
  const phraseProfileId =
    getRecommendedProfileIdForSelection(voiceType) ?? "natural";
  const phraseIds = getPracticePhraseIds(phraseProfileId);
  const [selectedPhraseId, setSelectedPhraseId] = useState<PracticePhraseId>(
    phraseIds[0],
  );

  useEffect(() => {
    setSelectedPhraseId(phraseIds[0]);
  }, [phraseIds]);

  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      {hasHydrated ? (
        <AnimatedPage className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-700">
              {t("phraseTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("phraseSubtitle")}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {phraseIds.map((phraseId) => {
                const isSelected = selectedPhraseId === phraseId;
                return (
                  <button
                    key={phraseId}
                    type="button"
                    onClick={() => setSelectedPhraseId(phraseId)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-pink-400 bg-gradient-to-br from-pink-100 to-purple-100 text-pink-700 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-pink-200 hover:bg-pink-50"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {isSelected ? t("selectedPhrase") : t("choosePhrase")}
                    </span>
                    <p className="mt-2 text-lg font-semibold leading-8">
                      {phraseT(phraseId)}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.section>

          <Recorder locale={params.locale} promptPhraseId={selectedPhraseId} />
        </AnimatedPage>
      ) : (
        <p className="text-center text-slate-500">{t("needSettings")}</p>
      )}
    </PageShell>
  );
}
