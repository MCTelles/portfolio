/** Diagnóstico: lista as curvas do traçado (início-fim em fração da volta, raio mínimo, direção). */
import { loadCenterline, curvatureProfile } from './track-geometry';

const { samples, length } = loadCenterline(
  process.argv[2] ?? 'scripts/data/spa-francorchamps.geojson',
);
const curvature = curvatureProfile(samples, length / samples.length);
const N = samples.length;

let inside = false;
let start = 0;
let peak = 0;
let peakIndex = 0;
for (let i = 0; i <= N; i++) {
  const k = curvature[i % N] ?? 0;
  const turning = Math.abs(k) > 1 / 400;
  if (turning && !inside) [inside, start, peak] = [true, i, 0];
  if (inside && Math.abs(k) > Math.abs(peak)) [peak, peakIndex] = [k, i];
  if (!turning && inside) {
    inside = false;
    console.log(
      `${(start / N).toFixed(3)}–${(i / N).toFixed(3)}  ápice ${(peakIndex / N).toFixed(3)}  R=${(1 / Math.abs(peak)).toFixed(0)}m  ${peak > 0 ? 'direita' : 'esquerda'}`,
    );
  }
}
console.log(`comprimento: ${length.toFixed(0)} m`);
