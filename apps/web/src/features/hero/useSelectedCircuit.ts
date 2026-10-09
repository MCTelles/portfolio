import { useCallback, useState } from 'react';
import { telemetry } from './telemetry';
import { CIRCUIT_IDS, type CircuitId } from './track/circuits/meta';

const STORAGE_KEY = 'portfolio:circuit';
const DEFAULT_CIRCUIT: CircuitId = 'spa';

const isCircuitId = (value: unknown): value is CircuitId =>
  typeof value === 'string' && (CIRCUIT_IDS as readonly string[]).includes(value);

/** Preferência do visitante; armazenamento pode falhar (aba anônima, bloqueio de site). */
function readStoredCircuit(): CircuitId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isCircuitId(stored) ? stored : DEFAULT_CIRCUIT;
  } catch {
    return DEFAULT_CIRCUIT;
  }
}

export function useSelectedCircuit() {
  const [circuitId, setCircuitId] = useState<CircuitId>(readStoredCircuit);

  const selectCircuit = useCallback((next: CircuitId) => {
    // O HUD volta aos placeholders até o carro do novo circuito escrever a telemetria
    telemetry.live = false;
    setCircuitId(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sem armazenamento: a escolha vale só para esta visita
    }
  }, []);

  return [circuitId, selectCircuit] as const;
}
