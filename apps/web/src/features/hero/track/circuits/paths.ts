// Arquivo gerado por scripts/build-track-data.ts. Não edite à mão.
// Traçados: bacinger/f1-circuits (MIT).

import type { CircuitPath } from '../types';
import type { CircuitId } from './meta';
import { PATH as path0 } from './spa';
import { PATH as path1 } from './interlagos';
import { PATH as path2 } from './monaco';
import { PATH as path3 } from './yas-marina';

export const CIRCUIT_PATHS: Record<CircuitId, CircuitPath> = {
  spa: path0,
  interlagos: path1,
  monaco: path2,
  'yas-marina': path3,
};
