import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '../api/authApi';
import { getSession, clearSession, saveSession } from '../services/authStorage';
import type { User } from '../types/user';

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'current-user'] as const,
};

export const useCurrentUser = () =>
  useQuery<User, Error>({
    queryKey: authQueryKeys.currentUser(),
    queryFn: async () => {
      const session = await getSession();

      if (!session) {
        throw new Error('No active session');
      }

      return authApi.getCurrentUser();
    },
    retry: false,
    retryOnMount: false,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async session => {
      await saveSession(session);

      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.currentUser(),
      });
      await queryClient.refetchQueries({
        queryKey: authQueryKeys.currentUser(),
      });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      await clearSession();
      queryClient.setQueryData(authQueryKeys.currentUser(), undefined);
      await queryClient.removeQueries({
        queryKey: authQueryKeys.currentUser(),
      });
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.all,
      });
    },
  });
};
