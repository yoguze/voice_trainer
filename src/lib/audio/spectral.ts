import { detectPitch } from "@/lib/audio/pitch";

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const MIN_FRAME_RMS = 0.01;
const CENTROID_MIN_HZ = 200;
const CENTROID_MAX_HZ = 5000;

function computeMagnitudeSpectrum(
  samples: Float32Array,
  fftSize: number,
): Float32Array {
  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);

  for (let i = 0; i < Math.min(samples.length, fftSize); i++) {
    const window =
      0.5 * (1 - Math.cos((2 * Math.PI * i) / (Math.max(fftSize - 1, 1))));
    real[i] = samples[i] * window;
  }

  fft(real, imag);

  const magnitudes = new Float32Array(fftSize / 2);
  for (let i = 0; i < magnitudes.length; i++) {
    magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }

  return magnitudes;
}

function fft(real: Float32Array, imag: Float32Array): void {
  const n = real.length;
  if (n <= 1) return;

  const evenReal = new Float32Array(n / 2);
  const evenImag = new Float32Array(n / 2);
  const oddReal = new Float32Array(n / 2);
  const oddImag = new Float32Array(n / 2);

  for (let i = 0; i < n / 2; i++) {
    evenReal[i] = real[i * 2];
    evenImag[i] = imag[i * 2];
    oddReal[i] = real[i * 2 + 1];
    oddImag[i] = imag[i * 2 + 1];
  }

  fft(evenReal, evenImag);
  fft(oddReal, oddImag);

  for (let k = 0; k < n / 2; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tReal = cos * oddReal[k] - sin * oddImag[k];
    const tImag = sin * oddReal[k] + cos * oddImag[k];

    real[k] = evenReal[k] + tReal;
    imag[k] = evenImag[k] + tImag;
    real[k + n / 2] = evenReal[k] - tReal;
    imag[k + n / 2] = evenImag[k] - tImag;
  }
}

function frameRms(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) {
    sum += frame[i] * frame[i];
  }
  return Math.sqrt(sum / frame.length);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

function computeFrameSpectralCentroid(
  frame: Float32Array,
  sampleRate: number,
  fftSize = FRAME_SIZE,
): number | null {
  const magnitudes = computeMagnitudeSpectrum(frame, fftSize);
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < magnitudes.length; i++) {
    const frequency = (i * sampleRate) / fftSize;
    if (frequency < CENTROID_MIN_HZ || frequency > CENTROID_MAX_HZ) continue;

    weightedSum += frequency * magnitudes[i];
    magnitudeSum += magnitudes[i];
  }

  if (magnitudeSum === 0) return null;
  return weightedSum / magnitudeSum;
}

export function computeSpectralCentroid(
  channelData: Float32Array,
  sampleRate: number,
): number {
  const centroidValues: number[] = [];

  for (
    let start = 0;
    start + FRAME_SIZE <= channelData.length;
    start += HOP_SIZE
  ) {
    const frame = channelData.subarray(start, start + FRAME_SIZE);
    if (frameRms(frame) < MIN_FRAME_RMS) continue;
    if (detectPitch(frame, sampleRate) === null) continue;

    const centroid = computeFrameSpectralCentroid(frame, sampleRate);
    if (centroid !== null && Number.isFinite(centroid)) {
      centroidValues.push(centroid);
    }
  }

  return median(centroidValues);
}

function computeFrameHNR(frame: Float32Array, period: number): number | null {
  if (period <= 0 || frame.length <= period) return null;

  let zeroLag = 0;
  let correlation = 0;

  for (let i = 0; i < frame.length - period; i++) {
    zeroLag += frame[i] * frame[i];
    correlation += frame[i] * frame[i + period];
  }

  if (zeroLag === 0) return null;

  const normalizedCorrelation = correlation / zeroLag;
  if (normalizedCorrelation <= 0) return null;

  const r = Math.min(0.999, Math.max(0.001, normalizedCorrelation));
  return 10 * Math.log10(r / (1 - r));
}

export function computeHNR(
  channelData: Float32Array,
  sampleRate: number,
): number {
  const hnrValues: number[] = [];

  for (
    let start = 0;
    start + FRAME_SIZE <= channelData.length;
    start += HOP_SIZE
  ) {
    const frame = channelData.subarray(start, start + FRAME_SIZE);
    if (frameRms(frame) < MIN_FRAME_RMS) continue;

    const pitch = detectPitch(frame, sampleRate);
    if (pitch === null) continue;

    const period = Math.round(sampleRate / pitch);
    const hnr = computeFrameHNR(frame, period);
    if (hnr !== null && Number.isFinite(hnr)) {
      hnrValues.push(hnr);
    }
  }

  return median(hnrValues);
}
