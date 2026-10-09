import { useEffect, useRef } from 'react';
import type { CameraMode } from './camera';
import { telemetry } from './telemetry';
import { CIRCUIT_IDS, CIRCUIT_META, type CircuitId } from './track/circuits/meta';
import { formatLapTime } from './track/lap';
import styles from './Hero.module.scss';

/** ~15 atualizações/s: rápido o bastante para parecer ao vivo, lento o bastante para ler. */
const UPDATE_INTERVAL_MS = 66;
const SECTORS = [0, 1, 2] as const;

interface TelemetryHudProps {
  circuitId: CircuitId;
  onSelectCircuit: (id: CircuitId) => void;
  cameraMode: CameraMode;
  onToggleCamera: () => void;
}

/**
 * Painel de telemetria da volta simulada. Lê o objeto `telemetry` (escrito pelo carro no
 * Canvas) e escreve direto nos nós do DOM: nenhuma re-renderização do React a 60 fps.
 */
export function TelemetryHud({
  circuitId,
  onSelectCircuit,
  cameraMode,
  onToggleCamera,
}: TelemetryHudProps) {
  const meta = CIRCUIT_META[circuitId];
  const speedRef = useRef<HTMLSpanElement>(null);
  const speedBarRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);
  const lapTimeRef = useRef<HTMLSpanElement>(null);
  const cornerRef = useRef<HTMLSpanElement>(null);
  const sectorRefs = useRef<Array<HTMLLIElement | null>>([]);
  const sectorTimeRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    let frame = 0;
    let lastUpdate = 0;

    const set = (element: HTMLElement | null | undefined, text: string) => {
      if (element && element.textContent !== text) element.textContent = text;
    };

    const update = (now: number) => {
      frame = requestAnimationFrame(update);
      if (now - lastUpdate < UPDATE_INTERVAL_MS) return;
      lastUpdate = now;

      // Antes do 3D carregar (ou logo após trocar de circuito): placeholders
      const live = telemetry.live;
      set(speedRef.current, live ? String(Math.round(telemetry.speedKmh)) : '---');
      set(gearRef.current, live ? String(telemetry.gear) : 'N');
      set(lapRef.current, live ? String(telemetry.lap) : '1');
      set(lapTimeRef.current, formatLapTime(live ? telemetry.lapTime : 0, 1));
      set(cornerRef.current, (live && telemetry.corner) || '·');
      speedBarRef.current?.style.setProperty(
        '--fill',
        String(live ? telemetry.speedKmh / meta.topSpeedKmh : 0),
      );

      SECTORS.forEach((index) => {
        const done = live && index < telemetry.sector;
        const state = done ? 'done' : live && index === telemetry.sector ? 'current' : 'pending';
        const cell = sectorRefs.current[index];
        if (cell && cell.dataset.state !== state) cell.dataset.state = state;
        const time = telemetry.sectorTimes[index];
        set(sectorTimeRefs.current[index], done && time ? time.toFixed(3) : '—');
      });
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [meta]);

  return (
    <div className={styles.hudWrapper}>
      <div className={styles.hudTabs} role="group" aria-label="Escolher circuito">
        {CIRCUIT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === circuitId}
            aria-label={`${CIRCUIT_META[id].name} (${CIRCUIT_META[id].country})`}
            title={CIRCUIT_META[id].name}
            onClick={() => onSelectCircuit(id)}
          >
            <span>{CIRCUIT_META[id].code}</span>
          </button>
        ))}
      </div>

      <aside className={styles.hud} aria-label="Telemetria simulada">
        <p className="visually-hidden" aria-live="polite">
          Simulação de uma volta em {meta.name}, com melhor volta de{' '}
          {formatLapTime(meta.lapTimeSeconds)}.
        </p>

        <button
          type="button"
          className={styles.hudCamera}
          onClick={onToggleCamera}
          aria-pressed={cameraMode === 'onboard'}
        >
          <span>{cameraMode === 'onboard' ? 'Câmera aérea' : 'Câmera onboard'}</span>
        </button>

        <div className={styles.hudGrid} aria-hidden="true">
          <header className={styles.hudHeader}>
            <span className={styles.hudFlag} />
            <span>{meta.name}</span>
            <span className={styles.hudMuted}>{meta.lengthKm.toFixed(3)} km</span>
          </header>

          <div className={styles.hudSpeedBlock}>
            <div className={styles.hudSpeed}>
              <span ref={speedRef} className={styles.hudSpeedValue}>
                ---
              </span>
              <span className={styles.hudUnit}>km/h</span>
              <span className={styles.hudGear}>
                <span className={styles.hudMuted}>Marcha</span>
                <span ref={gearRef}>N</span>
              </span>
            </div>
            <span ref={speedBarRef} className={styles.hudSpeedBar} />
          </div>

          <ol className={styles.hudSectors}>
            {SECTORS.map((index) => (
              <li
                key={index}
                ref={(element) => {
                  sectorRefs.current[index] = element;
                }}
                data-state="pending"
              >
                <span>S{index + 1}</span>
                <span
                  ref={(element) => {
                    sectorTimeRefs.current[index] = element;
                  }}
                >
                  —
                </span>
              </li>
            ))}
          </ol>

          <dl className={styles.hudTimes}>
            <div>
              <dt>
                Volta <span ref={lapRef}>1</span>
              </dt>
              <dd ref={lapTimeRef}>0:00.0</dd>
            </div>
            <div>
              <dt>Melhor volta</dt>
              <dd className={styles.hudBest}>{formatLapTime(meta.lapTimeSeconds)}</dd>
            </div>
          </dl>

          <p className={styles.hudCorner}>
            <span ref={cornerRef}>·</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
