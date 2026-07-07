import type { MeasuredValues, Scores, VoiceTargets } from "@/types";

const PERFECT_DEVIATION = 0.05;
const MAX_DEVIATION = 0.4;

export function scoreMetric(measured: number, target: number): number {
  if (target === 0) return 0;

  const deviation = Math.abs(measured - target) / target;

  if (deviation <= PERFECT_DEVIATION) return 100;

  const score =
    100 *
    (1 -
      (deviation - PERFECT_DEVIATION) /
        (MAX_DEVIATION - PERFECT_DEVIATION));

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function scoreStars(score: number): string {
  if (score >= 100) return "⭐⭐⭐⭐⭐";
  if (score >= 80) return "⭐⭐⭐⭐";
  if (score >= 60) return "⭐⭐⭐";
  if (score >= 40) return "⭐⭐";
  if (score >= 20) return "⭐";
  return "💀";
}

export function computeScores(
  measured: MeasuredValues,
  targets: VoiceTargets,
): Scores {
  const f0Score = scoreMetric(measured.F0, targets.F0);
  const f1Score = scoreMetric(measured.F1, targets.formant.F1);
  const f2Score = scoreMetric(measured.F2, targets.formant.F2);
  const formantScore = Math.round((f1Score + f2Score) / 2);
  const spectralScore = scoreMetric(
    measured.spectralCentroid,
    targets.spectralCentroid,
  );
  const hnrScore = scoreMetric(measured.HNR, targets.HNR);
  const intonationScore = scoreMetric(measured.intonation, targets.intonation);

  const total = Math.round(
    formantScore * 0.3 +
      f0Score * 0.25 +
      spectralScore * 0.2 +
      hnrScore * 0.15 +
      intonationScore * 0.1,
  );

  return {
    F0: f0Score,
    formant: formantScore,
    spectralCentroid: spectralScore,
    HNR: hnrScore,
    intonation: intonationScore,
    total,
  };
}
