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

export function computeSpectralCentroid(
  channelData: Float32Array,
  sampleRate: number,
  fftSize = 4096,
): number {
  const magnitudes = computeMagnitudeSpectrum(
    channelData.subarray(0, Math.min(fftSize, channelData.length)),
    fftSize,
  );

  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < magnitudes.length; i++) {
    const frequency = (i * sampleRate) / fftSize;
    weightedSum += frequency * magnitudes[i];
    magnitudeSum += magnitudes[i];
  }

  if (magnitudeSum === 0) return 0;
  return weightedSum / magnitudeSum;
}

export function computeHNR(
  channelData: Float32Array,
  sampleRate: number,
): number {
  const minPeriod = Math.floor(sampleRate / 500);
  const maxPeriod = Math.ceil(sampleRate / 80);

  let bestOffset = minPeriod;
  let bestCorrelation = 0;
  let zeroLagEnergy = 0;

  for (let i = 0; i < channelData.length; i++) {
    zeroLagEnergy += channelData[i] * channelData[i];
  }

  if (zeroLagEnergy === 0) return 0;

  for (let offset = minPeriod; offset <= maxPeriod; offset++) {
    let correlation = 0;
    for (let i = 0; i < channelData.length - offset; i++) {
      correlation += channelData[i] * channelData[i + offset];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  const harmonicEnergy = bestCorrelation / bestOffset;
  const totalEnergy = zeroLagEnergy / channelData.length;
  const noiseEnergy = Math.max(totalEnergy - harmonicEnergy, 1e-10);

  const ratio = harmonicEnergy / noiseEnergy;
  return 10 * Math.log10(Math.max(ratio, 1e-10));
}
