import type { PracticePhraseId, RecommendedVoiceProfileId } from "@/types";

export const PRACTICE_PHRASE_IDS_BY_PROFILE: Record<
  RecommendedVoiceProfileId,
  PracticePhraseId
> = {
  natural: "naturalPrompt",
  soft: "softPrompt",
  cute: "cutePrompt",
  cool: "coolPrompt",
};

export function getPracticePhraseId(
  profileId: RecommendedVoiceProfileId,
): PracticePhraseId {
  return PRACTICE_PHRASE_IDS_BY_PROFILE[profileId];
}
