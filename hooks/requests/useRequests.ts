"use client";

import { apiGet, apiPost } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CorrectionRequestView } from "@/hooks/attendance/useAttendance";

export type LeaveRequestView = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  responseNote: string | null;
  reviewer?: { name: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
};

export const useGetLeaveRequests = () =>
  useQuery({
    queryKey: ["leave"],
    queryFn: async () => {
      const res = await apiGet<LeaveRequestView[]>("/api/leave");
      return res.data;
    },
  });

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      const res = await apiPost("/api/leave", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
    },
  });
};

export const useAdminRequests = () =>
  useQuery({
    queryKey: ["admin", "requests"],
    queryFn: async () => {
      const res = await apiGet<{
        corrections: (CorrectionRequestView & { userData: { name: string } })[];
        leaves: (LeaveRequestView & { userData: { name: string } })[];
      }>("/api/admin/requests");
      return res.data;
    },
  });

export const useDecideRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      type: "correction" | "leave";
      id: string;
      decision: "approve" | "reject";
      note?: string;
    }) => {
      const res = await apiPost("/api/admin/requests", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
    },
  });
};
