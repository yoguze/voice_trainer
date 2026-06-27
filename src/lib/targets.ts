import type {
  Level,
  RecommendedVoiceProfileId,
  VoiceProfileId,
  VoiceTargets,
  VoiceTypeSelection,
} from "@/types";

const F0_TARGETS: Record<Level, number> = {
  1: 175,
  2: 197,
  3: 235,
  4: 290,
};

const FORMANT_TARGETS: Record<Level, { F1: number; F2: number }> = {
  1: { F1: 680, F2: 1600 },
  2: { F1: 720, F2: 1700 },
  3: { F1: 780, F2: 1800 },
  4: { F1: 850, F2: 2000 },
};

const SPECTRAL_CENTROID_TARGETS: Record<Level, number> = {
  1: 1400,
  2: 1700,
  3: 2100,
  4: 2600,
};

const HNR_TARGETS: Record<Level, number> = {
  1: 10,
  2: 14,
  3: 20,
  4: 24,
};

const INTONATION_TARGETS: Record<Level, number> = {
  1: 0.5,
  2: 1.0,
  3: 1.5,
  4: 2.2,
};

export type VoiceProfile = {
  id: VoiceProfileId;
  selection: VoiceTypeSelection;
  isRecommended: boolean;
};

export const RECOMMENDED_VOICE_PROFILES: Record<
  RecommendedVoiceProfileId,
  VoiceProfile
> = {
  natural: {
    id: "natural",
    selection: {
      profileId: "natural",
      pitchType: 3,
      qualityType: 3,
      intonationType: 3,
    },
    isRecommended: true,
  },
  soft: {
    id: "soft",
    selection: {
      profileId: "soft",
      pitchType: 2,
      qualityType: 2,
      intonationType: 2,
    },
    isRecommended: true,
  },
  cute: {
    id: "cute",
    selection: {
      profileId: "cute",
      pitchType: 4,
      qualityType: 4,
      intonationType: 4,
    },
    isRecommended: true,
  },
  cool: {
    id: "cool",
    selection: {
      profileId: "cool",
      pitchType: 3,
      qualityType: 4,
      intonationType: 2,
    },
    isRecommended: true,
  },
};

export const RECOMMENDED_PROFILE_IDS = Object.keys(
  RECOMMENDED_VOICE_PROFILES,
) as RecommendedVoiceProfileId[];

export function isRecommendedVoiceProfileId(
  profileId: VoiceProfileId | undefined,
): profileId is RecommendedVoiceProfileId {
  return profileId ? profileId in RECOMMENDED_VOICE_PROFILES : false;
}

export function getVoiceProfileSelection(
  profileId: VoiceProfileId,
  fallback: VoiceTypeSelection,
): VoiceTypeSelection {
  if (isRecommendedVoiceProfileId(profileId)) {
    return RECOMMENDED_VOICE_PROFILES[profileId].selection;
  }

  return { ...fallback, profileId: "custom" };
}

export function getRecommendedProfileIdForSelection(
  selection: VoiceTypeSelection,
): RecommendedVoiceProfileId | null {
  if (isRecommendedVoiceProfileId(selection.profileId)) {
    return selection.profileId;
  }

  return (
    RECOMMENDED_PROFILE_IDS.find((profileId) => {
      const profileSelection = RECOMMENDED_VOICE_PROFILES[profileId].selection;
      return (
        selection.pitchType === profileSelection.pitchType &&
        selection.qualityType === profileSelection.qualityType &&
        selection.intonationType === profileSelection.intonationType
      );
    }) ?? null
  );
}

export function buildVoiceTargets(selection: VoiceTypeSelection): VoiceTargets {
  const formant = FORMANT_TARGETS[selection.pitchType];

  return {
    F0: F0_TARGETS[selection.pitchType],
    formant: { F1: formant.F1, F2: formant.F2 },
    spectralCentroid: SPECTRAL_CENTROID_TARGETS[selection.qualityType],
    HNR: HNR_TARGETS[selection.qualityType],
    intonation: INTONATION_TARGETS[selection.intonationType],
  };
}

export const PITCH_LABELS = [
  "deepAlto",
  "alto",
  "middle",
  "soprano",
] as const;

export const QUALITY_LABELS = [
  "deepSoft",
  "soft",
  "clear",
  "bright",
] as const;

export const INTONATION_LABELS = [
  "flat",
  "calm",
  "natural",
  "active",
] as const;
