import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { buttonClasses, type ButtonStyleProps } from './buttonClasses';
import styles from './Button.module.scss';

/** O botão é inclinado como uma faixa de pintura; o rótulo é "desinclinado" para continuar legível. */
const Label = ({ children, icon }: { children: ReactNode; icon?: ReactNode }) => (
  <span className={styles.label}>
    {children}
    {icon}
  </span>
);

export function Button({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: ButtonStyleProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={buttonClasses({ variant, size }, `${styles.skewed} ${className ?? ''}`)}
      {...props}
    >
      <Label icon={icon}>{children}</Label>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: ButtonStyleProps & ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      className={buttonClasses({ variant, size }, `${styles.skewed} ${className ?? ''}`)}
      {...props}
    >
      <Label icon={icon}>{children}</Label>
    </a>
  );
}
