import type { MarketQuote } from "@/lib/market/types";

type NasdaqQuoteResponse = {
  data?: {
    symbol?: string;
    companyName?: string;
    exchange?: string;
    primaryData?: {
      lastSalePrice?: string;
      netChange?: string;
      percentageChange?: string;
      lastTradeTimestamp?: string;
      isRealTime?: boolean;
    };
    secondaryData?: {
      lastSalePrice?: string;
      netChange?: string;
      percentageChange?: string;
      lastTradeTimestamp?: string;
      isRealTime?: boolean;
    };
    marketStatus?: string;
  };
};

type NasdaqSummaryResponse = {
  data?: {
    summaryData?: Record<string, { value?: string }>;
  };
};

function parseAmount(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,%+\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseEasternTimestamp(value?: string) {
  if (!value) return null;
  const match = /^(\w{3}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2}) ([AP]M) ET$/.exec(value);
  if (!match) return null;
  const month = new Date(`${match[1]} 1, 2000`).getMonth();
  const hour12 = Number(match[4]) % 12;
  const hour = hour12 + (match[6] === "PM" ? 12 : 0);
  const localAsUtc = new Date(Date.UTC(Number(match[3]), month, Number(match[2]), hour, Number(match[5])));
  const offsetText = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset", hour: "2-digit" })
    .formatToParts(localAsUtc).find((part) => part.type === "timeZoneName")?.value;
  const offset = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(offsetText ?? "");
  if (!offset) return null;
  const offsetMinutes = (Number(offset[2]) * 60 + Number(offset[3] ?? 0)) * (offset[1] === "+" ? 1 : -1);
  return new Date(localAsUtc.getTime() - offsetMinutes * 60_000).toISOString();
}

export async function getNasdaqQuote(ticker: string): Promise<MarketQuote> {
  const symbol = ticker.toUpperCase();
  const baseUrl = `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}`;
  const url = `${baseUrl}/info?assetclass=stocks`;
  const source = { name: "Nasdaq", url: `https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(symbol.toLowerCase())}` };

  try {
    const requestOptions = {
      headers: { "User-Agent": "Mozilla/5.0 EdiumInsight/1.0", Accept: "application/json, text/plain, */*", Origin: "https://www.nasdaq.com" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    };
    const [response, summaryResponse] = await Promise.all([
      fetch(url, requestOptions),
      fetch(`${baseUrl}/summary?assetclass=stocks`, requestOptions).catch(() => null),
    ]);
    if (!response.ok) throw new Error(`Nasdaq returned HTTP ${response.status}`);
    const payload = await response.json() as NasdaqQuoteResponse;
    const summaryPayload = summaryResponse?.ok ? await summaryResponse.json() as NasdaqSummaryResponse : null;
    const data = payload.data;
    const quote = data?.primaryData?.lastSalePrice ? data.primaryData : data?.secondaryData;
    const summary = summaryPayload?.data?.summaryData;
    const range = summary?.FiftTwoWeekHighLow?.value ?? null;
    const timestamp = quote?.lastTradeTimestamp ?? null;
    return {
      ticker: symbol,
      companyName: data?.companyName ?? null,
      price: parseAmount(quote?.lastSalePrice ?? undefined),
      change: parseAmount(quote?.netChange ?? undefined),
      changePercent: parseAmount(quote?.percentageChange ?? undefined),
      currency: "USD",
      observedAt: parseEasternTimestamp(timestamp ?? undefined),
      isRealtime: quote?.isRealTime ?? null,
      marketStatus: data?.marketStatus ?? null,
      exchange: summary?.Exchange?.value ?? data?.exchange ?? null,
      sector: summary?.Sector?.value ?? null,
      industry: summary?.Industry?.value ?? null,
      marketCap: parseAmount(summary?.MarketCap?.value),
      oneYearTarget: parseAmount(summary?.OneYrTarget?.value),
      dividendYield: parseAmount(summary?.Yield?.value),
      fiftyTwoWeekRange: range,
      source,
      ...(!quote?.lastSalePrice ? { error: "Nasdaq did not return a current quote for this ticker." } : {}),
    };
  } catch (error) {
    return {
      ticker: symbol, companyName: null, price: null, change: null, changePercent: null,
      currency: "USD", observedAt: null, isRealtime: null, marketStatus: null, source,
      exchange: null, sector: null, industry: null, marketCap: null, oneYearTarget: null,
      dividendYield: null, fiftyTwoWeekRange: null,
      error: error instanceof Error ? error.message : "Quote source unavailable",
    };
  }
}