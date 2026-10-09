import type { ProfileDTO } from '@portfolio/shared';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api';

export const publicProfileKeys = { all: ['profile'] as const };

export const useProfile = () =>
  useQuery({ queryKey: publicProfileKeys.all, queryFn: () => http.get<ProfileDTO>('/profile') });
