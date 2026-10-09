export interface CornerMeta {
  name: string;
  from: number;
  to: number;
  labeled?: boolean;
}

/** Dados leves do circuito (vão no bundle principal: o HUD precisa deles). */
export interface CircuitMeta {
  id: string;
  name: string;
  code: string;
  country: string;
  lengthKm: number;
  lapTimeSeconds: number;
  sectorEnds: readonly [number, number];
  sectorTimes: readonly number[];
  topSpeedKmh: number;
  corners: readonly CornerMeta[];
}

/** Geometria e simulação (vão só no chunk do 3D). */
export interface CircuitPath {
  /** Linha central em unidades da cena: [x, y, z] intercalados, espaçamento uniforme. */
  points: readonly number[];
  /** Velocidade simulada (km/h) na trajetória de corrida, em cada amostra da linha central. */
  speedsKmh: readonly number[];
  /** Tempo de volta acumulado (s) em cada ponto. */
  times: readonly number[];
  /**
   * Deslocamento lateral da trajetória de corrida em cada ponto, de −1 a 1 da meia largura
   * útil da pista (positivo = lado de cross(tangente, cima)).
   */
  racingOffsets: readonly number[];
}
