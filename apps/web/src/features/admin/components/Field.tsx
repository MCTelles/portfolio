import type { ReactNode } from 'react';
import styles from '../admin.module.scss';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className={`${styles.field} ${error ? styles.invalid : ''}`}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : (
        hint && <span className={styles.hint}>{hint}</span>
      )}
    </label>
  );
}
