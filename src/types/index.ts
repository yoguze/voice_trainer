export type Level = 1 | 2 | 3 | 4;

export type VoiceTypeSelection = {
  pitchType: Level;
  qualityType: Level;
  intonationType: Level;
};

export type VoiceTargets = {
  F0: number;
  formant: {
    F1: number;
    F2: number;
  };
  spectralCentroid: number;
  HNR: number;
  intonation: number;
};

export type MeasuredValues = {
  F0: number;
  F1: number;
  F2: number;
  spectralCentroid: number;
  HNR: number;
  intonation: number;
};

export type Scores = {
  F0: number;
  formant: number;
  spectralCentroid: number;
  HNR: number;
  intonation: number;
  total: number;
};

export type Session = {
  id: string;
  createdAt: number;
  voiceType: VoiceTypeSelection;
  targets: VoiceTargets;
  measured: MeasuredValues;
  scores: Scores;
};

export type PracticeResult = {
  voiceType: VoiceTypeSelection;
  targets: VoiceTargets;
  measured: MeasuredValues;
  scores: Scores;
};
