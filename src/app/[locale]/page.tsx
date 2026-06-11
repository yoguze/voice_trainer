"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { AnimatedPage } from "@/components/motion";
import { PageShell } from "@/components/Header";
import { VoiceTypeSelector } from "@/components/VoiceTypeSelector";
import {
  INTONATION_LABELS,
  PITCH_LABELS,
  QUALITY_LABELS,
} from "@/lib/targets";
import { useVoiceTrainerStore } from "@/stores/voice-trainer-store";
import type { Level } from "@/types";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const pitchT = useTranslations("pitchTypes");
  const qualityT = useTranslations("qualityTypes");
  const intonationT = useTranslations("intonationTypes");
  const locale = useLocale();

  const voiceType = useVoiceTrainerStore((state) => state.voiceType);
  const setVoiceType = useVoiceTrainerStore((state) => state.setVoiceType);

  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <AnimatedPage className="space-y-6">
        <VoiceTypeSelector
          title={t("pitchAxis")}
          labels={PITCH_LABELS}
          selected={voiceType.pitchType}
          onSelect={(level: Level) => setVoiceType({ pitchType: level })}
          getLabel={(key) => pitchT(key)}
          delay={0.05}
        />
        <VoiceTypeSelector
          title={t("qualityAxis")}
          labels={QUALITY_LABELS}
          selected={voiceType.qualityType}
          onSelect={(level: Level) => setVoiceType({ qualityType: level })}
          getLabel={(key) => qualityT(key)}
          delay={0.1}
        />
        <VoiceTypeSelector
          title={t("intonationAxis")}
          labels={INTONATION_LABELS}
          selected={voiceType.intonationType}
          onSelect={(level: Level) => setVoiceType({ intonationType: level })}
          getLabel={(key) => intonationT(key)}
          delay={0.15}
        />

        <div className="pt-4 text-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={`/${locale}/practice`}
              className="inline-flex rounded-full bg-gradient-to-r from-pink-400 to-purple-400 px-8 py-3 font-semibold text-white shadow-lg"
            >
              {t("startPractice")}
            </Link>
          </motion.div>
        </div>
      </AnimatedPage>
    </PageShell>
  );
}
