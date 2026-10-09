import { Navigate, Route, Routes } from 'react-router';
import { AdminLayout } from './AdminLayout';
import { ActivityPage } from './pages/ActivityPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProjectFormPage } from './pages/ProjectFormPage';
import { ProjectsListPage } from './pages/ProjectsListPage';
import { SkillsPage } from './pages/SkillsPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<ProjectsListPage />} />
          <Route path="projects/new" element={<ProjectFormPage />} />
          <Route path="projects/:id" element={<ProjectFormPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="activity" element={<ActivityPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
