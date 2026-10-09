import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { useLogout, useSession } from './api';
import styles from './admin.module.scss';

export function AdminLayout() {
  const navigate = useNavigate();
  const { data: admin } = useSession();
  const logout = useLogout();

  const handleLogout = () =>
    logout.mutate(undefined, { onSettled: () => navigate('/admin/login', { replace: true }) });

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link to="/admin" className={styles.brand}>
          Painel<span>.</span>
        </Link>
        <nav className={styles.nav}>
          <NavLink to="/admin" end>
            Projetos
          </NavLink>
          <NavLink to="/admin/skills">Habilidades</NavLink>
          <NavLink to="/admin/profile">Perfil</NavLink>
          <NavLink to="/admin/activity">Atividade</NavLink>
          <a href="/" target="_blank" rel="noreferrer">
            Ver site
          </a>
        </nav>
        <div className={styles.user}>
          <span>{admin?.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logout.isPending}
            title="Encerra a sessão em todos os dispositivos"
          >
            Sair
          </Button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
