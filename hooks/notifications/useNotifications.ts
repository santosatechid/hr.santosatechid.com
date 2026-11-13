"use client";

import { apiGet, apiPatch } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string | null;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

type NotificationResponse = {
  items: NotificationItem[];
  unread: number;
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiGet<NotificationResponse>("/api/notifications");
      return res.data;
    },
    // Notifikasi approval boleh telat beberapa detik; 30 detik cukup murah.
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id?: string) => {
      await apiPatch("/api/notifications", id ? { id } : {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
