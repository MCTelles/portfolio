import { Link } from 'react-router';
import styles from './NotFoundPage.module.scss';

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <span className={styles.flag} aria-hidden="true" />
      <p className={styles.code}>404</p>
      <h1>Saiu da pista</h1>
      <p className={styles.muted}>Bandeira vermelha: esta página não existe ou foi para a brita.</p>
      <Link to="/" className={styles.link}>
        Voltar para o box
      </Link>
    </main>
  );
}
