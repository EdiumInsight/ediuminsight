import { z } from "zod";
import { getGoogleNews } from "@/lib/market/news";
import { getRecentSecFilings } from "@/lib/market/sec";
import type { MarketNewsItem } from "@/lib/market/types";

const tickerSchema = z.string().max(120).optional();
const defaultTickers = ["MSFT", "NVDA", "GOOGL", "AMZN"];

export async function GET(request: Request) {
  const raw = tickerSchema.safeParse(new URL(request.url).searchParams.get("tickers") ?? undefined);
  if (!raw.success) return Response.json({ error: "Invalid ticker list" }, { status: 400 });
  const tickers = [...new Set((raw.data ?? defaultTickers.join(",")).split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  if (!tickers.length || tickers.length > 8 || tickers.some((ticker) => !/^[A-Z0-9.-]{1,12}$/.test(ticker))) {
    return Response.json({ error: "Provide 1 to 8 valid ticker symbols" }, { status: 400 });
  }
  const results = await Promise.all(tickers.map(async (ticker) => {
    const sources = await Promise.allSettled([getGoogleNews(ticker, 4), getRecentSecFilings(ticker, 3)]);
    return sources.flatMap((source) => source.status === "fulfilled" ? source.value : []) as MarketNewsItem[];
  }));
  const data = results.flat().sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return Response.json({ data, sources: ["Google News RSS", "SEC EDGAR"], fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
}