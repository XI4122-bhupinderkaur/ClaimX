import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationById,
  getNotifications,
  markNotificationRead,
} from '../api/notificationsApi';
import type { Notification } from '../types/notification';

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...notificationQueryKeys.all, id] as const,
};

export const useNotifications = () =>
  useQuery<Notification[], Error>({
    queryKey: notificationQueryKeys.list(),
    queryFn: getNotifications,
  });

export const useNotification = (id: string | undefined) =>
  useQuery<Notification, Error>({
    queryKey: notificationQueryKeys.detail(id ?? 'missing'),
    queryFn: async () => {
      if (!id || id.trim().length === 0) {
        throw new Error('Notification ID is required');
      }

      return getNotificationById(id);
    },
    enabled: Boolean(id && id.trim().length > 0),
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string>({
    mutationFn: markNotificationRead,
    onSuccess: async updatedNotification => {
      await queryClient.setQueryData<Notification | undefined>(
        notificationQueryKeys.detail(updatedNotification.id),
        updatedNotification,
      );
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.detail(updatedNotification.id),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list(),
      });
    },
  });
};
