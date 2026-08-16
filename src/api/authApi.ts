import { apiClient, ApiError } from './client';
import type { User } from '../types/user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthApiContract {
  login: (credentials: LoginRequest) => Promise<AuthSession>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
}

const AUTH_PATHS = {
  login: '/auth/login',
  logout: '/auth/logout',
  me: '/auth/me',
} as const;

export const login = async (credentials: LoginRequest): Promise<AuthSession> => {
  try {
    const response = await apiClient.post<AuthSession>(AUTH_PATHS.login, credentials);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Login failed');
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post<void>(AUTH_PATHS.logout);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Logout failed');
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>(AUTH_PATHS.me);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch current user');
  }
};

export const authApi: AuthApiContract = {
  login,
  logout,
  getCurrentUser,
};
