import styles from './Tag.module.scss';

export function Tag({ children }: { children: string }) {
  return <span className={styles.tag}>{children}</span>;
}
