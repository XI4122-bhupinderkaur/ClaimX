import { apiClient, ApiError } from './client';
import type { Notification } from '../types/notification';

const NOTIFICATIONS_PATHS = {
  list: '/notifications',
  detail: (id: string): string => `/notifications/${id}`,
  markRead: (id: string): string => `/notifications/${id}/read`,
} as const;

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get<Notification[]>(NOTIFICATIONS_PATHS.list);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch notifications');
  }
};

export const getNotificationById = async (id: string): Promise<Notification> => {
  try {
    const response = await apiClient.get<Notification>(NOTIFICATIONS_PATHS.detail(id));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch notification');
  }
};

export const markNotificationRead = async (id: string): Promise<Notification> => {
  try {
    const response = await apiClient.patch<Notification>(NOTIFICATIONS_PATHS.markRead(id));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to update notification');
  }
};
