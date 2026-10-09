import type { ProjectDTO } from '@portfolio/shared';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api';

export const publicProjectKeys = { all: ['projects', 'public'] as const };

export const useProjects = () =>
  useQuery({ queryKey: publicProjectKeys.all, queryFn: () => http.get<ProjectDTO[]>('/projects') });
