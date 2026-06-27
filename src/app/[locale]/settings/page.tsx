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
  RECOMMENDED_PROFILE_IDS,
  isRecommendedVoiceProfileId,
} from "@/lib/targets";
import { useVoiceTrainerStore } from "@/stores/voice-trainer-store";
import type { Level, VoiceProfileId } from "@/types";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const pitchT = useTranslations("pitchTypes");
  const qualityT = useTranslations("qualityTypes");
  const intonationT = useTranslations("intonationTypes");
  const profileT = useTranslations("voiceProfiles");
  const locale = useLocale();

  const voiceType = useVoiceTrainerStore((state) => state.voiceType);
  const setVoiceType = useVoiceTrainerStore((state) => state.setVoiceType);
  const setVoiceProfile = useVoiceTrainerStore(
    (state) => state.setVoiceProfile,
  );
  const selectedProfileId = voiceType.profileId ?? "custom";
  const isCustom = !isRecommendedVoiceProfileId(selectedProfileId);
  const profileOptions: VoiceProfileId[] = [
    ...RECOMMENDED_PROFILE_IDS,
    "custom",
  ];

  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <AnimatedPage className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-700">
            {t("profileTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("profileSubtitle")}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {profileOptions.map((profileId) => {
              const isSelected = selectedProfileId === profileId;

              return (
                <motion.button
                  key={profileId}
                  type="button"
                  onClick={() => setVoiceProfile(profileId)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-pink-400 bg-gradient-to-br from-pink-100 to-purple-100 text-pink-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-pink-200 hover:bg-pink-50"
                  }`}
                >
                  <h3 className="font-semibold">
                    {profileT(`${profileId}.name`)}
                  </h3>
                  <p className="mt-1 text-sm leading-6">
                    {profileT(`${profileId}.description`)}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {isCustom ? (
          <>
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
              onSelect={(level: Level) =>
                setVoiceType({ intonationType: level })
              }
              getLabel={(key) => intonationT(key)}
              delay={0.15}
            />
          </>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-purple-100 bg-purple-50 p-5"
          >
            <h2 className="text-lg font-semibold text-purple-800">
              {t("lockedProfileTitle")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-purple-700">
              {t("lockedProfileDescription")}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-purple-700 sm:grid-cols-3">
              <span>
                {t("pitchAxis")}:{" "}
                {pitchT(PITCH_LABELS[voiceType.pitchType - 1])}
              </span>
              <span>
                {t("qualityAxis")}:{" "}
                {qualityT(QUALITY_LABELS[voiceType.qualityType - 1])}
              </span>
              <span>
                {t("intonationAxis")}:{" "}
                {intonationT(INTONATION_LABELS[voiceType.intonationType - 1])}
              </span>
            </div>
          </motion.section>
        )}

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
