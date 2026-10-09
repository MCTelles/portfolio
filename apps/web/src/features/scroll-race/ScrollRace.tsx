import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'motion/react';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import styles from './ScrollRace.module.scss';

const TRACK =
  'M20 24V80C20 115 12 120 12 155V195C12 228 28 235 28 268V318C28 352 12 357 12 390V432Q12 449 20 461V476';

/** Vista de cima, com a frente apontando para baixo. */
function FormulaCar() {
  return (
    <g>
      <path d="M-10-8H10M-10 10H10" stroke="#b2b9c6" strokeWidth="1.5" />
      <g fill="#11141b" stroke="#707783" strokeWidth="0.7">
        <rect x="-12" y="-12" width="5" height="9" rx="1.2" />
        <rect x="7" y="-12" width="5" height="9" rx="1.2" />
        <rect x="-12" y="7" width="5" height="8" rx="1.2" />
        <rect x="7" y="7" width="5" height="8" rx="1.2" />
      </g>
      <path
        d="M-4-15H4L7-7 6 3 2 9 2 16H-2V9L-6 3-7-7Z"
        fill="#e10600"
        stroke="#ff655a"
        strokeWidth="0.7"
      />
      <path d="M-5-6-4 2M5-6 4 2" stroke="#930600" strokeWidth="2" />
      <rect x="-10" y="-18" width="20" height="4" rx="0.8" fill="#e10600" />
      <path d="M-8-16H8M0 7V14" stroke="#fff" strokeWidth="1.2" />
      <ellipse cy="-2" rx="3" ry="4.5" fill="#141821" stroke="#b9c0ca" strokeWidth="0.8" />
      <circle cy="-3" r="1.6" fill="#ffd56a" />
      <path d="M0-1V3" stroke="#b9c0ca" strokeWidth="0.8" />
      <path d="M-10 15H10V18H-10Z" fill="#e10600" />
      <path d="M-8 16.5H8" stroke="#ff8379" strokeWidth="0.8" />
    </g>
  );
}

function VerticalTrack({
  progress,
  speed,
}: {
  progress: MotionValue<number>;
  speed: MotionValue<number>;
}) {
  const path = useRef<SVGPathElement>(null);
  const car = useRef<SVGGElement>(null);
  const length = useRef(0);
  const percent = useTransform(progress, (value) => `${Math.round(value * 100)}%`);

  const positionCar = useCallback((value: number) => {
    if (!path.current || !car.current || !length.current) return;
    const distance = Math.max(0, Math.min(1, value)) * length.current;
    const point = path.current.getPointAtLength(distance);
    const before = path.current.getPointAtLength(Math.max(0, distance - 1));
    const after = path.current.getPointAtLength(Math.min(length.current, distance + 1));
    const angle = (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI - 90;
    car.current.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  }, []);

  useMotionValueEvent(progress, 'change', positionCar);

  useEffect(() => {
    length.current = path.current?.getTotalLength() ?? 0;
    positionCar(progress.get());
    // A geometria é fixa; o evento acima acompanha a rolagem sem renders do React.
  }, [progress, positionCar]);

  return (
    <div className={styles.vertical}>
      <span className={styles.caption}>Volta 01</span>
      <svg className={styles.circuit} viewBox="0 0 40 500" fill="none">
        <path d={TRACK} stroke="#343945" strokeWidth="17" />
        <path d={TRACK} stroke="#11141b" strokeWidth="15" />
        <path ref={path} d={TRACK} stroke="#626977" strokeOpacity="0.4" strokeDasharray="2 7" />
        <motion.path d={TRACK} stroke="#e10600" strokeWidth="2" pathLength={progress} />
        <g fill="#e5e7eb">
          {[0, 1, 2, 3].map((column) => (
            <rect
              key={column}
              x={12 + column * 4}
              y={474 + (column % 2) * 4}
              width="4"
              height="4"
            />
          ))}
        </g>
        <g ref={car} transform="translate(20 24)" className={styles.car}>
          <motion.g opacity={speed} stroke="#ff5a45" strokeLinecap="round">
            <path d="M-6-23V-36M0-24V-43M6-23V-33" />
          </motion.g>
          <FormulaCar />
        </g>
      </svg>
      <motion.span className={styles.percent}>{percent}</motion.span>
    </div>
  );
}

/** Uma volta acompanha a leitura da página, sem capturar o scroll ou o ponteiro. */
export function ScrollRace({ heroRef }: { heroRef: RefObject<HTMLDivElement | null> }) {
  // Só aparece depois que a abertura passa por trás do menu fixo de 72px.
  const heroInView = useInView(heroRef, { initial: true, margin: '-72px 0px 0px 0px' });
  const { scrollYProgress } = useScroll();
  const reducedMotion = useReducedMotion();
  const smoothed = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.0001 });
  const progress = reducedMotion ? scrollYProgress : smoothed;
  const velocity = useVelocity(progress);
  const speed = useTransform(velocity, (value) => Math.min(0.85, Math.abs(value) * 10));
  const mobilePosition = useTransform(
    progress,
    (value) => `${Math.max(0, Math.min(1, value)) * 100}%`,
  );

  return (
    <div aria-hidden="true" className={styles.race} data-visible={!heroInView}>
      <VerticalTrack progress={progress} speed={speed} />
      <div className={styles.mobile}>
        <motion.div className={styles.progress} style={{ scaleX: progress }} />
        <motion.div className={styles.mobileCar} style={{ left: mobilePosition }}>
          <svg viewBox="-16 -22 32 44" fill="none">
            <FormulaCar />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
