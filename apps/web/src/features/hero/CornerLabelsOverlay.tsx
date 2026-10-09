import { useEffect, useRef } from 'react';
import { cornerLabelScreen } from './cornerLabelScreen';
import { CIRCUIT_META, type CircuitId } from './track/circuits/meta';
import styles from './Hero.module.scss';

interface CornerLabelsOverlayProps {
  circuitId: CircuitId;
  enabled: boolean;
}

/** Rótulos das curvas em DOM comum, posicionados por transform a cada frame. */
export function CornerLabelsOverlay({ circuitId, enabled }: CornerLabelsOverlayProps) {
  const labels = CIRCUIT_META[circuitId].corners.filter((corner) => corner.labeled);
  const refs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = requestAnimationFrame(update);
      const ready =
        enabled && cornerLabelScreen.visible && cornerLabelScreen.circuitId === circuitId;

      refs.current.forEach((label, i) => {
        if (!label) return;
        const show = ready && cornerLabelScreen.inFront[i] === true;
        label.style.opacity = show ? '1' : '0';
        if (show) {
          label.style.transform = `translate(${cornerLabelScreen.x[i]}px, ${cornerLabelScreen.y[i]}px) translate(-50%, -50%)`;
        }
      });
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [circuitId, enabled]);

  return (
    <div className={styles.labelsLayer} aria-hidden="true">
      {labels.map((corner, i) => (
        <span
          key={corner.name}
          ref={(element) => {
            refs.current[i] = element;
          }}
          className={styles.cornerLabel}
        >
          {corner.name}
        </span>
      ))}
    </div>
  );
}
