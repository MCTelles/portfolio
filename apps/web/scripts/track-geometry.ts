import { readFileSync } from 'node:fs';
import { CatmullRomCurve3, Vector3 } from 'three';

const METERS_PER_DEGREE_LAT = 110_540;
const METERS_PER_DEGREE_LON_AT_EQUATOR = 111_320;
/** ~5 m entre amostras: resolução suficiente para curvatura e simulação de volta. */
const SAMPLE_SPACING_M = 5;

interface LineStringFeature {
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

/**
 * Lê o GeoJSON e devolve a linha central reamostrada em espaçamento uniforme, em metros:
 * x = leste, z = sul (convenção do three.js, onde -z "entra" na tela).
 */
export function loadCenterline(path: string, sampleMultiple = 1) {
  const geojson = JSON.parse(readFileSync(path, 'utf8')) as { features: LineStringFeature[] };
  const coordinates = geojson.features[0]?.geometry.coordinates;
  if (!coordinates) throw new Error(`Nenhum LineString em ${path}`);

  // O último ponto repete o primeiro (traçado fechado)
  const open = coordinates.slice(0, -1);
  const lon0 = open.reduce((sum, [lon]) => sum + lon, 0) / open.length;
  const lat0 = open.reduce((sum, [, lat]) => sum + lat, 0) / open.length;
  const lonScale = Math.cos((lat0 * Math.PI) / 180) * METERS_PER_DEGREE_LON_AT_EQUATOR;

  const points = open.map(
    ([lon, lat]) => new Vector3((lon - lon0) * lonScale, 0, -(lat - lat0) * METERS_PER_DEGREE_LAT),
  );

  const curve = new CatmullRomCurve3(points, true, 'centripetal');
  // A tabela padrão de 200 trechos pula curvas em circuitos com centenas de pontos.
  // A distância precisa ser resolvida antes de reamostrar em intervalos de ~5 m.
  curve.arcLengthDivisions = Math.max(2000, points.length * 24);
  const length = curve.getLength();
  // O gerador reduz a resolução depois; fechar em um múltiplo mantém o último
  // intervalo tão longo quanto os demais e alinha pontos, offsets e tempos.
  const count = Math.round(length / SAMPLE_SPACING_M / sampleMultiple) * sampleMultiple;
  const samples = curve.getSpacedPoints(count).slice(0, count); // spaced points repete o 1º no fim

  return { samples, length };
}

const wrapAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

/**
 * Curvatura assinada (1/m) em cada amostra, suavizada numa janela de ±`window` amostras
 * para não confundir ruído do GPS com curva. Positivo = curva à direita.
 * `spacing` é a distância entre amostras (número) ou o comprimento de cada segmento i → i+1.
 */
export function curvatureProfile(
  samples: Vector3[],
  spacing: number | readonly number[],
  window = 5,
): number[] {
  const n = samples.length;
  const at = (i: number) => samples[((i % n) + n) % n] as Vector3;

  const raw = samples.map((_, i) => {
    const [a, b, c] = [at(i - 1), at(i), at(i + 1)];
    const before = Math.atan2(b.z - a.z, b.x - a.x);
    const after = Math.atan2(c.z - b.z, c.x - b.x);
    // Espaçamento local: uniforme na linha central, variável na trajetória de corrida
    const ds =
      typeof spacing === 'number'
        ? spacing
        : ((spacing[(i - 1 + n) % n] as number) + (spacing[i] as number)) / 2;
    return wrapAngle(after - before) / ds;
  });

  return raw.map((_, i) => {
    let sum = 0;
    for (let j = -window; j <= window; j++) sum += raw[(((i + j) % n) + n) % n] as number;
    return sum / (2 * window + 1);
  });
}
