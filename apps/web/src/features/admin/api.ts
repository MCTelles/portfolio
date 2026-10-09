import type {
  AdminDTO,
  AuditEntity,
  AuditLogDTO,
  LoginInput,
  Paginated,
  ProfileDTO,
  ProfileInput,
  ProjectDTO,
  ProjectInput,
  ProjectUpdateInput,
  SkillDTO,
  SkillInput,
  SkillUpdateInput,
} from '@portfolio/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, http } from '@/lib/api';
import { SESSION_QUERY_KEY } from '@/lib/queryClient';
import { publicProfileKeys } from '@/features/about/queries';
import { publicProjectKeys } from '@/features/projects/queries';
import { publicSkillKeys } from '@/features/skills/queries';

export const adminKeys = {
  session: SESSION_QUERY_KEY,
  projects: ['admin', 'projects'] as const,
  project: (id: string) => ['admin', 'projects', id] as const,
  skills: ['admin', 'skills'] as const,
  profile: ['admin', 'profile'] as const,
  audit: (entity: AuditEntity | 'ALL') => ['admin', 'audit', entity] as const,
};

/* ---------- Sessão ---------- */

export const useSession = () =>
  useQuery({
    queryKey: adminKeys.session,
    queryFn: async () => (await http.get<{ admin: AdminDTO }>('/auth/me')).admin,
    retry: false,
    staleTime: 5 * 60_000,
  });

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) =>
      (await http.post<{ admin: AdminDTO }>('/auth/login', input)).admin,
    onSuccess: (admin) => queryClient.setQueryData(adminKeys.session, admin),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http.post<void>('/auth/logout'),
    onSettled: () => queryClient.removeQueries({ queryKey: ['admin'] }),
  });
}

/* ---------- Projetos ---------- */

export const useAdminProjects = () =>
  useQuery({
    queryKey: adminKeys.projects,
    queryFn: () => http.get<ProjectDTO[]>('/admin/projects'),
  });

export const useAdminProject = (id: string | undefined) =>
  useQuery({
    queryKey: adminKeys.project(id ?? ''),
    queryFn: () => http.get<ProjectDTO>(`/admin/projects/${id}`),
    enabled: Boolean(id),
  });

/** Toda escrita invalida a lista do admin e a lista pública. */
function useProjectMutation<TVariables, TResult extends ProjectDTO | void>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (project) => {
      if (project) queryClient.setQueryData(adminKeys.project(project.id), project);
      void queryClient.invalidateQueries({ queryKey: adminKeys.projects });
      void queryClient.invalidateQueries({ queryKey: publicProjectKeys.all });
    },
  });
}

export const useCreateProject = () =>
  useProjectMutation((input: ProjectInput) => http.post<ProjectDTO>('/admin/projects', input));

export const useUpdateProject = () =>
  useProjectMutation(({ id, input }: { id: string; input: ProjectUpdateInput }) =>
    http.patch<ProjectDTO>(`/admin/projects/${id}`, input),
  );

export const useDeleteProject = () =>
  useProjectMutation((id: string) => http.delete(`/admin/projects/${id}`));

export const useUploadImages = () =>
  useProjectMutation(({ id, files }: { id: string; files: File[] }) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    return http.upload<ProjectDTO>(`/admin/projects/${id}/images`, form);
  });

export const useDeleteImage = () =>
  useProjectMutation(({ id, imageId }: { id: string; imageId: string }) =>
    http.delete<ProjectDTO>(`/admin/projects/${id}/images/${imageId}`),
  );

/* ---------- Habilidades ---------- */

export const useAdminSkills = () =>
  useQuery({ queryKey: adminKeys.skills, queryFn: () => http.get<SkillDTO[]>('/admin/skills') });

function useSkillMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.skills });
      void queryClient.invalidateQueries({ queryKey: publicSkillKeys.all });
    },
  });
}

export const useCreateSkill = () =>
  useSkillMutation((input: SkillInput) => http.post<SkillDTO>('/admin/skills', input));

export const useUpdateSkill = () =>
  useSkillMutation(({ id, input }: { id: string; input: SkillUpdateInput }) =>
    http.patch<SkillDTO>(`/admin/skills/${id}`, input),
  );

export const useDeleteSkill = () =>
  useSkillMutation((id: string) => http.delete(`/admin/skills/${id}`));

/* ---------- Perfil ---------- */

/** `null` quando o perfil ainda não foi criado (a API responde 404). */
export const useAdminProfile = () =>
  useQuery({
    queryKey: adminKeys.profile,
    queryFn: async () => {
      try {
        return await http.get<ProfileDTO>('/admin/profile');
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => http.put<ProfileDTO>('/admin/profile', input),
    onSuccess: (profile) => {
      queryClient.setQueryData(adminKeys.profile, profile);
      queryClient.setQueryData(publicProfileKeys.all, profile);
    },
  });
}

/* ---------- Atividade (trilha de auditoria) ---------- */

const AUDIT_PAGE_SIZE = 25;

export const useAuditLogs = (entity: AuditEntity | 'ALL') =>
  useInfiniteQuery({
    queryKey: adminKeys.audit(entity),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(AUDIT_PAGE_SIZE) });
      if (entity !== 'ALL') params.set('entity', entity);
      if (pageParam) params.set('cursor', pageParam);
      return http.get<Paginated<AuditLogDTO>>(`/admin/audit-logs?${params}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // A trilha muda a cada ação no painel: sempre busca a versão mais recente ao abrir.
    staleTime: 0,
  });
