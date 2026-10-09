// Arquivo gerado por scripts/build-track-data.ts. Não edite à mão.
// Traçados: bacinger/f1-circuits (MIT).

import type { CircuitMeta } from '../types';

export const CIRCUIT_IDS = ['spa', 'interlagos', 'monaco', 'yas-marina'] as const;
export type CircuitId = (typeof CIRCUIT_IDS)[number];

export const CIRCUIT_META: Record<CircuitId, CircuitMeta> = {
  spa: {
    id: 'spa',
    name: 'Spa-Francorchamps',
    code: 'BEL',
    country: 'Bélgica',
    lengthKm: 7.004,
    lapTimeSeconds: 102.674,
    sectorEnds: [0.318, 0.735],
    sectorTimes: [29.38, 47.421, 25.872],
    topSpeedKmh: 327,
    corners: [
      {
        name: 'La Source',
        from: 0.018,
        to: 0.05,
        labeled: true,
      },
      {
        name: 'Eau Rouge',
        from: 0.112,
        to: 0.136,
        labeled: true,
      },
      {
        name: 'Raidillon',
        from: 0.136,
        to: 0.172,
      },
      {
        name: 'Reta Kemmel',
        from: 0.172,
        to: 0.312,
      },
      {
        name: 'Les Combes',
        from: 0.312,
        to: 0.348,
        labeled: true,
      },
      {
        name: 'Malmedy',
        from: 0.348,
        to: 0.372,
      },
      {
        name: 'Rivage',
        from: 0.398,
        to: 0.465,
      },
      {
        name: 'Pouhon',
        from: 0.51,
        to: 0.575,
        labeled: true,
      },
      {
        name: 'Fagnes',
        from: 0.605,
        to: 0.66,
      },
      {
        name: 'Campus',
        from: 0.672,
        to: 0.7,
      },
      {
        name: 'Stavelot',
        from: 0.7,
        to: 0.735,
        labeled: true,
      },
      {
        name: 'Blanchimont',
        from: 0.8,
        to: 0.88,
        labeled: true,
      },
      {
        name: 'Bus Stop',
        from: 0.925,
        to: 0.965,
        labeled: true,
      },
      {
        name: 'Reta dos boxes',
        from: 0.965,
        to: 1,
      },
    ],
  },
  interlagos: {
    id: 'interlagos',
    name: 'Interlagos',
    code: 'BRA',
    country: 'Brasil',
    lengthKm: 4.309,
    lapTimeSeconds: 69.444,
    sectorEnds: [0.3, 0.765],
    sectorTimes: [18.658, 38.256, 12.53],
    topSpeedKmh: 326,
    corners: [
      {
        name: 'S do Senna',
        from: 0.05,
        to: 0.108,
        labeled: true,
      },
      {
        name: 'Curva do Sol',
        from: 0.108,
        to: 0.175,
        labeled: true,
      },
      {
        name: 'Reta Oposta',
        from: 0.175,
        to: 0.305,
      },
      {
        name: 'Descida do Lago',
        from: 0.305,
        to: 0.39,
        labeled: true,
      },
      {
        name: 'Ferradura',
        from: 0.45,
        to: 0.51,
        labeled: true,
      },
      {
        name: 'Laranjinha',
        from: 0.515,
        to: 0.55,
      },
      {
        name: 'Pinheirinho',
        from: 0.55,
        to: 0.592,
      },
      {
        name: 'Bico de Pato',
        from: 0.592,
        to: 0.652,
        labeled: true,
      },
      {
        name: 'Mergulho',
        from: 0.655,
        to: 0.712,
        labeled: true,
      },
      {
        name: 'Junção',
        from: 0.735,
        to: 0.766,
        labeled: true,
      },
      {
        name: 'Subida dos Boxes',
        from: 0.766,
        to: 0.92,
      },
      {
        name: 'Reta dos boxes',
        from: 0.92,
        to: 1,
      },
    ],
  },
  monaco: {
    id: 'monaco',
    name: 'Monaco',
    code: 'MON',
    country: 'Mônaco',
    lengthKm: 3.337,
    lapTimeSeconds: 69.824,
    sectorEnds: [0.3, 0.7],
    sectorTimes: [17.18, 30.549, 22.095],
    topSpeedKmh: 309,
    corners: [
      {
        name: 'Sainte Dévote',
        from: 0.07,
        to: 0.105,
        labeled: true,
      },
      {
        name: 'Beau Rivage',
        from: 0.105,
        to: 0.222,
      },
      {
        name: 'Massenet',
        from: 0.222,
        to: 0.285,
        labeled: true,
      },
      {
        name: 'Casino',
        from: 0.285,
        to: 0.32,
        labeled: true,
      },
      {
        name: 'Mirabeau',
        from: 0.35,
        to: 0.385,
      },
      {
        name: 'Grand Hotel Hairpin',
        from: 0.39,
        to: 0.475,
        labeled: true,
      },
      {
        name: 'Mirabeau Bas',
        from: 0.505,
        to: 0.545,
      },
      {
        name: 'Portier',
        from: 0.545,
        to: 0.58,
        labeled: true,
      },
      {
        name: 'Túnel',
        from: 0.58,
        to: 0.64,
        labeled: true,
      },
      {
        name: 'Nouvelle Chicane',
        from: 0.642,
        to: 0.69,
      },
      {
        name: 'Tabac',
        from: 0.728,
        to: 0.795,
        labeled: true,
      },
      {
        name: 'Piscine',
        from: 0.795,
        to: 0.892,
        labeled: true,
      },
      {
        name: 'La Rascasse',
        from: 0.892,
        to: 0.952,
        labeled: true,
      },
      {
        name: 'Anthony Noghès',
        from: 0.952,
        to: 0.975,
      },
    ],
  },
  'yas-marina': {
    id: 'yas-marina',
    name: 'Yas Marina',
    code: 'ABU',
    country: 'Emirados Árabes',
    lengthKm: 5.281,
    lapTimeSeconds: 85.19,
    sectorEnds: [0.27, 0.72],
    sectorTimes: [22.874, 35.388, 26.928],
    topSpeedKmh: 325,
    corners: [
      {
        name: 'Curva 1',
        from: 0.038,
        to: 0.068,
        labeled: true,
      },
      {
        name: 'Curvas 2-4',
        from: 0.085,
        to: 0.19,
      },
      {
        name: 'Hairpin da 5',
        from: 0.232,
        to: 0.275,
        labeled: true,
      },
      {
        name: 'Reta oposta',
        from: 0.275,
        to: 0.465,
      },
      {
        name: 'Curva 6',
        from: 0.465,
        to: 0.505,
        labeled: true,
      },
      {
        name: 'Curva 9',
        from: 0.655,
        to: 0.72,
        labeled: true,
      },
      {
        name: 'Setor do hotel',
        from: 0.74,
        to: 0.87,
        labeled: true,
      },
      {
        name: 'Curva 15',
        from: 0.885,
        to: 0.918,
      },
      {
        name: 'Curva 16',
        from: 0.925,
        to: 0.958,
        labeled: true,
      },
      {
        name: 'Reta dos boxes',
        from: 0.958,
        to: 1,
      },
    ],
  },
};
