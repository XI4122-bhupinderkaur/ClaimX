import { apiClient, ApiError } from './client';
import type { User } from '../types/user';

export type UpdateProfileRequest = Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>;

const PROFILE_PATHS = {
  current: '/profile',
} as const;

export const getProfile = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>(PROFILE_PATHS.current);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch profile');
  }
};

export const updateProfile = async (payload: UpdateProfileRequest): Promise<User> => {
  try {
    const response = await apiClient.patch<User>(PROFILE_PATHS.current, payload);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to update profile');
  }
};
