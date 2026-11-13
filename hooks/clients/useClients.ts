"use client";

import { CACHE_STRATEGIES } from "@/app/providers";
import { apiGet, apiPost, apiPut } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ClientRecord = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { users: number; roles: number; branches: number };
};

export type ClientInput = {
  name: string;
  phone?: string;
  address?: string;
};

export const useSendOnboardingOtp = () => {
  return useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiPost<{ success: boolean; phone: string }>(
        "/api/onboarding/otp",
        { phone },
      );
      return res.data;
    },
  });
};

export const useVerifyOnboardingOtp = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await apiPut<{ success: boolean; phone: string }>(
        "/api/onboarding/otp",
        { code },
      );
      return res.data;
    },
  });
};

export const useGetClient = () => {
  return useQuery({
    queryKey: ["client"],
    queryFn: async () => {
      const res = await apiGet<ClientRecord | null>("/api/clients");
      return res.data;
    },
    ...CACHE_STRATEGIES.dynamic,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClientInput) => {
      const res = await apiPost<ClientRecord>("/api/clients", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client"] });
    },
  });
};
