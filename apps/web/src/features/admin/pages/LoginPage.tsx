import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@portfolio/shared';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { useLogin, useSession } from '../api';
import { Field } from '../components/Field';
import styles from '../admin.module.scss';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = useSession();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (session) return <Navigate to={redirectTo} replace />;

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => navigate(redirectTo, { replace: true }) }),
  );

  return (
    <main className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={onSubmit} noValidate>
        <div>
          <h1>Painel administrativo</h1>
          <p className={styles.muted}>Entre para gerenciar seus projetos.</p>
        </div>

        <Field label="E-mail" error={errors.email?.message}>
          <input type="email" autoComplete="username" autoFocus {...register('email')} />
        </Field>

        <Field label="Senha" error={errors.password?.message}>
          <input type="password" autoComplete="current-password" {...register('password')} />
        </Field>

        {login.error && (
          <p className={styles.error} role="alert">
            {login.error.message}
          </p>
        )}

        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
