import type { ProfileDTO } from '@portfolio/shared';
import { ArrowRightIcon } from './Icons';
import styles from './Footer.module.scss';

export function Footer({ profile }: { profile?: ProfileDTO }) {
  const email = profile?.socials.find((social) => social.url.startsWith('mailto:'));
  const links = profile?.socials.filter((social) => social !== email) ?? [];

  return (
    <footer id="contato" className={styles.footer}>
      <div className={styles.checkered} aria-hidden="true" />
      <div className={styles.inner}>
        <p className={styles.radio}>
          <span className={styles.dot} aria-hidden="true" />
          Rádio da equipe
        </p>
        <h2 className={styles.cta}>
          Box, box! <span>Bora conversar?</span>
        </h2>
        <p className={styles.lead}>
          Tem um projeto em mente, uma vaga ou só quer trocar uma ideia sobre código e corrida?
          Chama no rádio.
        </p>

        {email && (
          <a className={styles.email} href={email.url}>
            {email.url.replace('mailto:', '')}
            <ArrowRightIcon />
          </a>
        )}

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} {profile?.name ?? 'Portfólio'} · Da pista para o código
          </p>
          <ul>
            {links.map((social) => (
              <li key={social.url}>
                <a href={social.url} target="_blank" rel="noreferrer">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
