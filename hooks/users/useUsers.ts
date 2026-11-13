"use client";

import { type UserDataTypes } from "@/types";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetUsers = (enabled = true) => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiGet<UserDataTypes[]>("/api/users");
      return res.data;
    },
    enabled,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: Partial<UserDataTypes>,
    ) => {
      const res = await apiPost("/api/users", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: Partial<UserDataTypes> & { id: string },
    ) => {
      const res = await apiPut("/api/users", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiDelete("/api/users/", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
