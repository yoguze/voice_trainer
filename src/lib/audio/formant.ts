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

function findPeakInRange(
  frequencies: Float32Array,
  magnitudes: Float32Array,
  minHz: number,
  maxHz: number,
): number {
  let peakHz = (minHz + maxHz) / 2;
  let peakMag = 0;

  for (let i = 0; i < frequencies.length; i++) {
    const freq = frequencies[i];
    if (freq < minHz || freq > maxHz) continue;
    if (magnitudes[i] > peakMag) {
      peakMag = magnitudes[i];
      peakHz = freq;
    }
  }

  return peakHz;
}

export function detectFormants(
  channelData: Float32Array,
  sampleRate: number,
  fftSize = 4096,
): { F1: number; F2: number } {
  const windowSize = Math.min(fftSize, channelData.length);
  const windowed = channelData.subarray(0, windowSize);
  const magnitudes = computeMagnitudeSpectrum(windowed, fftSize);
  const binCount = magnitudes.length;
  const frequencies = new Float32Array(binCount);

  for (let i = 0; i < binCount; i++) {
    frequencies[i] = (i * sampleRate) / fftSize;
  }

  return {
    F1: findPeakInRange(frequencies, magnitudes, 200, 1000),
    F2: findPeakInRange(frequencies, magnitudes, 1000, 3000),
  };
}
