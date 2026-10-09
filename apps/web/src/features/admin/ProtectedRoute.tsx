import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoader } from '@/components/PageLoader';
import { useSession } from './api';

export function ProtectedRoute() {
  const location = useLocation();
  const { data: admin, isPending } = useSession();

  if (isPending) return <PageLoader />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
