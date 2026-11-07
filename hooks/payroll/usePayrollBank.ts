"use client";

import { apiGet, apiPut } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PayrollBankRow = {
  id: string;
  employeeId: string | null;
  name: string;
  isActive: boolean;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountHolder: string | null;
};

export type PayrollBankInput = Pick<
  PayrollBankRow,
  "id" | "bankName" | "bankAccount" | "bankAccountHolder"
>;

export const useGetPayrollBank = () =>
  useQuery({
    queryKey: ["payroll", "bank"],
    queryFn: async () => {
      const res = await apiGet<PayrollBankRow[]>("/api/payroll/bank");
      return res.data;
    },
  });

export const useUpdatePayrollBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: PayrollBankInput[]) => {
      const res = await apiPut("/api/payroll/bank", { rows });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "bank"] });
    },
  });
};
