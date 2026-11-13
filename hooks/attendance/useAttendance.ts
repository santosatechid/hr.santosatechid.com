"use client";

import { apiDelete, apiGet, apiPost } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type AttendanceRecordView = {
  id: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  method: string;
  branch?: { name: string } | null;
};

export type AttendanceToday = {
  date: string;
  today: AttendanceRecordView | null;
  branch: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    radiusMeters: number | null;
  } | null;
  hasFace: boolean;
};

export type CorrectionRequestView = {
  id: string;
  workDate: string;
  requestedCheckInAt: string;
  requestedCheckOutAt: string | null;
  originalCheckInAt: string | null;
  originalCheckOutAt: string | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  responseNote: string | null;
  reviewer?: { name: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
};

export const useGetAttendanceToday = () =>
  useQuery({
    queryKey: ["attendance", "today"],
    queryFn: async () => {
      const res = await apiGet<AttendanceToday>("/api/attendance");
      return res.data;
    },
    refetchOnWindowFocus: true,
  });

export const useAttendanceAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      action: "check-in" | "check-out";
      latitude: number;
      longitude: number;
      accuracy: number;
    }) => {
      const res = await apiPost("/api/attendance", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useGetAttendanceLogs = () =>
  useQuery({
    queryKey: ["attendance", "logs"],
    queryFn: async () => {
      const res = await apiGet<AttendanceRecordView[]>("/api/attendance/logs");
      return res.data;
    },
  });

export const useGetCorrections = () =>
  useQuery({
    queryKey: ["attendance", "corrections"],
    queryFn: async () => {
      const res = await apiGet<CorrectionRequestView[]>("/api/attendance/corrections");
      return res.data;
    },
  });

export const useCreateCorrection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      date: string;
      checkInAt: string;
      checkOutAt?: string;
      reason: string;
    }) => {
      const res = await apiPost("/api/attendance/corrections", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export type FaceTemplateResponse =
  | { template: number[]; consentAt: string }
  | null;

export const useGetFaceTemplate = (enabled = true) =>
  useQuery({
    queryKey: ["face-template"],
    queryFn: async () => {
      const res = await apiGet<FaceTemplateResponse>("/api/face-template");
      return res.data;
    },
    enabled,
  });

export const useEnrollFace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: number[]) => {
      const res = await apiPost("/api/face-template", {
        template,
        consent: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["face-template"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useRevokeFace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiDelete("/api/face-template");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["face-template"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};
