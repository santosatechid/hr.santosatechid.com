"use client";

import { apiGet } from "@/lib/http/apiClient";
import { useQuery } from "@tanstack/react-query";

export type BotWaConnection = {
  connection: "success" | "error";
  state?: string;
  instance?: string;
  message?: string;
};

export const useGetConnectionBotWa = (enabled = true) => {
  return useQuery({
    queryKey: ["botwa-connection"],
    queryFn: async () => {
      const res = await apiGet<BotWaConnection>("/api/whatsapp/bulk/send");
      return res.data;
    },
    enabled,
  });
};
