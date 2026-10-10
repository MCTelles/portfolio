import { motion, useInView, useScroll, useTransform, type Variants } from 'motion/react';
import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { ButtonLink } from '@/components/Button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ArrowRightIcon } from '@/components/Icons';
import { useProfile } from '@/features/about/queries';
import type { CameraMode } from './camera';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRevealOffset } from '@/hooks/useRevealOffset';
import { CornerLabelsOverlay } from './CornerLabelsOverlay';
import { TelemetryHud } from './TelemetryHud';
import { useSelectedCircuit } from './useSelectedCircuit';
import styles from './Hero.module.scss';

// Code-splitting: o three.js fica num chunk separado e não atrasa o primeiro paint do texto.
// O download começa já na avaliação deste módulo (não só quando o Hero renderiza), em
// paralelo com o React montando a página: elimina uma ida e volta na cascata de rede.
const heroCanvasModule = import('./HeroCanvas');
const HeroCanvas = lazy(() => heroCanvasModule);

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { data: profile } = useProfile();
  const inView = useInView(ref);
  const [cameraMode, setCameraMode] = useState<CameraMode>('aerial');
  const [circuitId, selectCircuit] = useSelectedCircuit();
  const isDesktop = useMediaQuery('(min-width: 900px)');

  // Desktop: entra deslizando da esquerda, como um carro saindo do box. Celular: sobe de baixo.
  const reveal = useRevealOffset(-40);
  const item = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, x: reveal.x, y: reveal.y },
      visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.9, ease: EASE } },
    }),
    [reveal.x, reveal.y],
  );
  const showLabels = isDesktop && cameraMode === 'aerial';

  // 0 quando o Hero está no topo, 1 quando saiu totalmente da tela.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.canvas} aria-hidden="true">
        <div className={styles.backdrop} />
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <HeroCanvas
              scrollProgress={scrollYProgress}
              active={inView}
              cameraMode={cameraMode}
              circuitId={circuitId}
              showLabels={showLabels}
            />
          </Suspense>
        </ErrorBoundary>
        <CornerLabelsOverlay circuitId={circuitId} enabled={showLabels} />
      </div>

      <motion.div
        className={styles.content}
        style={{ y: contentY, opacity: contentOpacity }}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.p className={styles.eyebrow} variants={item}>
          <span className={styles.live}>Live</span>
          {profile ? `${profile.name} · ${profile.headline}` : 'Engenharia de Software'}
        </motion.p>

        <motion.h1 id="hero-title" className={styles.title} variants={item}>
          Acelerando
          <br />
          linhas de <span className={styles.highlight}>código.</span>
        </motion.h1>

        <motion.p className={styles.lead} variants={item}>
          Converse comigo para trazer segurança e velocidade no desenvolvimento do seu produto
          digital.
        </motion.p>

        <motion.div className={styles.actions} variants={item}>
          <ButtonLink href="#projetos" icon={<ArrowRightIcon />}>
            Ver projetos
          </ButtonLink>
          <ButtonLink href="#contato" variant="ghost">
            Box, box!
          </ButtonLink>
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.hudSlot}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
      >
        <TelemetryHud
          circuitId={circuitId}
          onSelectCircuit={selectCircuit}
          cameraMode={cameraMode}
          onToggleCamera={() => setCameraMode((mode) => (mode === 'aerial' ? 'onboard' : 'aerial'))}
        />
      </motion.div>
    </section>
  );
}
