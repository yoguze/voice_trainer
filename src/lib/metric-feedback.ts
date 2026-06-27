export type FeedbackMetricKey =
  | "f0"
  | "formantF1"
  | "formantF2"
  | "spectralCentroid"
  | "hnr"
  | "intonation";

export type FeedbackDirection = "high" | "low";

export type FeedbackScoreBand =
  | "near"
  | "noticeable"
  | "large"
  | "veryLarge"
  | "extreme";

export type MetricFeedback =
  | {
      isOnTarget: true;
    }
  | {
      isOnTarget: false;
      direction: FeedbackDirection;
      band: FeedbackScoreBand;
    };

export function getMetricFeedback(
  measured: number,
  target: number,
  score: number,
): MetricFeedback {
  if (score >= 100) {
    return { isOnTarget: true };
  }

  return {
    isOnTarget: false,
    direction: measured > target ? "high" : "low",
    band: getFeedbackScoreBand(score),
  };
}

function getFeedbackScoreBand(score: number): FeedbackScoreBand {
  if (score >= 80) return "near";
  if (score >= 60) return "noticeable";
  if (score >= 40) return "large";
  if (score >= 20) return "veryLarge";
  return "extreme";
}
