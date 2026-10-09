import styles from './PageLoader.module.scss';

export function PageLoader() {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.spinner} />
      <span className="visually-hidden">Carregando…</span>
    </div>
  );
}
