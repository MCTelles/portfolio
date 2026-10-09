/**
 * Configuração de cada circuito para o gerador de dados (build-track-data.ts).
 *
 * Todas as frações são "progresso da volta" a partir da linha de chegada (0 = linha).
 * Curvas foram posicionadas pelo perfil de curvatura (npm run track:analyze); altimetria e
 * divisão de setores são aproximações a partir de referências públicas.
 */

export type CircuitId = 'spa' | 'interlagos' | 'monaco' | 'yas-marina';

export interface CornerConfig {
  name: string;
  from: number;
  to: number;
  /** Mostrar rótulo no 3D (só as curvas mais icônicas, para não poluir). */
  labeled?: boolean;
}

export interface CircuitConfig {
  id: CircuitId;
  name: string;
  /** Sigla de 3 letras usada no seletor, como nos grafismos de TV. */
  code: string;
  country: string;
  lengthKm: number;
  /** Largura típica do asfalto (m), usada para calcular a trajetória de corrida. */
  trackWidthM: number;
  /** Arquivo em scripts/data (traçado do bacinger/f1-circuits, MIT). */
  source: string;
  /** Fração do arquivo onde fica a linha de chegada (alguns traçados começam em outra curva). */
  startOffset: number;
  /** Altimetria aproximada (m) por progresso da volta. */
  elevation: Array<[progress: number, meters: number]>;
  /** Fim dos setores 1 e 2. */
  sectorEnds: [number, number];
  corners: CornerConfig[];
}

