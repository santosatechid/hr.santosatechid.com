"use client";

import { apiGet, apiPost, apiPut } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PayrollRunSummary = {
  id: string;
  period: string;
  status: "draft" | "published";
  totalGross: string;
  totalNet: string;
  publishedAt: string | null;
  _count: { slips: number };
};

export type PayrollSlipRow = {
  id: string;
  period: string;
  gross: string;
  taxAllowance: string;
  pph21: string;
  jkn: string;
  jht: string;
  jp: string;
  netPay: string;
  breakdown: { branch?: string | null; taxMethod?: string; daysWorked?: number | null };
  userData: { name: string; employeeId: string | null };
};

export type PayrollIssue = { employee: string; message: string };

export const useGetPayrollRuns = () =>
  useQuery({
    queryKey: ["payroll", "runs"],
    queryFn: async () => {
      const res = await apiGet<PayrollRunSummary[]>("/api/payroll/runs");
      return res.data;
    },
  });

export const useGetPayrollPeriod = (period: string) =>
  useQuery({
    queryKey: ["payroll", "run", period],
    queryFn: async () => {
      const res = await apiGet<{
        run: PayrollRunSummary | null;
        slips: PayrollSlipRow[];
      }>(`/api/payroll/runs?period=${encodeURIComponent(period)}`);
      return res.data;
    },
    enabled: /^\d{4}-\d{2}$/.test(period),
  });

export const useBuildPayrollDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (period: string) => {
      const res = await apiPost("/api/payroll/runs", { period });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });
};

export const usePublishPayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiPut("/api/payroll/runs", { id, action: "publish" });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });
};

export type MyPayslip = {
  id: string;
  period: string;
  gross: string;
  taxAllowance: string;
  pph21: string;
  jkn: string;
  jht: string;
  jp: string;
  netPay: string;
  breakdown: { branch?: string | null; taxMethod?: string; daysWorked?: number | null };
  run: { publishedAt: string | null };
};

export const useGetMyPayslips = () =>
  useQuery({
    queryKey: ["payslips", "mine"],
    queryFn: async () => {
      const res = await apiGet<MyPayslip[]>("/api/payslips");
      return res.data;
    },
  });
