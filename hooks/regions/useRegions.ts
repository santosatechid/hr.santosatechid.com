"use client";

import { useQuery } from "@tanstack/react-query";

const REGION_API = "https://www.emsifa.com/api-wilayah-indonesia/api";

export type Region = { id: string; name: string };

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word === "dki" || word === "di"
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

const fetchRegions = async (path: string): Promise<Region[]> => {
  const response = await fetch(`${REGION_API}/${path}`);
  if (!response.ok) throw new Error("Gagal memuat data wilayah");
  const regions = (await response.json()) as Region[];
  return [...regions]
    .map((region) => ({ ...region, name: titleCase(region.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const useGetProvinces = () =>
  useQuery({
    queryKey: ["regions", "provinces"],
    queryFn: () => fetchRegions("provinces.json"),
    staleTime: Infinity,
  });

export const useGetCities = (provinceId: string) =>
  useQuery({
    queryKey: ["regions", "cities", provinceId],
    queryFn: () => fetchRegions(`regencies/${provinceId}.json`),
    enabled: Boolean(provinceId),
    staleTime: Infinity,
  });
