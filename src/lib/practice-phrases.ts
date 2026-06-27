import type { PracticePhraseId, RecommendedVoiceProfileId } from "@/types";

export const PRACTICE_PHRASE_IDS_BY_PROFILE: Record<
  RecommendedVoiceProfileId,
  readonly [PracticePhraseId, PracticePhraseId]
> = {
  natural: ["naturalMorning", "naturalShopping"],
  soft: ["softReassure", "softWait"],
  cute: ["cuteTogether", "cuteLook"],
  cool: ["coolPace", "coolStep"],
};

export function getPracticePhraseIds(
  profileId: RecommendedVoiceProfileId,
): readonly [PracticePhraseId, PracticePhraseId] {
  return PRACTICE_PHRASE_IDS_BY_PROFILE[profileId];
}
