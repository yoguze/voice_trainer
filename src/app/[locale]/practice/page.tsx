"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AnimatedPage } from "@/components/motion";
import { PageShell } from "@/components/Header";
import { Recorder } from "@/components/Recorder";
import { getPracticePhraseId } from "@/lib/practice-phrases";
import { getRecommendedProfileIdForSelection } from "@/lib/targets";
import {
  useStoreHydrated,
  useVoiceTrainerStore,
} from "@/stores/voice-trainer-store";

export default function PracticePage() {
  const t = useTranslations("practice");
  const phraseT = useTranslations("practicePhrases");
  const resultT = useTranslations("result");
  const params = useParams<{ locale: string }>();
  const hasHydrated = useStoreHydrated();
  const voiceType = useVoiceTrainerStore((state) => state.voiceType);
  const phraseProfileId =
    getRecommendedProfileIdForSelection(voiceType) ?? "natural";
  const phraseId = getPracticePhraseId(phraseProfileId);

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
            <div className="mt-4 rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 p-5 text-pink-700">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {t("readPhrase")}
              </span>
              <p className="mt-2 text-xl font-semibold leading-9">
                {phraseT(phraseId)}
              </p>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {t("formantNotice")}
            </p>
            <p className="mt-1 text-xs leading-5 text-purple-600">
              {resultT(`formantReferences.${phraseProfileId}`)}
            </p>
          </motion.section>

          <Recorder locale={params.locale} promptPhraseId={phraseId} />
        </AnimatedPage>
      ) : (
        <p className="text-center text-slate-500">{t("needSettings")}</p>
      )}
    </PageShell>
  );
}
