import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getProfile, updateProfile, type UpdateProfileRequest } from '../api/profileApi';
import type { User } from '../types/user';

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'current-user'] as const,
};

export const profileQueryKeys = {
  all: ['profile'] as const,
  current: () => [...profileQueryKeys.all, 'current'] as const,
};

export const useProfile = () =>
  useQuery<User, Error>({
    queryKey: profileQueryKeys.current(),
    queryFn: getProfile,
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateProfileRequest>({
    mutationFn: updateProfile,
    onSuccess: async updatedUser => {
      await queryClient.setQueryData<User | undefined>(
        profileQueryKeys.current(),
        updatedUser,
      );
      await queryClient.setQueryData<User | undefined>(
        authQueryKeys.currentUser(),
        updatedUser,
      );
      await queryClient.invalidateQueries({
        queryKey: profileQueryKeys.current(),
      });
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.currentUser(),
      });
    },
  });
};
