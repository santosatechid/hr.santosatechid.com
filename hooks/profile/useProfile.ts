"use client";

import { apiGet, apiPatch } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type MyProfile = {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  gender: string | null;
  avatarUrl: string | null;
  employeeId: string | null;
  position: string | null;
  enrollmentDate: string | null;
};

export type ProfilePatch = Partial<
  Pick<
    MyProfile,
    | "phoneNumber"
    | "address"
    | "birthPlace"
    | "birthDate"
    | "gender"
    | "avatarUrl"
  >
>;

export const useMyProfile = () =>
  useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await apiGet<MyProfile>("/api/profile");
      return res.data;
    },
  });

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ProfilePatch) => {
      const res = await apiPatch<{ success: boolean; profile: MyProfile }>(
        "/api/profile",
        patch,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
};
