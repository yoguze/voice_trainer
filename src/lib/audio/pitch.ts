const MIN_F0 = 80;
const MAX_F0 = 500;

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
): number | null {
  const minPeriod = Math.floor(sampleRate / MAX_F0);
  const maxPeriod = Math.ceil(sampleRate / MIN_F0);

  if (buffer.length < maxPeriod * 2) return null;

  let bestOffset = -1;
  let bestCorrelation = 0;

  for (let offset = minPeriod; offset <= maxPeriod; offset++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestOffset <= 0 || bestCorrelation <= 0) return null;

  const frequency = sampleRate / bestOffset;
  if (frequency < MIN_F0 || frequency > MAX_F0) return null;

  return frequency;
}

export function clampF0(value: number): number {
  return Math.min(MAX_F0, Math.max(MIN_F0, value));
}

export function analyzeF0Series(
  channelData: Float32Array,
  sampleRate: number,
  frameSize = 2048,
  hopSize = 1024,
): number[] {
  const pitches: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.subarray(start, start + frameSize);
    const pitch = detectPitch(frame, sampleRate);
    if (pitch !== null) {
      pitches.push(clampF0(pitch));
    }
  }

  return pitches;
}

export function averageF0(pitches: number[]): number {
  if (pitches.length === 0) return MIN_F0;
  const sum = pitches.reduce((acc, value) => acc + value, 0);
  return clampF0(sum / pitches.length);
}
