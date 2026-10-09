import type { ReactNode } from 'react';
import styles from './Button.module.scss';

export interface ButtonStyleProps {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  icon?: ReactNode;
}

/** Também usado para estilizar <Link> do router como botão. */
export const buttonClasses = (
  { variant = 'primary', size = 'md' }: ButtonStyleProps = {},
  extra?: string,
) => [styles.button, styles[variant], styles[size], extra].filter(Boolean).join(' ');
