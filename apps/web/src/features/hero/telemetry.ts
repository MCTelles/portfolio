import type { SectorIndex } from './track/lap';

/**
 * Estado da volta escrito pelo carro a cada frame (dentro do Canvas) e lido pelo HUD
 * (DOM). É um objeto mutável de propósito: atualizar 60x/s via React re-renderizaria
 * a página inteira; aqui o HUD lê no próprio requestAnimationFrame e escreve no DOM.
 */
export interface Telemetry {
  /** Falso até o 3D carregar; o HUD mostra placeholders enquanto isso. */
  live: boolean;
  lap: number;
  lapTime: number;
  progress: number;
  speedKmh: number;
  gear: number;
  sector: SectorIndex;
  corner: string | null;
  /** Tempos dos setores já fechados na volta atual. */
  sectorTimes: number[];
  lastLapTime: number | null;
}

export const telemetry: Telemetry = {
  live: false,
  lap: 1,
  lapTime: 0,
  progress: 0,
  speedKmh: 0,
  gear: 1,
  sector: 0,
  corner: null,
  sectorTimes: [],
  lastLapTime: null,
};
