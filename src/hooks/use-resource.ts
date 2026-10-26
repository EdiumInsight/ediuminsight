"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResource } from "@/lib/api/resources";

type ResourceResult<T> = { data: T[]; count: number };

export function useResource<T>(resource: ApiResource) {
  return useQuery<ResourceResult<T>>({
    queryKey: ["resource", resource],
    queryFn: async () => {
      const response = await fetch(`/api/${resource}`);
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to load data");
      return response.json() as Promise<ResourceResult<T>>;
    },
  });
}

export function useCreateResource<TInput extends Record<string, unknown>, TOutput>(resource: ApiResource) {
  const queryClient = useQueryClient();
  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (input) => {
      const response = await fetch(`/api/${resource}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to save data");
      return (await response.json()).data as TOutput;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resource", resource] }),
  });
}