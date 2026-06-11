import type { Level, VoiceTargets, VoiceTypeSelection } from "@/types";

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