export const CIRCUITS: CircuitConfig[] = [
  {
    id: 'spa',
    name: 'Spa-Francorchamps',
    code: 'BEL',
    country: 'Bélgica',
    lengthKm: 7.004,
    trackWidthM: 13,
    source: 'spa-francorchamps.geojson',
    startOffset: 0,
    elevation: [
      [0, 404],
      [0.036, 408], // La Source
      [0.082, 385],
      [0.128, 368], // Eau Rouge (fundo do vale)
      [0.165, 400], // topo do Raidillon
      [0.318, 470], // Les Combes (ponto mais alto)
      [0.36, 460],
      [0.411, 440],
      [0.45, 430],
      [0.53, 405],
      [0.63, 400],
      [0.69, 385],
      [0.72, 372], // Stavelot
      [0.78, 375],
      [0.84, 390],
      [0.95, 402],
      [1, 404],
    ],
    sectorEnds: [0.318, 0.735],
    corners: [
      { name: 'La Source', from: 0.018, to: 0.05, labeled: true },
      { name: 'Eau Rouge', from: 0.112, to: 0.136, labeled: true },
      { name: 'Raidillon', from: 0.136, to: 0.172 },
      { name: 'Reta Kemmel', from: 0.172, to: 0.312 },
      { name: 'Les Combes', from: 0.312, to: 0.348, labeled: true },
      { name: 'Malmedy', from: 0.348, to: 0.372 },
      { name: 'Rivage', from: 0.398, to: 0.465 },
      { name: 'Pouhon', from: 0.51, to: 0.575, labeled: true },
      { name: 'Fagnes', from: 0.605, to: 0.66 },
      { name: 'Campus', from: 0.672, to: 0.7 },
      { name: 'Stavelot', from: 0.7, to: 0.735, labeled: true },
      { name: 'Blanchimont', from: 0.8, to: 0.88, labeled: true },
      { name: 'Bus Stop', from: 0.925, to: 0.965, labeled: true },
      { name: 'Reta dos boxes', from: 0.965, to: 1 },
    ],
  },
  {
    id: 'interlagos',
    name: 'Interlagos',
    code: 'BRA',
    country: 'Brasil',
    lengthKm: 4.309,
    trackWidthM: 14,
    source: 'interlagos.geojson',
    startOffset: 0,
    // Sentido anti-horário; ponto mais baixo na Descida do Lago, subida forte até a linha
    elevation: [
      [0, 795],
      [0.076, 786], // S do Senna
      [0.123, 780], // Curva do Sol
      [0.3, 766],
      [0.36, 755], // Descida do Lago
      [0.464, 764], // Ferradura
      [0.536, 774], // Laranjinha
      [0.573, 778], // Pinheirinho
      [0.635, 777], // Bico de Pato
      [0.695, 765], // Mergulho
      [0.75, 758], // Junção
      [0.85, 778], // Subida dos Boxes
      [0.93, 792],
      [1, 795],
    ],
    sectorEnds: [0.3, 0.765],
    corners: [
      { name: 'S do Senna', from: 0.05, to: 0.108, labeled: true },
      { name: 'Curva do Sol', from: 0.108, to: 0.175, labeled: true },
      { name: 'Reta Oposta', from: 0.175, to: 0.305 },
      { name: 'Descida do Lago', from: 0.305, to: 0.39, labeled: true },
      { name: 'Ferradura', from: 0.45, to: 0.51, labeled: true },
      { name: 'Laranjinha', from: 0.515, to: 0.55 },
      { name: 'Pinheirinho', from: 0.55, to: 0.592 },
      { name: 'Bico de Pato', from: 0.592, to: 0.652, labeled: true },
      { name: 'Mergulho', from: 0.655, to: 0.712, labeled: true },
      { name: 'Junção', from: 0.735, to: 0.766, labeled: true },
      { name: 'Subida dos Boxes', from: 0.766, to: 0.92 },
      { name: 'Reta dos boxes', from: 0.92, to: 1 },
    ],
  },
  {
    id: 'monaco',
    name: 'Monaco',
    code: 'MON',
    country: 'Mônaco',
    lengthKm: 3.337,
    trackWidthM: 9,
    source: 'monaco.geojson',
    // O arquivo começa na praça do Cassino; a linha fica no Boulevard Albert 1er
    startOffset: 0.705,
    // Sobe da beira-mar até o Cassino (~42 m) e desce até o túnel
    elevation: [
      [0, 5],
      [0.091, 10], // Sainte Dévote
      [0.215, 32], // Beau Rivage
      [0.259, 40], // Massenet
      [0.298, 42], // Casino
      [0.369, 38], // Mirabeau
      [0.43, 30], // Grand Hotel Hairpin
      [0.527, 18], // Mirabeau Bas
      [0.565, 9], // Portier
      [0.62, 5], // túnel
      [0.66, 3], // Nouvelle Chicane
      [0.76, 3], // Tabac
      [0.85, 2], // Piscine
      [0.92, 4], // Rascasse
      [1, 5],
    ],
    sectorEnds: [0.3, 0.7],
    corners: [
      { name: 'Sainte Dévote', from: 0.07, to: 0.105, labeled: true },
      { name: 'Beau Rivage', from: 0.105, to: 0.222 },
      { name: 'Massenet', from: 0.222, to: 0.285, labeled: true },
      { name: 'Casino', from: 0.285, to: 0.32, labeled: true },
      { name: 'Mirabeau', from: 0.35, to: 0.385 },
      { name: 'Grand Hotel Hairpin', from: 0.39, to: 0.475, labeled: true },
      { name: 'Mirabeau Bas', from: 0.505, to: 0.545 },
      { name: 'Portier', from: 0.545, to: 0.58, labeled: true },
      { name: 'Túnel', from: 0.58, to: 0.64, labeled: true },
      { name: 'Nouvelle Chicane', from: 0.642, to: 0.69 },
      { name: 'Tabac', from: 0.728, to: 0.795, labeled: true },
      { name: 'Piscine', from: 0.795, to: 0.892, labeled: true },
      { name: 'La Rascasse', from: 0.892, to: 0.952, labeled: true },
      { name: 'Anthony Noghès', from: 0.952, to: 0.975 },
    ],
  },
  {
    id: 'yas-marina',
    name: 'Yas Marina',
    code: 'ABU',
    country: 'Emirados Árabes',
    lengthKm: 5.281,
    trackWidthM: 15,
    source: 'yas-marina.geojson',
    startOffset: 0,
    // Praticamente plano
    elevation: [
      [0, 8],
      [0.25, 6],
      [0.5, 4],
      [0.68, 7],
      [0.85, 9],
      [1, 8],
    ],
    sectorEnds: [0.27, 0.72],
    corners: [
      { name: 'Curva 1', from: 0.038, to: 0.068, labeled: true },
      { name: 'Curvas 2-4', from: 0.085, to: 0.19 },
      { name: 'Hairpin da 5', from: 0.232, to: 0.275, labeled: true },
      { name: 'Reta oposta', from: 0.275, to: 0.465 },
      { name: 'Curva 6', from: 0.465, to: 0.505, labeled: true },
      { name: 'Curva 9', from: 0.655, to: 0.72, labeled: true },
      { name: 'Setor do hotel', from: 0.74, to: 0.87, labeled: true },
      { name: 'Curva 15', from: 0.885, to: 0.918 },
      { name: 'Curva 16', from: 0.925, to: 0.958, labeled: true },
      { name: 'Reta dos boxes', from: 0.958, to: 1 },
    ],
  },
];
