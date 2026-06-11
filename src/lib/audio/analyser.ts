import { detectFormants } from "@/lib/audio/formant";
import { computeIntonationWidth } from "@/lib/audio/intonation";
import {
  analyzeF0Series,
  averageF0,
} from "@/lib/audio/pitch";
import { computeHNR, computeSpectralCentroid } from "@/lib/audio/spectral";
import { computeScores } from "@/lib/scoring";
import type { MeasuredValues, PracticeResult, VoiceTargets } from "@/types";
import type { VoiceTypeSelection } from "@/types";

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  try {
    return await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioCtx.close();
  }
}

export function analyzeAudioBuffer(audioBuffer: AudioBuffer): MeasuredValues {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  const pitches = analyzeF0Series(channelData, sampleRate);
  const F0 = averageF0(pitches);
  const { F1, F2 } = detectFormants(channelData, sampleRate);
  const spectralCentroid = computeSpectralCentroid(channelData, sampleRate);
  const HNR = computeHNR(channelData, sampleRate);
  const intonation = computeIntonationWidth(pitches);

  return {
    F0,
    F1,
    F2,
    spectralCentroid,
    HNR: Math.max(0, Math.min(HNR, 40)),
    intonation,
  };
}

export function buildPracticeResult(
  voiceType: VoiceTypeSelection,
  targets: VoiceTargets,
  measured: MeasuredValues,
): PracticeResult {
  return {
    voiceType,
    targets,
    measured,
    scores: computeScores(measured, targets),
  };
}

export async function analyzeRecording(
  blob: Blob,
  voiceType: VoiceTypeSelection,
  targets: VoiceTargets,
): Promise<PracticeResult> {
  const audioBuffer = await decodeAudioBlob(blob);
  const measured = analyzeAudioBuffer(audioBuffer);
  return buildPracticeResult(voiceType, targets, measured);
}
