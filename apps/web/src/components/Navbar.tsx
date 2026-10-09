import { useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import styles from './Navbar.module.scss';

const LINKS = [
  { href: '#projetos', label: 'Projetos' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#habilidades', label: 'Habilidades' },
];

export function Navbar({ brand }: { brand: string }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#top" className={styles.brand}>
          <span className={styles.flag} aria-hidden="true" />
          {brand}
        </a>
        <nav aria-label="Seções">
          <ul className={styles.links}>
            {LINKS.map((link) => (
              <li key={link.href} className={styles.hideMobile}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
            <li>
              <a href="#contato" className={styles.box}>
                <span>Box</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
