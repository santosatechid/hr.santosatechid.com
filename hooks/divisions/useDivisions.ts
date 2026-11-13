"use client";

import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DivisionRecord = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { users: number };
};

export type DivisionInput = {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
};

export const useGetDivisions = (enabled = true) =>
  useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const res = await apiGet<DivisionRecord[]>("/api/divisions");
      return res.data;
    },
    enabled,
  });

export const useCreateDivision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DivisionInput) => {
      const res = await apiPost<DivisionRecord>("/api/divisions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
    },
  });
};

export const useUpdateDivision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DivisionInput & { id: string }) => {
      const res = await apiPut<DivisionRecord>("/api/divisions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteDivision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiDelete("/api/divisions", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
