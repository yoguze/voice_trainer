import { detectPitch } from "@/lib/audio/pitch";

const LPC_ORDER = 14;
const LPC_SPECTRUM_SIZE = 4096;
const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const MIN_FRAME_RMS = 0.01;

function preEmphasize(
  samples: Float32Array,
  coefficient = 0.97,
): Float32Array {
  const output = new Float32Array(samples.length);
  output[0] = samples[0];

  for (let i = 1; i < samples.length; i++) {
    output[i] = samples[i] - coefficient * samples[i - 1];
  }

  return output;
}

function applyHammingWindow(samples: Float32Array): Float32Array {
  const output = new Float32Array(samples.length);
  const lastIndex = Math.max(samples.length - 1, 1);

  for (let i = 0; i < samples.length; i++) {
    const window =
      0.54 - 0.46 * Math.cos((2 * Math.PI * i) / lastIndex);
    output[i] = samples[i] * window;
  }

  return output;
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

function autocorrelation(
  samples: Float32Array,
  maxLag: number,
): Float32Array {
  const result = new Float32Array(maxLag + 1);

  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < samples.length - lag; i++) {
      sum += samples[i] * samples[i + lag];
    }
    result[lag] = sum;
  }

  return result;
}

function levinsonDurbin(
  autocorr: Float32Array,
  order: number,
): Float32Array | null {
  const coefficients = new Float32Array(order + 1);
  coefficients[0] = 1;

  let error = autocorr[0];
  if (error <= 0) return null;

  for (let i = 1; i <= order; i++) {
    let sum = 0;
    for (let j = 1; j < i; j++) {
      sum += coefficients[j] * autocorr[i - j];
    }

    const reflection = (autocorr[i] - sum) / error;
    coefficients[i] = reflection;

    for (let j = 1; j < i; j++) {
      coefficients[j] -= reflection * coefficients[i - j];
    }

    error *= 1 - reflection * reflection;
    if (error <= 0) return null;
  }

  return coefficients;
}

function computeLpcEnvelope(
  coefficients: Float32Array,
  spectrumSize: number,
): Float32Array {
  const magnitudes = new Float32Array(spectrumSize / 2);

  for (let bin = 0; bin < magnitudes.length; bin++) {
    const omega = (2 * Math.PI * bin) / spectrumSize;
    let real = 1;
    let imag = 0;

    for (let i = 1; i < coefficients.length; i++) {
      real += coefficients[i] * Math.cos(i * omega);
      imag -= coefficients[i] * Math.sin(i * omega);
    }

    magnitudes[bin] = 1 / Math.sqrt(real * real + imag * imag);
  }

  return magnitudes;
}

function frequencyToBin(frequency: number, sampleRate: number, fftSize: number) {
  return Math.round((frequency * fftSize) / sampleRate);
}

function attenuateHarmonics(
  magnitudes: Float32Array,
  sampleRate: number,
  f0: number,
  fftSize: number,
): Float32Array {
  const masked = magnitudes.slice();
  const halfWidth = Math.max(1, frequencyToBin(40, sampleRate, fftSize));

  for (let harmonic = 1; harmonic <= 10; harmonic++) {
    const center = frequencyToBin(f0 * harmonic, sampleRate, fftSize);
    for (let bin = center - halfWidth; bin <= center + halfWidth; bin++) {
      if (bin >= 0 && bin < masked.length) {
        masked[bin] *= 0.15;
      }
    }
  }

  return masked;
}

function findPeakFrequency(
  magnitudes: Float32Array,
  sampleRate: number,
  fftSize: number,
  minHz: number,
  maxHz: number,
): number | null {
  let peakHz: number | null = null;
  let peakMag = 0;

  for (let bin = 1; bin < magnitudes.length - 1; bin++) {
    const frequency = (bin * sampleRate) / fftSize;
    if (frequency < minHz || frequency > maxHz) continue;

    const magnitude = magnitudes[bin];
    if (
      magnitude > magnitudes[bin - 1] &&
      magnitude > magnitudes[bin + 1] &&
      magnitude > peakMag
    ) {
      peakMag = magnitude;
      peakHz = frequency;
    }
  }

  return peakHz;
}

function estimateFrameFormantsFromEnvelope(
  envelope: Float32Array,
  sampleRate: number,
  spectrumSize: number,
): { F1: number; F2: number } | null {
  const F1 = findPeakFrequency(envelope, sampleRate, spectrumSize, 250, 900);
  if (F1 === null) return null;

  const F2 = findPeakFrequency(
    envelope,
    sampleRate,
    spectrumSize,
    Math.max(900, F1 + 200),
    3500,
  );
  if (F2 === null || F2 <= F1) return null;

  return { F1, F2 };
}

function estimateFrameFormantsWithLpc(
  frame: Float32Array,
  sampleRate: number,
): { F1: number; F2: number } | null {
  const windowed = applyHammingWindow(preEmphasize(frame));
  const autocorr = autocorrelation(windowed, LPC_ORDER);
  const coefficients = levinsonDurbin(autocorr, LPC_ORDER);
  if (!coefficients) return null;

  const envelope = computeLpcEnvelope(coefficients, LPC_SPECTRUM_SIZE);
  return estimateFrameFormantsFromEnvelope(
    envelope,
    sampleRate,
    LPC_SPECTRUM_SIZE,
  );
}

function estimateFrameFormantsWithMaskedFft(
  frame: Float32Array,
  sampleRate: number,
  f0: number,
): { F1: number; F2: number } | null {
  const magnitudes = computeMagnitudeSpectrum(frame, FRAME_SIZE);
  const masked = attenuateHarmonics(magnitudes, sampleRate, f0, FRAME_SIZE);
  return estimateFrameFormantsFromEnvelope(masked, sampleRate, FRAME_SIZE);
}

function estimateFrameFormants(
  frame: Float32Array,
  sampleRate: number,
  f0: number,
): { F1: number; F2: number } | null {
  return (
    estimateFrameFormantsWithLpc(frame, sampleRate) ??
    estimateFrameFormantsWithMaskedFft(frame, sampleRate, f0)
  );
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

export function detectFormants(
  channelData: Float32Array,
  sampleRate: number,
): { F1: number; F2: number } {
  const f1Values: number[] = [];
  const f2Values: number[] = [];

  for (
    let start = 0;
    start + FRAME_SIZE <= channelData.length;
    start += HOP_SIZE
  ) {
    const frame = channelData.subarray(start, start + FRAME_SIZE);
    if (frameRms(frame) < MIN_FRAME_RMS) continue;

    const pitch = detectPitch(frame, sampleRate);
    if (pitch === null) continue;

    const formants = estimateFrameFormants(frame, sampleRate, pitch);
    if (!formants) continue;

    f1Values.push(formants.F1);
    f2Values.push(formants.F2);
  }

  if (f1Values.length === 0 || f2Values.length === 0) {
    return { F1: 0, F2: 0 };
  }

  return {
    F1: median(f1Values),
    F2: median(f2Values),
  };
}
