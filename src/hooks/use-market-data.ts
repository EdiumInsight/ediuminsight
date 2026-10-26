"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnnualFinancial, MarketNewsItem, MarketQuote } from "@/lib/market/types";

export function useMarketQuotes(tickers?: string[]) {
  const query = tickers?.join(",") ?? "default";
  return useQuery<{ data: MarketQuote[]; source: string; fetchedAt: string }>({
    queryKey: ["market-quotes", query],
    queryFn: async () => {
      const response = await fetch(`/api/market${tickers?.length ? `?tickers=${encodeURIComponent(query)}` : ""}`);
      if (!response.ok) throw new Error("Market quote source is unavailable.");
      return response.json();
    },
    staleTime: 60_000,
  });
}

export function useFinancials(ticker: string) {
  return useQuery<{ company: { ticker: string; name: string }; financials: AnnualFinancial[]; source: { name: string; url: string }; caveats: string[] }>({
    queryKey: ["financials", ticker],
    queryFn: async () => {
      const response = await fetch(`/api/analysis/${encodeURIComponent(ticker)}`);
      if (!response.ok) throw new Error((await response.json()).error ?? "SEC financial data is unavailable.");
      return response.json();
    },
    staleTime: 86_400_000,
    enabled: Boolean(ticker),
  });
}

export function useMarketNews(tickers?: string[]) {
  const query = tickers?.join(",") ?? "default";
  return useQuery<{ data: MarketNewsItem[]; sources: string[]; fetchedAt: string }>({
    queryKey: ["market-news", query],
    queryFn: async () => {
      const response = await fetch(`/api/news${tickers?.length ? `?tickers=${encodeURIComponent(query)}` : ""}`);
      if (!response.ok) throw new Error("News sources are unavailable.");
      return response.json();
    },
    staleTime: 900_000,
  });
}