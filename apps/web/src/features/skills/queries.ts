import type { SkillDTO } from '@portfolio/shared';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api';

export const publicSkillKeys = { all: ['skills'] as const };

export const useSkills = () =>
  useQuery({ queryKey: publicSkillKeys.all, queryFn: () => http.get<SkillDTO[]>('/skills') });
