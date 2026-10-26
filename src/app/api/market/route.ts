import { z } from "zod";
import { getNasdaqQuote } from "@/lib/market/nasdaq";

const querySchema = z.string().max(120).optional();
const defaultTickers = ["MSFT", "NVDA", "BRK.B", "V", "COST", "AMZN", "GOOGL", "LLY"];

export async function GET(request: Request) {
  const raw = querySchema.safeParse(new URL(request.url).searchParams.get("tickers") ?? undefined);
  if (!raw.success) return Response.json({ error: "Invalid ticker list" }, { status: 400 });
  const tickers = [...new Set((raw.data ?? defaultTickers.join(",")).split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  if (!tickers.length || tickers.length > 12 || tickers.some((ticker) => !/^[A-Z0-9.-]{1,12}$/.test(ticker))) {
    return Response.json({ error: "Provide 1 to 12 valid ticker symbols" }, { status: 400 });
  }
  const quotes = await Promise.all(tickers.map(getNasdaqQuote));
  return Response.json({ data: quotes, source: "Nasdaq", fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}